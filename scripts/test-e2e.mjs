const BASE = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";

console.log(`=== KiosAI End-to-End Integration Test Suite ===`);
console.log(`Target: ${BASE}\n`);

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    process.stdout.write(`• ${name}... `);
    await fn();
    console.log(`\x1b[32mPASSED\x1b[0m`);
    passed++;
  } catch (err) {
    console.log(`\x1b[31mFAILED\x1b[0m: ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || "Assertion failed");
}

let testUser = null;
let testKey = null;
let testOrderId = null;

// 1. Health check
await test("GET /api/health", async () => {
  const res = await fetch(`${BASE}/api/health`);
  const data = await res.json();
  assert(res.ok, `HTTP ${res.status}`);
  assert(data.database?.status === "connected", "Database not connected");
  assert(data.upstream?.status === "connected", "9Router not connected");
});

// 2. Models discovery
await test("GET /v1/models", async () => {
  const res = await fetch(`${BASE}/v1/models`);
  const data = await res.json();
  assert(res.ok, `HTTP ${res.status}`);
  assert(Array.isArray(data.data), "data is not array");
  assert(data.data.length > 0, "No models returned");
  assert(data.data[0].required_tier, "Missing required_tier field");
});

// 3. User Registration
await test("POST /api/auth/register", async () => {
  const email = `e2e_${Date.now()}@kiosai.id`;
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "SecretPassword123!", name: "E2E Tester" }),
  });
  const data = await res.json();
  assert(res.ok, `HTTP ${res.status}`);
  assert(data.user?.id, "No user ID returned");
  assert(Number(data.user.balance_tokens) === 5000000, "Trial tokens mismatch");
  testUser = data.user;
});

// 4. API Key Creation
await test("POST /api/keys", async () => {
  assert(testUser, "No test user");
  const res = await fetch(`${BASE}/api/keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: testUser.id, name: "E2E Test Key", rateLimit: 60 }),
  });
  const data = await res.json();
  assert(res.ok, `HTTP ${res.status}`);
  assert(data.apiKey?.startsWith("kios-"), "Key format invalid");
  testKey = data.apiKey;
});

// 5. Chat Completion (Non-Streaming)
await test("POST /v1/chat/completions (Non-stream)", async () => {
  assert(testKey, "No test key");
  const res = await fetch(`${BASE}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${testKey}`,
    },
    body: JSON.stringify({
      model: "tokenharbor/deepseek-v4.1-flash:free",
      messages: [{ role: "user", content: "Halo KiosAI e2e" }],
      max_tokens: 10,
    }),
  });
  const data = await res.json();
  assert(res.ok, `HTTP ${res.status}`);
  assert(data.choices?.[0]?.message?.content, "No response content");
  assert(data.usage?.total_tokens > 0, "No usage accounted");
  assert(res.headers.get("X-RateLimit-Limit"), "Missing X-RateLimit-Limit");
  assert(res.headers.get("X-RateLimit-Remaining"), "Missing X-RateLimit-Remaining");
});

// 6. Chat Completion (Streaming SSE)
await test("POST /v1/chat/completions (Stream SSE)", async () => {
  assert(testKey, "No test key");
  const res = await fetch(`${BASE}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${testKey}`,
    },
    body: JSON.stringify({
      model: "tokenharbor/deepseek-v4.1-flash:free",
      messages: [{ role: "user", content: "Stream test" }],
      max_tokens: 10,
      stream: true,
    }),
  });
  assert(res.ok, `HTTP ${res.status}`);
  const text = await res.text();
  assert(text.includes("data: [DONE]"), "Stream did not end with [DONE]");
  assert(text.includes('"usage"'), "Stream missing usage chunk");
});

// 7. Universal Model Access (No tier restriction, token balance based)
await test("Universal Model Access (No tier restriction)", async () => {
  assert(testKey, "No test key");
  const res = await fetch(`${BASE}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${testKey}`,
    },
    body: JSON.stringify({
      model: "claude-haiku-4.5",
      messages: [{ role: "user", content: "Ping" }],
      max_tokens: 5,
    }),
  });
  const data = await res.json();
  assert(data.error?.code !== "tier_restricted", "Should not be blocked by tier");
});

// 8. QRIS Order Creation
await test("POST /api/orders (Create QRIS)", async () => {
  assert(testUser, "No test user");
  const res = await fetch(`${BASE}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: testUser.id, tier: "silver" }),
  });
  const data = await res.json();
  assert(res.ok, `HTTP ${res.status}`);
  assert(data.orderId, "No order ID");
  assert(data.qrisUrl, "No QRIS URL");
  testOrderId = data.orderId;
});

// 9. QRIS Order Payment & Tier Upgrade
await test("POST /api/orders/pay (Payment Fulfillment)", async () => {
  assert(testOrderId, "No test order");
  const res = await fetch(`${BASE}/api/orders/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: testOrderId }),
  });
  const data = await res.json();
  assert(res.ok, `HTTP ${res.status}`);
  assert(data.success === true, "Payment not marked success");

  // Verify user balance & tier upgraded to silver
  const uRes = await fetch(`${BASE}/api/user?id=${testUser.id}`);
  const uData = await uRes.json();
  assert(uData.user.tier === "silver", `Expected silver tier, got ${uData.user.tier}`);
  assert(Number(uData.user.balance_tokens) > 5000000, "Tokens not credited");
});

// 10. Analytics & Usage Logs
await test("GET /api/analytics", async () => {
  assert(testUser, "No test user");
  const res = await fetch(`${BASE}/api/analytics?userId=${testUser.id}`);
  const data = await res.json();
  assert(res.ok, `HTTP ${res.status}`);
  assert(data.summary?.totalRequests >= 2, "Requests count mismatch");
  assert(Array.isArray(data.recentLogs) && data.recentLogs.length >= 2, "Recent logs missing");
});

console.log(`\n=== Hasil Pengujian: ${passed} Lolos, ${failed} Gagal ===`);
if (failed > 0) process.exit(1);
