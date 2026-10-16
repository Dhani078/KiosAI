export type TrafficLane = "INTERACTIVE" | "BULK_BOT";

interface BucketRecord {
  tokens: number;
  lastRefillMs: number;
  recentHitsWindowStartMs: number;
  recentHitsCount: number;
}

export interface PriorityAdmissionResult {
  allowed: boolean;
  lane: TrafficLane;
  effectiveMaxConcurrent: number;
  pacedDelayMs: number;
  retryAfterSeconds?: number;
}

const IDE_SIGNATURE_REGEX = /(cline|roo-code|roocode|cursor|continue|windsurf|aider|kios-playground)/i;
const BUCKET_MAP_MAX_SIZE = 5000;
const buckets = new Map<string, BucketRecord>();

/**
 * Klasifikasi cerdas: mengecek signature header IDE + perilaku burst aktual
 */
export function classifyTrafficLane(
  headers: Headers,
  isStream: boolean,
  recentHitsIn10s: number
): TrafficLane {
  // Jika menembak > 8 request dalam 10 detik, paksa turun ke BULK_BOT
  if (recentHitsIn10s > 8) {
    return "BULK_BOT";
  }

  const ua = headers.get("user-agent") || "";
  const title = headers.get("x-title") || "";
  const referer = headers.get("http-referer") || headers.get("referer") || "";
  const priorityHint = headers.get("x-kios-priority") || "";

  if (priorityHint.toLowerCase() === "bulk") return "BULK_BOT";

  const hasIdeHeader =
    IDE_SIGNATURE_REGEX.test(ua) ||
    IDE_SIGNATURE_REGEX.test(title) ||
    IDE_SIGNATURE_REGEX.test(referer);

  if (hasIdeHeader || (isStream && recentHitsIn10s <= 4)) {
    return "INTERACTIVE";
  }

  return "BULK_BOT";
}

export async function evaluatePriorityAdmission(
  keyId: string,
  headers: Headers,
  isStream: boolean,
  userMaxConcurrent: number = 3
): Promise<PriorityAdmissionResult> {
  const now = Date.now();

  if (buckets.size > BUCKET_MAP_MAX_SIZE) {
    const oldestKey = buckets.keys().next().value;
    if (oldestKey) buckets.delete(oldestKey);
  }

  let state = buckets.get(keyId);
  if (!state) {
    state = {
      tokens: 10,
      lastRefillMs: now,
      recentHitsWindowStartMs: now,
      recentHitsCount: 0,
    };
    buckets.set(keyId, state);
  }

  if (now - state.recentHitsWindowStartMs > 10_000) {
    state.recentHitsWindowStartMs = now;
    state.recentHitsCount = 1;
  } else {
    state.recentHitsCount += 1;
  }

  const lane = classifyTrafficLane(headers, isStream, state.recentHitsCount);
  const maxBurst = lane === "INTERACTIVE" ? 12 : 5;
  const refillPerSec = lane === "INTERACTIVE" ? 2.0 : 0.8;

  const elapsedSec = Math.max(0, (now - state.lastRefillMs) / 1000);
  state.tokens = Math.min(maxBurst, state.tokens + elapsedSec * refillPerSec);
  state.lastRefillMs = now;

  // Reserva 40% slot konkurensi khusus untuk jalur INTERACTIVE
  const effectiveMaxConcurrent =
    lane === "INTERACTIVE"
      ? userMaxConcurrent
      : Math.max(1, Math.floor(userMaxConcurrent * 0.6));

  // Jalur 1: Token tersedia -> langsung izinkan (0ms delay)
  if (state.tokens >= 1) {
    state.tokens -= 1;
    return {
      allowed: true,
      lane,
      effectiveMaxConcurrent,
      pacedDelayMs: 0,
    };
  }

  // Jalur 2: Defisit masih dalam batas wajar -> terapkan Edge Micro-Pacing
  const deficit = 1 - state.tokens;
  const maxAllowedDeficit = lane === "INTERACTIVE" ? 2.0 : 4.0;

  if (deficit <= maxAllowedDeficit) {
    state.tokens -= 1;
    const pacedDelayMs =
      lane === "INTERACTIVE"
        ? Math.min(250, Math.round(deficit * 120))
        : Math.min(1200, Math.round(deficit * 300));

    if (pacedDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, pacedDelayMs));
    }

    return {
      allowed: true,
      lane,
      effectiveMaxConcurrent,
      pacedDelayMs,
    };
  }

  // Jalur 3: Defisit melampaui batas aman -> tolak HTTP 429
  const retryAfterSeconds = Math.max(1, Math.ceil(deficit / refillPerSec));
  return {
    allowed: false,
    lane,
    effectiveMaxConcurrent,
    pacedDelayMs: 0,
    retryAfterSeconds,
  };
}
