import crypto from "crypto";
import { buildCanonicalPayloadString } from "./prompt-normalizer";

export interface CacheMeta {
  promptTokens: number;
  completionTokens: number;
}

const MAX_CACHEABLE_BYTES = 1024 * 1024; // 1 MB
const DEFAULT_TTL_SECONDS = 600; // 10 menit
export const CACHE_HIT_DISCOUNT_MULTIPLIER = 0.2; // Diskon 80% (User hanya bayar 20%)

export function isCacheEligible(body: Record<string, unknown>, cacheControlHeader?: string | null): boolean {
  if (cacheControlHeader && /no-cache|no-store/i.test(cacheControlHeader)) {
    return false;
  }
  const temp = typeof body.temperature === "number" ? body.temperature : 1;
  const topP = typeof body.top_p === "number" ? body.top_p : 1;
  const n = typeof body.n === "number" ? body.n : 1;
  return (temp === 0 || topP === 0) && n === 1;
}

function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function buildCanonicalCacheKey(userId: string, body: Record<string, unknown>): string {
  const canonicalPayload = buildCanonicalPayloadString(body);
  const tenantHash = sha256Hex(`tenant:${userId}`);
  const payloadHash = sha256Hex(canonicalPayload);
  const safeModel = String(body.model || "unknown").replace(/[^a-zA-Z0-9._-]/g, "_");
  return `https://cache.kiosai.internal/v1/exact/${tenantHash}/${safeModel}/${payloadHash}`;
}

interface CacheStorageWithDefault {
  default?: {
    match: (req: Request) => Promise<Response | undefined>;
    put: (req: Request, res: Response) => Promise<void>;
  };
}

export async function lookupEdgeCache(cacheKeyUrl: string): Promise<{ response: Response; meta: CacheMeta } | null> {
  const globalCaches = (globalThis as { caches?: CacheStorageWithDefault }).caches;
  if (!globalCaches || !globalCaches.default) return null;

  try {
    const cachedRes = await globalCaches.default.match(new Request(cacheKeyUrl, { method: "GET" }));
    if (!cachedRes) return null;

    const promptTokens = Number(cachedRes.headers.get("X-Kios-Prompt-Tokens") || "0");
    const completionTokens = Number(cachedRes.headers.get("X-Kios-Completion-Tokens") || "0");
    if (promptTokens <= 0 && completionTokens <= 0) return null;

    const headers = new Headers(cachedRes.headers);
    headers.set("X-Kios-Cache", "HIT");
    headers.set("X-Kios-Discount", "80%");

    return {
      response: new Response(cachedRes.body, { status: 200, headers }),
      meta: { promptTokens, completionTokens },
    };
  } catch {
    return null;
  }
}

export function wrapStreamForEdgeCaching(
  sourceStream: ReadableStream<Uint8Array>,
  cacheKeyUrl: string,
  ttlSeconds = DEFAULT_TTL_SECONDS
): ReadableStream<Uint8Array> {
  const globalCaches = (globalThis as { caches?: CacheStorageWithDefault }).caches;
  if (!globalCaches || !globalCaches.default) return sourceStream;

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  let overflowed = false;
  let sawDoneMarker = false;
  let sawValidFinishReason = false;
  let exactUsage: CacheMeta | null = null;
  const decoder = new TextDecoder();

  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      controller.enqueue(chunk);
      if (overflowed) return;

      totalBytes += chunk.byteLength;
      if (totalBytes > MAX_CACHEABLE_BYTES) {
        overflowed = true;
        chunks.length = 0;
        return;
      }

      chunks.push(chunk.slice());
      const text = decoder.decode(chunk, { stream: true });
      if (text.includes("data: [DONE]")) sawDoneMarker = true;
      if (/"finish_reason"\s*:\s*"(stop|tool_calls)"/.test(text)) sawValidFinishReason = true;
      if (text.includes('"usage":')) {
        for (const line of text.split("\n")) {
          if (line.startsWith("data: ") && !line.includes("[DONE]")) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.usage?.prompt_tokens != null) {
                exactUsage = {
                  promptTokens: Number(parsed.usage.prompt_tokens),
                  completionTokens: Number(parsed.usage.completion_tokens || 0),
                };
              }
            } catch {}
          }
        }
      }
    },
    flush() {
      if (overflowed || !sawDoneMarker || !sawValidFinishReason || !exactUsage) return;
      const combined = new Uint8Array(totalBytes);
      let offset = 0;
      for (const part of chunks) {
        combined.set(part, offset);
        offset += part.byteLength;
      }
      const resToCache = new Response(combined, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": `public, s-maxage=${ttlSeconds}`,
          "X-Kios-Prompt-Tokens": String(exactUsage.promptTokens),
          "X-Kios-Completion-Tokens": String(exactUsage.completionTokens),
          "X-Kios-Cache": "MISS",
        },
      });
      globalCaches.default.put(new Request(cacheKeyUrl, { method: "GET" }), resToCache).catch(() => {});
    },
  });

  return sourceStream.pipeThrough(transform);
}
