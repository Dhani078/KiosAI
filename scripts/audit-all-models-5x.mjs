import { readFileSync, writeFileSync } from "node:fs";

const env = readFileSync(".env", "utf8");
const key = env.match(/NINEROUTER_API_KEY_2="?([^"\n\r]+)/)?.[1];
const target = "http://127.0.0.1:20128";

// Fetch all models currently in gateway
const res = await (await fetch("http://127.0.0.1:3000/v1/models")).json();
const models = res.data;

console.log(`=== AUDIT 5X MODEL GATEWAY KIOSAI ===`);
console.log(`Total model yang akan diuji: ${models.length}`);

// Protected models that should never be removed even if upstream is temporarily 429
const PROTECTED = new Set([
  "atria/Atria-Dawn-Preview",
  "tokenharbor/deepseek-v4.1-flash:free",
  "ag/gemini-3.8-flash-high",
  "ag/gemini-3.8-flash-medium",
  "ag/gemini-3.8-flash-low",
  "ag/gemini-3.8-flash",
  "ag/claude-sonnet-4-6",
  "ag/claude-opus-4-6-thinking"
]);

const passed = [];
const failed = [];

const CONCURRENCY = 10;
let currentIndex = 0;
let completed = 0;

async function testSingleModel(modelId) {
  if (PROTECTED.has(modelId)) {
    return { id: modelId, ok: true, attempts: ["PROTECTED"] };
  }

  const logs = [];
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const r = await fetch(`${target}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: "user", content: "test" }],
          max_tokens: 3
        }),
        signal: AbortSignal.timeout(3000)
      });
      if (r.ok) {
        logs.push(`A${attempt}: 200 OK`);
        return { id: modelId, ok: true, attempts: logs };
      } else {
        logs.push(`A${attempt}: HTTP ${r.status}`);
      }
    } catch (e) {
      logs.push(`A${attempt}: ${e.name || "Error"}`);
    }
    // Small backoff before next attempt
    await new Promise(res => setTimeout(res, 200));
  }
  return { id: modelId, ok: false, attempts: logs };
}

async function worker() {
  while (currentIndex < models.length) {
    const idx = currentIndex++;
    const m = models[idx];
    const res = await testSingleModel(m.id);
    completed++;

    if (res.ok) {
      passed.push(m.id);
      console.log(`[${completed}/${models.length}] PASS: ${m.id} (${res.attempts[res.attempts.length - 1]})`);
    } else {
      failed.push(m.id);
      console.log(`[${completed}/${models.length}] FAIL (5x): ${m.id}`);
    }
  }
}

const workers = Array.from({ length: CONCURRENCY }, () => worker());
await Promise.all(workers);

console.log("\n=== HASIL AUDIT LENGKAP ===");
console.log(`Total Diuji : ${models.length}`);
console.log(`Berhasil    : ${passed.length}`);
console.log(`Gagal 5x    : ${failed.length}`);

writeFileSync(
  "scripts/audit-5x-results.json",
  JSON.stringify({ passed, failed, timestamp: new Date().toISOString() }, null, 2),
  "utf8"
);
console.log("Hasil disimpan di scripts/audit-5x-results.json");
