import { db } from "./db";

export interface TelemetrySample {
  modelId: string;
  ttfbMs: number;
  statusCode: number;
  didFailover: boolean;
  cacheHit: boolean;
}

interface BucketState {
  windowUnixSec: number;
  modelId: string;
  totalRequests: number;
  successCount: number;
  failoverCount: number;
  cacheHitCount: number;
  ttfbSamples: number[];
}

const FLUSH_INTERVAL_MS = 10_000;
const MAX_SAMPLES_PER_BUCKET = 250;
const MAX_BUCKETS_BEFORE_FLUSH = 40;

const activeBuckets = new Map<string, BucketState>();
let flushScheduled = false;
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
 */
export function recordInferenceTelemetry(sample: TelemetrySample): void {
  const nowSec = Math.floor(Date.now() / 1000);
  const windowUnixSec = Math.floor(nowSec / 10) * 10;
  const bucketKey = `${windowUnixSec}:${sample.modelId}`;

  let bucket = activeBuckets.get(bucketKey);
  if (!bucket) {
    bucket = {
      windowUnixSec,
      modelId: sample.modelId.slice(0, 96),
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

  if (bucket.ttfbSamples.length < MAX_SAMPLES_PER_BUCKET) {
    bucket.ttfbSamples.push(Math.max(1, Math.round(sample.ttfbMs)));
  } else {
    const replaceIdx = Math.floor(Math.random() * bucket.totalRequests);
    if (replaceIdx < MAX_SAMPLES_PER_BUCKET) {
      bucket.ttfbSamples[replaceIdx] = Math.max(1, Math.round(sample.ttfbMs));
    }
  }

  const elapsedMs = Date.now() - lastFlushTimestamp;
  const shouldForceFlush = activeBuckets.size >= MAX_BUCKETS_BEFORE_FLUSH || elapsedMs >= FLUSH_INTERVAL_MS;

  if (!flushScheduled) {
    flushScheduled = true;
    const delayMs = shouldForceFlush ? 0 : Math.max(500, FLUSH_INTERVAL_MS - elapsedMs);
    setTimeout(() => {
      flushRollupBatch().catch(() => {});
    }, delayMs);
  }
}

async function flushRollupBatch(): Promise<void> {
  if (activeBuckets.size === 0) {
    flushScheduled = false;
    return;
  }

  const snapshot = Array.from(activeBuckets.values());
  activeBuckets.clear();
  lastFlushTimestamp = Date.now();
  flushScheduled = false;

  const placeholders: string[] = [];
  const params: Array<string | number> = [];

  for (const b of snapshot) {
    const sorted = [...b.ttfbSamples].sort((a, z) => a - z);
    const p50 = computePercentile(sorted, 50);
    const p95 = computePercentile(sorted, 95);
    const p99 = computePercentile(sorted, 99);

    placeholders.push("(?, ?, ?, ?, ?, ?, ?, ?, ?)");
    params.push(
      formatUnixToMysqlDatetime(b.windowUnixSec),
      b.modelId,
      b.totalRequests,
      b.successCount,
      b.failoverCount,
      b.cacheHitCount,
      p50,
      p95,
      p99
    );
  }

  try {
    await db.execute(
      `INSERT INTO kiosai.telemetry_rollup_10s
        (window_start, model_id, total_requests, success_count, failover_count, cache_hit_count, ttfb_p50_ms, ttfb_p95_ms, ttfb_p99_ms)
       VALUES ${placeholders.join(", ")}
       ON DUPLICATE KEY UPDATE
        total_requests = total_requests + VALUES(total_requests),
        success_count = success_count + VALUES(success_count),
        failover_count = failover_count + VALUES(failover_count),
        cache_hit_count = cache_hit_count + VALUES(cache_hit_count),
        ttfb_p50_ms = ROUND((ttfb_p50_ms + VALUES(ttfb_p50_ms)) / 2),
        ttfb_p95_ms = GREATEST(ttfb_p95_ms, VALUES(ttfb_p95_ms)),
        ttfb_p99_ms = GREATEST(ttfb_p99_ms, VALUES(ttfb_p99_ms))`,
      params
    );
  } catch {
    // Non-blocking background telemetry failure is ignored
  }
}
