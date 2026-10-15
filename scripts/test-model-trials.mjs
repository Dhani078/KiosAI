import { readFileSync } from "node:fs";

const env = readFileSync(".env", "utf8");
const key = env.match(/NINEROUTER_API_KEY_2="?([^"\n\r]+)/)?.[1];
const target = "http://127.0.0.1:20128";

const candidateModels = [
  "cl/nvidia/nemotron-3.5-lightning",
  "cl/nvidia/nemotron-3.5-lightning:free",
  "cl/sakana/sakana-namazu",
  "cl/upstage/solar-pro4",
  "cl/meta/muse-glimmer-30b",
  "cl/meta/muse-spark-1.2",
  "cl/meta/muse-spark-1.2-contributor",
  "cl/~deepseek/deepseek-v4-flash-latest",
  "cl/deepseek/deepseek-v4-flash-0731",
  "cl/thinkingmachines/inkling-small",
  "cl/thinkingmachines/inkling-small:free",
  "apinex/free/deepseek-v4-flash-0731",
  "bzl/deepseek/deepseek-v4-flash-0731free",
  "cutadai/meta/muse-spark-1.2-contributor"
];

console.log(`Menguji ${candidateModels.length} model (masing-masing 3x uji coba)...\n`);

const results = [];

for (const m of candidateModels) {
  process.stdout.write(`Testing ${m.padEnd(42)}: `);
  const attempts = [];
  for (let i = 1; i <= 3; i++) {
    try {
      const res = await fetch(`${target}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`
        },
        body: JSON.stringify({
          model: m,
          messages: [{ role: "user", content: "Halo, tes 1 kata." }],
          max_tokens: 5
        }),
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        attempts.push(`T${i}: 200 OK`);
      } else {
        const text = await res.text();
        const msg = text.slice(0, 45).replace(/\n/g, " ");
        attempts.push(`T${i}: ${res.status} (${msg})`);
      }
    } catch (err) {
      attempts.push(`T${i}: ${err.name || "Error"}`);
    }
    // Small pause between attempts
    await new Promise(r => setTimeout(r, 600));
  }
  const allFailed = attempts.every(a => !a.includes("200 OK"));
  const summary = allFailed ? "FAILED (3/3)" : "SUCCESS";
  console.log(`${summary} -> [${attempts.join(", ")}]`);
  results.push({ model: m, allFailed, attempts, summary });
}

console.log("\n--- RINGKASAN AKHIR ---");
const toDelete = results.filter(r => r.allFailed);
const toKeep = results.filter(r => !r.allFailed);

console.log(`\nModel yang GAGAL 3x (wajib dihapus): ${toDelete.length}`);
toDelete.forEach(r => console.log(` - ${r.model}`));

console.log(`\nModel yang BERHASIL (dipertahankan): ${toKeep.length}`);
toKeep.forEach(r => console.log(` - ${r.model}`));
