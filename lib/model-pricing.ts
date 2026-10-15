export interface ModelPricing {
  input: string;
  output: string;
  cached: string;
  formatted: string;
}

/**
 * Returns exact token pricing data ($ / 1M tokens) matching official provider rates:
 * Input Data, Output Data, and Cached Input Data.
 */
export function getModelPricing(modelId: string): ModelPricing {
  const m = (modelId || "").toLowerCase();

  if (m.includes("atria")) {
    return { input: "0.00", output: "0.00", cached: "0.00", formatted: "Gratis" };
  }
  if (m.includes("r1") || (m.includes("deepseek") && m.includes("reasoning"))) {
    return { input: "0.55", output: "2.19", cached: "0.14", formatted: "In $0.55 · Out $2.19 / 1M" };
  }
  if (m.includes("deepseek")) {
    return { input: "0.27", output: "1.10", cached: "0.07", formatted: "In $0.27 · Out $1.10 / 1M" };
  }
  if (m.includes("haiku")) {
    return { input: "0.25", output: "1.25", cached: "0.05", formatted: "In $0.25 · Out $1.25 / 1M" };
  }
  if (m.includes("gemini") && m.includes("flash")) {
    return { input: "0.075", output: "0.30", cached: "0.018", formatted: "In $0.075 · Out $0.30 / 1M" };
  }
  if (m.includes("gemini") && (m.includes("pro") || m.includes("agent"))) {
    return { input: "1.25", output: "5.00", cached: "0.31", formatted: "In $1.25 · Out $5.00 / 1M" };
  }
  if (m.includes("4o-mini") || m.includes("4o_mini") || m.includes("-mini") || m.includes("/mini")) {
    return { input: "0.15", output: "0.60", cached: "0.075", formatted: "In $0.15 · Out $0.60 / 1M" };
  }
  if (m.includes("sonnet")) {
    return { input: "3.00", output: "15.00", cached: "0.30", formatted: "In $3.00 · Out $15.00 / 1M" };
  }
  if (m.includes("gpt-4o") || m.includes("gpt-4")) {
    return { input: "2.50", output: "10.00", cached: "1.25", formatted: "In $2.50 · Out $10.00 / 1M" };
  }
  if (m.includes("opus") || m.includes("flagship")) {
    return { input: "15.00", output: "75.00", cached: "3.75", formatted: "In $15.00 · Out $75.00 / 1M" };
  }
  if (m.includes("grok")) {
    return { input: "2.00", output: "10.00", cached: "0.50", formatted: "In $2.00 · Out $10.00 / 1M" };
  }
  if (m.includes("gpt-5") || m.includes("gpt-6")) {
    return { input: "5.00", output: "15.00", cached: "1.25", formatted: "In $5.00 · Out $15.00 / 1M" };
  }
  if (m.includes("llama")) {
    return { input: "0.40", output: "0.90", cached: "0.10", formatted: "In $0.40 · Out $0.90 / 1M" };
  }
  if (m.includes("pro") || m.includes("reasoning") || m.includes("thinking")) {
    return { input: "2.00", output: "8.00", cached: "0.50", formatted: "In $2.00 · Out $8.00 / 1M" };
  }
  return { input: "0.30", output: "1.20", cached: "0.08", formatted: "In $0.30 · Out $1.20 / 1M" };
}

/** Baseline = DeepSeek Flash ($0.27 in + $1.10 out). 1 ratio == 1 token dipotong. */
const BASELINE_RATE = 1.37;

/**
 * Rasio pemotongan saldo, diturunkan dari harga $(input+output) yang sama dengan
 * yang dirender di kartu model — supaya angka di UI dan angka yang dipotong tidak
 * pernah bisa berbeda. Floor 0.05 = jaring anti-abuse untuk model $0 (Atria).
 * ponytail: linear (bukan blended per-direction); pisahkan in/out kalau margin
 * per-model perlu presisi tinggi.
 */
export function getCostRatio(modelId: string): number {
  const p = getModelPricing(modelId);
  const rate = (Number(p.input) || 0) + (Number(p.output) || 0);
  return Math.max(0.05, rate / BASELINE_RATE);
}
