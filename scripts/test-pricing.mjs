/**
 * Verify billed tokens equal the $/1M rates shown on the model cards.
 * Baseline: DeepSeek Flash ($0.27 in + $1.10 out) == 1.0 ratio.
 * Run: npm run test:pricing
 */
import assert from "node:assert/strict";
import { getModelPricing, getCostRatio } from "../lib/model-pricing.ts";

const cases = [
  ["atria/Atria-Dawn-Preview", 0.05],
  ["tokenharbor/deepseek-v4.1-flash:free", 1.0],
  ["anthropic/claude-3.7-sonnet", 13.14],
  ["openai/gpt-4o", 9.12],
  ["google/gemini-2.0-flash", 0.27],
  ["ag/gemini-3.8-flash-high", 0.27],
  ["ag/claude-sonnet-4-6", 13.14],
  ["ag/claude-opus-4-6-thinking", 65.69],
  ["deepseek/deepseek-r1", 2.0],
  ["meta/llama-3.3-70b", 0.95],
];

for (const [id, expected] of cases) {
  const p = getModelPricing(id);
  const ratio = getCostRatio(id);
  assert.ok(Math.abs(ratio - expected) < 0.011, `${id}: ratio ${ratio} != ${expected}`);
  const recomputed = (Number(p.input) + Number(p.output)) / 1.37;
  assert.ok(Math.abs(Math.max(0.05, recomputed) - ratio) < 1e-9, `${id}: UI price and charged ratio diverged`);
}

// 100k tokens on DeepSeek Flash == 100k balance (baseline 1:1).
assert.equal(Math.round(100000 * getCostRatio("tokenharbor/deepseek-v4.1-flash:free")), 100000);
// Free tier is cheap, flagship is not.
assert.ok(getCostRatio("atria/Atria-Dawn-Preview") < getCostRatio("anthropic/claude-opus-4"));
console.log(`OK — ${cases.length + 2} pricing checks passed`);