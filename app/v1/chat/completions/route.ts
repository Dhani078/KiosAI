import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, deductTokens, logUsage, isModelAllowedForTier, getModelMultiplier } from "@/lib/keys";
import { checkRateLimit } from "@/lib/ratelimit";
import { UPSTREAM_URL, UPSTREAM_KEY, errorResponse, parseUpstreamJson } from "@/lib/proxy-http";
import { resolveModelAlias } from "@/lib/model-utils";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const authHeader = req.headers.get("authorization") || "";
  const rawKey = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!rawKey) {
    return errorResponse("Missing Authorization header. Use Bearer kios-...", 401, "missing_key");
  }

  // 1. Validate API Key
  const auth = await validateApiKey(rawKey);
  if (!auth.valid || !auth.user || !auth.key) {
    return errorResponse(auth.error || "Unauthorized", 401, "invalid_key");
  }

  // 2. Check Rate Limit
  const rateLimit = checkRateLimit(auth.key.id, auth.key.rate_limit_per_min || 60);
  const rateHeaders = {
    "X-RateLimit-Limit": String(auth.key.rate_limit_per_min || 60),
    "X-RateLimit-Remaining": String(rateLimit.remaining),
    "X-RateLimit-Reset": String(rateLimit.resetSeconds),
  };

  if (!rateLimit.allowed) {
    return errorResponse(
      `Rate limit exceeded. Maksimal ${auth.key.rate_limit_per_min} request per menit. Coba lagi dalam ${rateLimit.resetSeconds} detik.`,
      429,
      "rate_limit_exceeded",
      { ...rateHeaders, "Retry-After": String(rateLimit.resetSeconds) }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON payload", 400, "invalid_json");
  }

  const rawModel = body.model;
  if (!rawModel) {
    return errorResponse("Field 'model' is required", 400, "missing_model");
  }
  const requestedModel = resolveModelAlias(rawModel);
  body.model = requestedModel;

  // 2. Validate Allowed Models (on Key)
  if (auth.key.allowed_models) {
    try {
      const allowed: string[] = JSON.parse(auth.key.allowed_models);
      if (Array.isArray(allowed) && allowed.length > 0 && !allowed.includes(requestedModel)) {
        return errorResponse(
          `Model '${requestedModel}' is not allowed for this API key. Allowed: ${allowed.join(", ")}`,
          403,
          "model_forbidden"
        );
      }
    } catch {
      // Ignore parse error, allow fallback
    }
  }

  // 3. Validate Tier Access (Bronze vs Silver vs Gold)
  if (!isModelAllowedForTier(auth.user.tier, requestedModel)) {
    return errorResponse(
      `Model '${requestedModel}' memerlukan paket yang lebih tinggi (Paket Anda saat ini: ${auth.user.tier.toUpperCase()}). Silakan upgrade ke Silver atau Gold di KiosAI.`,
      403,
      "tier_restricted"
    );
  }

  const isStream = Boolean(body.stream);
  const targetUrl = `${UPSTREAM_URL}/v1/chat/completions`;

  try {
    const upstreamHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(UPSTREAM_KEY ? { Authorization: `Bearer ${UPSTREAM_KEY}` } : {}),
    };

    const upstreamRes = await fetch(targetUrl, {
      method: "POST",
      headers: upstreamHeaders,
      body: JSON.stringify(isStream ? { ...body, stream_options: { ...(body.stream_options || {}), include_usage: true } } : body),
    });

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text();
      const latency = Date.now() - startTime;
      await logUsage({
        apiKeyId: auth.key.id,
        userId: auth.user.id,
        model: requestedModel,
        promptTokens: 0,
        completionTokens: 0,
        latencyMs: latency,
        statusCode: upstreamRes.status,
      });
      return new NextResponse(errText, {
        status: upstreamRes.status,
        headers: { "Content-Type": upstreamRes.headers.get("content-Type") || "application/json" },
      });
    }

    // 3. Handle Streaming Response
    if (isStream && upstreamRes.body) {
      const reader = upstreamRes.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null = null;
      let deltas = 0;

      const stream = new ReadableStream({
        async pull(controller) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            // Bill real upstream usage (requested via stream_options.include_usage).
            // ponytail: fallback to chunk count when upstream sends no usage; add tokenizer when that happens often.
            const promptTokens = usage?.prompt_tokens ?? 15;
            const completionTokens = usage?.completion_tokens ?? Math.max(1, deltas);
            const totalTokens = usage?.total_tokens ?? promptTokens + completionTokens;
            await deductTokens(auth.user!.id, totalTokens, getModelMultiplier(requestedModel));
            await logUsage({
              apiKeyId: auth.key!.id,
              userId: auth.user!.id,
              model: requestedModel,
              promptTokens,
              completionTokens,
              latencyMs: Date.now() - startTime,
              statusCode: 200,
            });
            return;
          }

          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
            try {
              const j = JSON.parse(line.slice(6));
              if (j.usage) usage = j.usage;
              if (j.choices?.[0]?.delta) deltas++;
            } catch {}
          }
          controller.enqueue(value);
        },
      });

      return new NextResponse(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          ...rateHeaders,
        },
      });
    }

    // 4. Handle Non-Streaming JSON Response
    const rawText = await upstreamRes.text();
    const data = parseUpstreamJson(rawText);
    const promptTokens = data.usage?.prompt_tokens || 15;
    const completionTokens = data.usage?.completion_tokens || 35;
    const totalTokens = data.usage?.total_tokens || promptTokens + completionTokens;

    const latency = Date.now() - startTime;
    const multiplier = getModelMultiplier(requestedModel);
    const deducted = await deductTokens(auth.user.id, totalTokens, multiplier);
    await logUsage({
      apiKeyId: auth.key.id,
      userId: auth.user.id,
      model: requestedModel,
      promptTokens,
      completionTokens,
      latencyMs: latency,
      statusCode: 200,
    });

    const isLowBalance = Number(auth.user.balance_tokens) - deducted < 20000;
    const finalHeaders = {
      ...rateHeaders,
      ...(isLowBalance ? { "X-Quota-Warning": "low_balance" } : {}),
    };

    return NextResponse.json(data, { headers: finalHeaders });
  } catch (err: any) {
    return errorResponse(`Upstream error: ${err.message}`, 502, "bad_gateway");
  }
}
