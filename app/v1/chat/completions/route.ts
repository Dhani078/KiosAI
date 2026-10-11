import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, deductTokens, logUsage, isModelAllowedForTier, getModelMultiplier } from "@/lib/keys";
import { checkRateLimit } from "@/lib/ratelimit";
import { errorResponse, UPSTREAM_URL, UPSTREAM_KEY } from "@/lib/proxy-http";

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

  const requestedModel = body.model;
  if (!requestedModel) {
    return errorResponse("Field 'model' is required", 400, "missing_model");
  }

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
      body: JSON.stringify(body),
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

    const contentType = upstreamRes.headers.get("content-type") || "";
    const isEventStream = isStream || contentType.includes("event-stream");

    // 3. Handle Streaming Response
    if (isEventStream && upstreamRes.body) {
      const reader = upstreamRes.body.getReader();
      const decoder = new TextDecoder();
      let streamedTokensEst = 0;

      const stream = new ReadableStream({
        async pull(controller) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            const latency = Date.now() - startTime;
            const multiplier = getModelMultiplier(requestedModel);
            // Deduct estimated tokens (approx 1 token per chunk)
            const rawTokens = Math.max(20, streamedTokensEst);
            const deducted = await deductTokens(auth.user!.id, rawTokens, multiplier);
            await logUsage({
              apiKeyId: auth.key!.id,
              userId: auth.user!.id,
              model: requestedModel,
              promptTokens: 10,
              completionTokens: rawTokens,
              latencyMs: latency,
              statusCode: 200,
            });
            return;
          }

          const chunkText = decoder.decode(value, { stream: true });
          // Count chunks roughly as completion progress
          const matches = (chunkText.match(/"delta"/g) || []).length;
          streamedTokensEst += matches || 1;

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
    const data = await upstreamRes.json();
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
