import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, deductTokens, logUsage, isModelAllowedForTier } from "@/lib/keys";
import { calculateTokenCost } from "@/lib/model-pricing";
import { checkRateLimit, acquireStreamSlot, releaseStreamSlot } from "@/lib/ratelimit";
import { UPSTREAM_URL, UPSTREAM_KEY, errorResponse, parseUpstreamJson } from "@/lib/proxy-http";
import { resolveModelAlias } from "@/lib/model-utils";
import { createBilledStream } from "@/lib/stream-billing";

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
    const isQuota = Boolean(auth.error?.includes("exhausted"));
    return errorResponse(auth.error || "Unauthorized", isQuota ? 402 : 401, isQuota ? "insufficient_quota" : "invalid_key");
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
      `Rate limit exceeded (${auth.key.rate_limit_per_min}/min). Tunggu ${rateLimit.resetSeconds}s.`,
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

  // Validate Allowed Models (on Key)
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
    } catch {}
  }

  // Validate Model Access
  if (!isModelAllowedForTier(auth.user.tier, requestedModel)) {
    return errorResponse(
      `Model '${rawModel}' tidak tersedia di tier FREE. Model gratis hanya Atria Dawn. Beli paket Pro untuk membuka seluruh model AI.`,
      403,
      "tier_restricted"
    );
  }

  const isStream = Boolean(body.stream);
  if (isStream && !acquireStreamSlot(auth.key.id, 3)) {
    return errorResponse(
      "Maksimal 3 stream simultan tercapai. Tunggu stream sebelumnya selesai.",
      429,
      "concurrent_stream_limit",
      rateHeaders
    );
  }

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
      if (isStream) releaseStreamSlot(auth.key.id);
      const errText = await upstreamRes.text();
      const latency = Date.now() - startTime;
      await logUsage({
        apiKeyId: auth.key.id, userId: auth.user.id, model: requestedModel,
        promptTokens: 0, completionTokens: 0, latencyMs: latency, statusCode: upstreamRes.status,
      });
      let upstreamMessage = errText.slice(0, 400);
      try {
        upstreamMessage = JSON.parse(errText)?.error?.message || upstreamMessage;
      } catch {}
      return errorResponse(`Upstream (${upstreamRes.status}): ${upstreamMessage}`, upstreamRes.status, "upstream_error");
    }

    // Handle Streaming Response with Abort Protection
    if (isStream && upstreamRes.body) {
      const billedStream = createBilledStream({
        reader: upstreamRes.body.getReader(),
        userId: auth.user.id,
        keyId: auth.key.id,
        model: requestedModel,
        startTime,
      });

      return new NextResponse(billedStream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          ...rateHeaders,
        },
      });
    }

    // Handle Non-Streaming JSON Response
    const rawText = await upstreamRes.text();
    const data = parseUpstreamJson(rawText);
    const promptTokens = data.usage?.prompt_tokens || 15;
    const completionTokens = data.usage?.completion_tokens || 35;

    const latency = Date.now() - startTime;
    const actualCost = calculateTokenCost(requestedModel, promptTokens, completionTokens);
    const deducted = await deductTokens(auth.user.id, actualCost, 1.0);
    await logUsage({
      apiKeyId: auth.key.id, userId: auth.user.id, model: requestedModel,
      promptTokens, completionTokens, latencyMs: latency, statusCode: 200,
    });

    const isLowBalance = Number(auth.user.balance_tokens) - deducted < 20000;
    const finalHeaders = {
      ...rateHeaders,
      ...(isLowBalance ? { "X-Quota-Warning": "low_balance" } : {}),
    };

    return NextResponse.json(data, { headers: finalHeaders });
  } catch (err: any) {
    if (isStream) releaseStreamSlot(auth.key.id);
    return errorResponse(`Upstream error: ${err.message}`, 502, "bad_gateway");
  }
}
