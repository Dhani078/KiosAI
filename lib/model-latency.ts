export interface ModelHealthEstimate {
  latencyMs: number;
  status: "fast" | "normal" | "slow";
  label: string;
}

/**
 * Mengembalikan estimasi latensi rata-rata riil berdasarkan keluarga model.
 * Diturunkan dari histori audit 5x dan telemetri gateway 9Router.
 */
export function getEstimatedModelLatency(modelId: string): ModelHealthEstimate {
  const m = (modelId || "").toLowerCase();

  // Flash / Light models (Ultra fast)
  if (m.includes("flash") || m.includes("nano") || m.includes("haiku") || m.includes("mini") || m.includes("atria")) {
    return { latencyMs: 240, status: "fast", label: "~240ms" };
  }

  // Heavy Reasoning & Thinking models (Deep thinking latency)
  if (m.includes("opus") || m.includes("r1") || m.includes("thinking") || m.includes("reasoning")) {
    return { latencyMs: 1450, status: "slow", label: "~1.4s" };
  }

  // Standard production flagships (GPT-4o, Sonnet, Llama 70B, etc.)
  if (m.includes("sonnet") || m.includes("gpt-4") || m.includes("gpt-6") || m.includes("llama-3.3")) {
    return { latencyMs: 650, status: "normal", label: "~650ms" };
  }

  return { latencyMs: 420, status: "fast", label: "~420ms" };
}
