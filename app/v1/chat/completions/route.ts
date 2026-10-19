import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, deductTokens, logUsage, isModelAllowedForTier } from "@/lib/keys";
import { calculateTokenCost } from "@/lib/model-pricing";
import { checkRateLimit, acquireStreamSlot, releaseStreamSlot } from "@/lib/ratelimit";
import { UPSTREAM_URL, UPSTREAM_KEY, errorResponse, parseUpstreamJson } from "@/lib/proxy-http";
import { resolveModelAlias } from "@/lib/model-utils";
import { createBilledStream } from "@/lib/stream-billing";
import { buildQuotaExhaustedError } from "@/lib/bonus-vault";
import { executeResilientStream, getFallbackCandidates } from "@/lib/failover-router";
import { evaluatePriorityAdmission } from "@/lib/priority-scheduler";
import { recordInferenceTelemetry } from "@/lib/edge-telemetry";
import { sendLowBalanceWebhook } from "@/lib/balance-alerts";
import { injectModelMasking, maskModelInJson } from "@/lib/prompt-defense";
import { readSessionUserId } from "@/lib/session";
import { createPlaygroundToken } from "@/lib/session-key";
import {
  isCacheEligible,
  buildCanonicalCacheKey,
  lookupEdgeCache,
  wrapStreamForEdgeCaching,
  CACHE_HIT_DISCOUNT_MULTIPLIER,
} from "@/lib/edge-cache";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // Strict Edge Security Guard: pastikan request produksi melalui Cloudflare Edge
  const host = req.headers.get("host") || "";
  const isLocalDev = host.includes("localhost") || host.includes("127.0.0.1");
  if (!isLocalDev && !req.headers.get("cf-ray")) {
    return errorResponse("Direct edge bypass forbidden. Request must pass Cloudflare Edge.", 403, "edge_required");
  }

  let rawKey = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!rawKey) {
    const sessionUserId = readSessionUserId(req);
    if (sessionUserId) {
      rawKey = createPlaygroundToken(sessionUserId);
    }
  }
  if (!rawKey) return errorResponse("Missing Authorization header. Use Bearer kios-...", 401, "missing_key");

  const auth = await validateApiKey(rawKey);
  if (!auth.valid || !auth.user || !auth.key) {
    if (auth.error?.includes("exhausted")) {
      const errBody = buildQuotaExhaustedError(auth.user?.balance_tokens || 0, auth.user?.locked_bonus_tokens || 0);
      return NextResponse.json(errBody, { status: 402 });
    }
    return errorResponse(auth.error || "Unauthorized", 401, "invalid_key");
  }

  const user = auth.user;
  const key = auth.key;

  const rateLimit = checkRateLimit(key.id, key.rate_limit_per_min || 60);
  const rateHeaders = {
    "X-RateLimit-Limit": String(key.rate_limit_per_min || 60),
    "X-RateLimit-Remaining": String(rateLimit.remaining),
    "X-RateLimit-Reset": String(rateLimit.resetSeconds),
  };
  if (!rateLimit.allowed) {
    return errorResponse(`Rate limit exceeded (${key.rate_limit_per_min}/min). Tunggu ${rateLimit.resetSeconds}s.`, 429, "rate_limit_exceeded", { ...rateHeaders, "Retry-After": String(rateLimit.resetSeconds) });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON payload", 400, "invalid_json");
  }

  const rawModel = body.model;
  if (!rawModel) return errorResponse("Field 'model' is required", 400, "missing_model");
  const requestedModel = resolveModelAlias(rawModel);
  body.model = requestedModel;

  if (auth.key.allowed_models) {
    try {
      const allowed: string[] = JSON.parse(auth.key.allowed_models);
      if (Array.isArray(allowed) && allowed.length > 0 && !allowed.includes(requestedModel)) {
        return errorResponse(`Model '${requestedModel}' is not allowed for this key.`, 403, "model_forbidden");
      }
    } catch {}
  }

  if (!isModelAllowedForTier(auth.user.tier, requestedModel)) {
    return errorResponse(`Model '${rawModel}' hanya tersedia untuk paket Pro. Pengguna Free dapat menggunakan DeepSeek V4.1 Flash.`, 403, "tier_restricted");
  }

  // Model Identity & Masking Guard: persona model selalu konsisten dengan model yang diminta
  injectModelMasking(body.messages, requestedModel);

  // Priority Scheduler & Edge Micro-Pacing
  const admission = await evaluatePriorityAdmission(auth.key.id, req.headers, Boolean(body.stream), 3);
  if (!admission.allowed) {
    return errorResponse(`Priority queue saturated. Coba lagi dalam ${admission.retryAfterSeconds || 1}s.`, 429, "rate_limit_exceeded", { ...rateHeaders, "Retry-After": String(admission.retryAfterSeconds || 1) });
  }

  // Edge Exact Prompt Caching Lookup
  const cacheEligible = isCacheEligible(body, req.headers.get("cache-control"));
  const cacheKey = cacheEligible ? buildCanonicalCacheKey(auth.user.id, body) : null;
  if (cacheKey) {
    const cached = await lookupEdgeCache(cacheKey);
    if (cached) {
      const cost = Math.max(1, Math.round(calculateTokenCost(requestedModel, cached.meta.promptTokens, cached.meta.completionTokens) * CACHE_HIT_DISCOUNT_MULTIPLIER));
      await deductTokens(auth.user.id, cost, 1.0);
      await logUsage({ apiKeyId: auth.key.id, userId: auth.user.id, model: requestedModel, promptTokens: cached.meta.promptTokens, completionTokens: cached.meta.completionTokens, latencyMs: Date.now() - startTime, statusCode: 200 });
      recordInferenceTelemetry({ modelId: requestedModel, ttfbMs: Date.now() - startTime, statusCode: 200, didFailover: false, cacheHit: true });
      return cached.response;
    }
  }

  const isStream = Boolean(body.stream);
  if (isStream) {
    if (!acquireStreamSlot(auth.key.id, admission.effectiveMaxConcurrent)) {
      return errorResponse("Maksimal stream simultan tercapai. Tunggu stream selesai.", 429, "concurrent_stream_limit", rateHeaders);
    }
    try {
      const result = await executeResilientStream(requestedModel, body);
      let outStream = result.stream;
      if (cacheKey) outStream = wrapStreamForEdgeCaching(outStream, cacheKey);

      recordInferenceTelemetry({ modelId: requestedModel, ttfbMs: Date.now() - startTime, statusCode: 200, didFailover: result.didFailover, cacheHit: false });
      const billed = createBilledStream({
        reader: outStream.getReader(), userId: user.id, keyId: key.id, model: result.effectiveModel, startTime,
        onSettled: (cost) => {
          const rem = Number(user.balance_tokens) - cost;
          if (user.alert_webhook_url && rem < (user.alert_threshold_tokens || 50000)) {
            sendLowBalanceWebhook({ userId: user.id, email: user.email, webhookUrl: user.alert_webhook_url, balance: rem, threshold: user.alert_threshold_tokens || 50000 }).catch(() => {});
          }
        },
      });

      return new NextResponse(billed, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive",
          ...rateHeaders, "X-Kios-Lane": admission.lane,
        },
      });
    } catch (err: any) {
      releaseStreamSlot(auth.key.id);
      const match = String(err.message).match(/UPSTREAM_RETRYABLE_(\d+)/);
      const statusCode = match ? Number(match[1]) : 502;
      return errorResponse(`Upstream error: ${err.message}`, statusCode, "upstream_error");
    }
  }

  // Non-Streaming Request dengan Failover & Model Masking
  try {
    const candidates = [requestedModel, ...getFallbackCandidates(requestedModel)];
    let upstreamRes: Response | null = null;
    let didFailover = false;

    for (let i = 0; i < candidates.length; i++) {
      didFailover = i > 0;
      body.model = candidates[i];
      upstreamRes = await fetch(`${UPSTREAM_URL}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(UPSTREAM_KEY ? { Authorization: `Bearer ${UPSTREAM_KEY}` } : {}) },
        body: JSON.stringify(body),
      });
      if (upstreamRes.ok) break;
      if (![408, 429, 500, 502, 503, 504, 522, 524].includes(upstreamRes.status)) break;
    }

    if (!upstreamRes || !upstreamRes.ok) {
      const errText = upstreamRes ? await upstreamRes.text() : "Unknown upstream error";
      const status = upstreamRes ? upstreamRes.status : 502;
      await logUsage({ apiKeyId: auth.key.id, userId: auth.user.id, model: requestedModel, promptTokens: 0, completionTokens: 0, latencyMs: Date.now() - startTime, statusCode: status });
      return errorResponse(`Upstream (${status}): ${errText.slice(0, 300)}`, status, "upstream_error");
    }

    const data = maskModelInJson(parseUpstreamJson(await upstreamRes.text()), requestedModel);
    const pTokens = data.usage?.prompt_tokens || 15;
    const cTokens = data.usage?.completion_tokens || 35;
    const actualCost = calculateTokenCost(requestedModel, pTokens, cTokens);
    const deducted = await deductTokens(user.id, actualCost, 1.0, key.id);
    await logUsage({ apiKeyId: key.id, userId: user.id, model: requestedModel, promptTokens: pTokens, completionTokens: cTokens, latencyMs: Date.now() - startTime, statusCode: 200 });
    recordInferenceTelemetry({ modelId: requestedModel, ttfbMs: Date.now() - startTime, statusCode: 200, didFailover, cacheHit: false });

    const rem = Number(user.balance_tokens) - deducted;
    if (user.alert_webhook_url && rem < (user.alert_threshold_tokens || 50000)) {
      sendLowBalanceWebhook({ userId: user.id, email: user.email, webhookUrl: user.alert_webhook_url, balance: rem, threshold: user.alert_threshold_tokens || 50000 }).catch(() => {});
    }

    const isLow = rem < 20000;
    return NextResponse.json(data, { headers: { ...rateHeaders, "X-Kios-Lane": admission.lane, ...(isLow ? { "X-Quota-Warning": "low_balance" } : {}) } });
  } catch (err: any) {
    return errorResponse(`Upstream error: ${err.message}`, 502, "upstream_error");
  }
}
