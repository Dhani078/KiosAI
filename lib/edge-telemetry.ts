import { db } from "./db";
import { VERIFIED_MODEL_IDS } from "./verified-models";

export interface TelemetrySample {
  modelId: string;
  ttfbMs: number;
  statusCode: number;
  didFailover: boolean;
  cacheHit: boolean;
}

interface BucketState {
  modelId: string;
  windowUnixSec: number;
  totalRequests: number;
  successCount: number;
  failoverCount: number;
  cacheHitCount: number;
  ttfbSamples: number[];
}

const FLUSH_INTERVAL_MS = 10_000;
const MAX_SAMPLES_PER_BUCKET = 200;
const MAX_BUCKETS_BEFORE_FLUSH = 64;

const activeBuckets = new Map<string, BucketState>();
let flushInFlight = false;
let lastFlushTimestamp = Date.now();

function computePercentile(sorted: number[], percentile: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((percentile / 100) * sorted.length) - 1)
  );
  return Math.round(sorted[idx]);
}

function formatUnixToMysqlDatetime(unixSec: number): string {
  return new Date(unixSec * 1000).toISOString().slice(0, 19).replace("T", " ");
}

/**
 * Merekam sampel telemetri secara asinkron di RAM tanpa membebani jalur kritis.
 * Mengagregasi data dalam tumbling window 10 detik dan mem-flush batch ke TiDB.
 * Anti-cardinality explosion & anti-hotspot TiKV.
 */
export function recordInferenceTelemetry(sample: TelemetrySample): void {
  const isKnown = VERIFIED_MODEL_IDS.has(sample.modelId);
  const safeModel = isKnown ? sample.modelId.slice(0, 96) : "_other_";
  const nowSec = Math.floor(Date.now() / 1000);
  const windowUnixSec = Math.floor(nowSec / 10) * 10;
  const bucketKey = `${safeModel}:${windowUnixSec}`;

  let bucket = activeBuckets.get(bucketKey);
  if (!bucket) {
    if (activeBuckets.size >= MAX_BUCKETS_BEFORE_FLUSH) {
      const oldest = activeBuckets.keys().next().value;
      if (oldest) activeBuckets.delete(oldest);
    }
    bucket = {
      modelId: safeModel,
      windowUnixSec,
      totalRequests: 0,
      successCount: 0,
      failoverCount: 0,
      cacheHitCount: 0,
      ttfbSamples: [],
    };
    activeBuckets.set(bucketKey, bucket);
  }

  bucket.totalRequests += 1;
  if (sample.statusCode >= 200 && sample.statusCode < 400) bucket.successCount += 1;
  if (sample.didFailover) bucket.failoverCount += 1;
  if (sample.cacheHit) bucket.cacheHitCount += 1;

  const cleanTtfb = Math.max(1, Math.min(60000, Math.round(sample.ttfbMs)));
  if (bucket.ttfbSamples.length < MAX_SAMPLES_PER_BUCKET) {
    bucket.ttfbSamples.push(cleanTtfb);
  } else {
    const replaceIdx = Math.floor(Math.random() * bucket.totalRequests);
    if (replaceIdx < MAX_SAMPLES_PER_BUCKET) {
      bucket.ttfbSamples[replaceIdx] = cleanTtfb;
    }
  }

  const elapsedMs = Date.now() - lastFlushTimestamp;
  const shouldForceFlush = activeBuckets.size >= 40 || elapsedMs >= FLUSH_INTERVAL_MS;

  if (!flushInFlight) {
    flushInFlight = true;
    const delayMs = shouldForceFlush ? 0 : Math.max(500, FLUSH_INTERVAL_MS - elapsedMs);
    setTimeout(() => {
      flushRollupBatch().catch(() => {});
    }, delayMs);
  }
}

async function flushRollupBatch(): Promise<void> {
  try {
    if (activeBuckets.size === 0) return;

    const snapshot = Array.from(activeBuckets.values());
    activeBuckets.clear();
    lastFlushTimestamp = Date.now();

    const placeholders: string[] = [];
    const params: Array<string | number> = [];

    for (const b of snapshot) {
      const sorted = [...b.ttfbSamples].sort((a, z) => a - z);
      const p50 = computePercentile(sorted, 50);
      const p95 = computePercentile(sorted, 95);
      const p99 = computePercentile(sorted, 99);

      placeholders.push("(?, ?, ?, ?, ?, ?, ?, ?, ?)");
      params.push(
        b.modelId,
        formatUnixToMysqlDatetime(b.windowUnixSec),
        b.totalRequests,
        b.successCount,
        b.failoverCount,
        b.cacheHitCount,
        p50,
        p95,
        p99
      );
    }

    await db.execute(
      `INSERT INTO kiosai.telemetry_rollup_10s
        (model_id, window_start, total_requests, success_count, failover_count, cache_hit_count, ttfb_p50_ms, ttfb_p95_ms, ttfb_p99_ms)
       VALUES ${placeholders.join(", ")}
       ON DUPLICATE KEY UPDATE
        total_requests = telemetry_rollup_10s.total_requests + VALUES(total_requests),
        success_count = telemetry_rollup_10s.success_count + VALUES(success_count),
        failover_count = telemetry_rollup_10s.failover_count + VALUES(failover_count),
        cache_hit_count = telemetry_rollup_10s.cache_hit_count + VALUES(cache_hit_count),
        ttfb_p50_ms = ROUND((telemetry_rollup_10s.ttfb_p50_ms + VALUES(ttfb_p50_ms)) / 2),
        ttfb_p95_ms = GREATEST(telemetry_rollup_10s.ttfb_p95_ms, VALUES(ttfb_p95_ms)),
        ttfb_p99_ms = GREATEST(telemetry_rollup_10s.ttfb_p99_ms, VALUES(ttfb_p99_ms))`,
      params
    );
  } catch {
    // Non-blocking background telemetry failure is ignored
  } finally {
    flushInFlight = false;
  }
}
