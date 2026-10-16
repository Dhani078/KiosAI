// In-memory sliding window rate limiter
const requestBuckets = new Map<string, number[]>();

export function checkRateLimit(keyId: string, limitPerMinute: number = 60): {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
} {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const windowStart = now - windowMs;

  const timestamps = requestBuckets.get(keyId) || [];
  // Filter out timestamps outside the 1-minute window
  const recent = timestamps.filter((t) => t > windowStart);

  if (recent.length >= limitPerMinute) {
    const oldestInWindow = recent[0];
    const resetSeconds = Math.ceil((oldestInWindow + windowMs - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetSeconds: Math.max(1, resetSeconds),
    };
  }

  recent.push(now);
  requestBuckets.set(keyId, recent);

  // Periodically clean stale entries to prevent memory leak
  if (requestBuckets.size > 5000) {
    for (const [k, v] of requestBuckets.entries()) {
      const active = v.filter((t) => t > windowStart);
      if (active.length === 0) requestBuckets.delete(k);
      else requestBuckets.set(k, active);
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, limitPerMinute - recent.length),
    resetSeconds: 60,
  };
}

// In-memory active stream tracker to prevent concurrent overdraft attacks
const activeStreams = new Map<string, number>();

export function acquireStreamSlot(keyId: string, maxConcurrent: number = 3): boolean {
  const current = activeStreams.get(keyId) || 0;
  if (current >= maxConcurrent) {
    return false;
  }
  activeStreams.set(keyId, current + 1);
  return true;
}

export function releaseStreamSlot(keyId: string): void {
  const current = activeStreams.get(keyId) || 0;
  if (current <= 1) {
    activeStreams.delete(keyId);
  } else {
    activeStreams.set(keyId, current - 1);
  }
}

