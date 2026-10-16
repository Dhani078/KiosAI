/**
 * Chaos Load Test Runner for KiosAI
 * Simulates concurrent streaming requests, client aborts, and failovers.
 * Run: node --env-file=.env scripts/chaos-load-test.mjs
 */
import { performance } from "node:perf_hooks";

const BASE = process.env.TEST_TARGET || "http://127.0.0.1:3000";
const CONCURRENCY = 25; // 25 simultaneous SSE streams in test environment
const ABORT_RATIO = 0.4; // 40% clients abort mid-stream

async function main() {
  console.log(`\n=== KiosAI Chaos Load Test Runner ===`);
  console.log(`Target: ${BASE}`);
  console.log(`Simulating ${CONCURRENCY} concurrent clients (${Math.round(ABORT_RATIO * 100)}% aborts)...\n`);

  // 1. Setup isolated test user & key
  const regRes = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: `chaos_${Date.now()}@kiosai.id`,
      password: "ChaosPassword123!",
      name: "Chaos Tester",
    }),
  });
  const regData = await regRes.json();
  if (!regRes.ok) throw new Error(`Registration failed: ${regData.error}`);

  const keyRes = await fetch(`${BASE}/api/keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: regData.user.id, name: "Chaos Key", rateLimit: 300 }),
  });
  const keyData = await keyRes.json();
  if (!keyRes.ok) throw new Error(`Key creation failed: ${keyData.error}`);
  const apiKey = keyData.apiKey;

  // 2. Dispatch concurrent clients
  const startTime = performance.now();
  const tasks = Array.from({ length: CONCURRENCY }, async (_, idx) => {
    const shouldAbort = idx < CONCURRENCY * ABORT_RATIO;
    const controller = new AbortController();
    let abortTimer = null;

    if (shouldAbort) {
      abortTimer = setTimeout(() => controller.abort(new Error("CHAOS_CLIENT_ABORT")), 1500);
    }

    const clientStart = performance.now();
    try {
      const res = await fetch(`${BASE}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "atria/Atria-Dawn-Preview",
          messages: [{ role: "user", content: `Chaos prompt #${idx}` }],
          stream: true,
          max_tokens: 15,
        }),
        signal: controller.signal,
      });

      if (abortTimer) clearTimeout(abortTimer);
      if (!res.ok || !res.body) {
        return { id: idx, status: res.status, aborted: false, durationMs: performance.now() - clientStart };
      }

      const reader = res.body.getReader();
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }

      return { id: idx, status: res.status, aborted: false, durationMs: performance.now() - clientStart };
    } catch (err) {
      if (abortTimer) clearTimeout(abortTimer);
      const isAbort = err.name === "AbortError" || String(err.message).includes("CHAOS_CLIENT_ABORT");
      return { id: idx, status: isAbort ? 499 : 599, aborted: isAbort, durationMs: performance.now() - clientStart };
    }
  });

  const results = await Promise.all(tasks);
  const totalDurationMs = Math.round(performance.now() - startTime);

  // 3. Summarize outcomes
  const completed200 = results.filter((r) => r.status === 200).length;
  const aborted499 = results.filter((r) => r.aborted).length;
  const limited429 = results.filter((r) => r.status === 429).length;
  const upstream50x = results.filter((r) => r.status === 502 || r.status === 503).length;
  const unhandled500 = results.filter((r) => r.status === 500).length;

  console.table({
    "Total Requests": results.length,
    "Completed 200 OK": completed200,
    "Client Aborted (Handled)": aborted499,
    "Rate Limited (429)": limited429,
    "Upstream (502/503)": upstream50x,
    "Unhandled (500)": unhandled500,
    "Total Wall Time (ms)": totalDurationMs,
  });

  // Verify Invariants:
  // Invariant 1: No unhandled 500 crashes
  if (unhandled500 > 0) {
    throw new Error(`Chaos test failed: ${unhandled500} unhandled 500 errors detected!`);
  }

  // Invariant 2: User balance in TiDB is non-negative
  const userCheckRes = await fetch(`${BASE}/api/user?id=${regData.user.id}`);
  const userData = await userCheckRes.json();
  const finalBalance = Number(userData.user.balance_tokens);
  console.log(`Final user balance: ${finalBalance.toLocaleString("id-ID")} tokens`);
  if (finalBalance < 0) {
    throw new Error(`Invariant 1 violated: user balance is negative (${finalBalance})!`);
  }

  console.log(`\n✅ Chaos Load Test PASSED: 0 unhandled 500s, balance protected, all slots handled.\n`);
}

main().catch((err) => {
  console.error(`\n❌ Chaos test error: ${err.message}`);
  process.exit(1);
});
