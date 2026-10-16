import { UPSTREAM_URL, UPSTREAM_KEY } from "./proxy-http";
import { getModelPricing, ModelPricing } from "./model-pricing";

export interface FailoverResult {
  stream: ReadableStream<Uint8Array>;
  usedModel: string;
  effectiveModel: string;
  didFailover: boolean;
}

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504, 522, 524]);
const TTFB_TIMEOUT_MS = 3500;

const FALLBACK_MAP: Record<string, string[]> = {
  "tokenharbor/deepseek-v4.1-flash:free": [
    "cf/@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
    "ag/gemini-3.8-flash-high",
  ],
  "ag/claude-sonnet-4-6": [
    "kr/claude-sonnet-4",
    "cx/gpt-6-luna",
  ],
  "cx/gpt-6-luna": [
    "ag/gemini-3.8-flash-high",
    "kr/claude-sonnet-4",
  ],
  "ag/gemini-3.8-flash-high": [
    "ag/gemini-3.8-flash-medium",
    "cf/@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  ],
};

export function getFallbackCandidates(modelId: string): string[] {
  return FALLBACK_MAP[modelId] || [];
}

/**
 * Resolves effective pricing ensuring fallback never overcharges the user.
 */
export function resolveEffectivePricing(requested: ModelPricing, actual: ModelPricing): ModelPricing {
  return {
    input: String(Math.min(Number(requested.input) || 0, Number(actual.input) || 0)),
    output: String(Math.min(Number(requested.output) || 0, Number(actual.output) || 0)),
    cached: requested.cached,
    formatted: requested.formatted,
  };
}

async function probeFirstChunk(
  targetModel: string,
  payload: Record<string, unknown>,
  timeoutMs: number
): Promise<ReadableStream<Uint8Array>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("TTFB_TIMEOUT")), timeoutMs);

  try {
    const body = JSON.stringify({
      ...payload,
      model: targetModel,
      stream: true,
      stream_options: { ...(payload.stream_options as any || {}), include_usage: true },
    });

    const res = await fetch(`${UPSTREAM_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(UPSTREAM_KEY ? { Authorization: `Bearer ${UPSTREAM_KEY}` } : {}),
      },
      body,
      signal: controller.signal,
    });

    if (!res.ok || !res.body) {
      if (RETRYABLE_STATUS_CODES.has(res.status)) {
        throw new Error(`UPSTREAM_RETRYABLE_${res.status}`);
      }
      const errText = await res.text().catch(() => "Unknown upstream error");
      throw new Error(`UPSTREAM_FATAL_${res.status}: ${errText}`);
    }

    const reader = res.body.getReader();
    const firstRead = await reader.read();
    clearTimeout(timer);

    if (firstRead.done || !firstRead.value) {
      reader.releaseLock();
      throw new Error("UPSTREAM_EMPTY_STREAM");
    }

    const firstChunkText = new TextDecoder().decode(firstRead.value);
    if (
      firstChunkText.includes('"error":') &&
      (firstChunkText.includes("rate_limit") || firstChunkText.includes("overloaded") || firstChunkText.includes("429"))
    ) {
      await reader.cancel().catch(() => {});
      throw new Error("UPSTREAM_SSE_SOFT_429");
    }

    return new ReadableStream<Uint8Array>({
      start(streamController) {
        streamController.enqueue(firstRead.value);
      },
      async pull(streamController) {
        try {
          const { done, value } = await reader.read();
          if (done) streamController.close();
          else streamController.enqueue(value);
        } catch (err) {
          streamController.error(err);
        }
      },
      async cancel(reason) {
        await reader.cancel(reason).catch(() => {});
      },
    });
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

export async function executeResilientStream(
  primaryModel: string,
  payload: Record<string, unknown>
): Promise<FailoverResult> {
  const fallbacks = getFallbackCandidates(primaryModel);
  const candidates = [primaryModel, ...fallbacks];

  let lastError: unknown = null;

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    try {
      const stream = await probeFirstChunk(candidate, payload, TTFB_TIMEOUT_MS);
      return {
        stream,
        usedModel: candidate,
        effectiveModel: primaryModel,
        didFailover: i > 0,
      };
    } catch (err: any) {
      lastError = err;
      if (err?.message?.startsWith("UPSTREAM_FATAL_400")) throw err;
    }
  }

  throw lastError ?? new Error("ALL_UPSTREAM_TARGETS_EXHAUSTED");
}
