const B = "http://127.0.0.1:3000";

(async () => {
  // Registrasi + top-up self-service untuk mendapat tier pro dan saldo besar.
  const reg = await fetch(`${B}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `billing_${Date.now()}@kiosai.id`, password: "BillingTest123!", name: "Billing Tester" }),
  });
  const cookie = reg.headers.get("set-cookie")?.split(";")[0] || "";
  if (!cookie) throw new Error(`registrasi gagal: HTTP ${reg.status}`);

  const order = await (await fetch(`${B}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ tier: "pro_100k" }),
  })).json();
  await fetch(`${B}/api/orders/pay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
      "x-test-bypass-secret": process.env.PAYMENT_WEBHOOK_SECRET || "",
    },
    body: JSON.stringify({ orderId: order.orderId }),
  });

  const bal = async () => Number((await (await fetch(`${B}/api/user`, { headers: { Cookie: cookie } })).json()).user.balance_tokens);
  const k = await (await fetch(`${B}/api/keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ name: "ratio", rateLimit: 120 }),
  })).json();

  const cases = [
    ["tokenharbor/deepseek-v4.1-flash:free", 1.0, "In $0.27 + Out $1.10"],
    ["kr/claude-haiku-4.5-thinking-agentic", 1.095, "In $0.25 + Out $1.25"],
    ["kr/claude-sonnet-4.5-thinking-agentic", 13.139, "In $3.00 + Out $15.00"],
  ];
  const zeroBill = ["atria/Atria-Dawn-Preview", "oc/deepseek-v4.1-flash-free"];

  for (const [model, expect, label] of cases) {
    const b0 = await bal();
    const res = await fetch(`${B}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + k.apiKey },
      body: JSON.stringify({ model, messages: [{ role: "user", content: "say ok" }], max_tokens: 8 }),
    });
    let d = {};
    try { d = JSON.parse(await res.text()); } catch {}
    const b1 = await bal();
    const used = d.usage?.total_tokens ?? 0;
    const spent = b0 - b1;
    const ratio = used ? spent / used : 0;
    console.log(`${label.padEnd(26)} ${String(res.status).padEnd(4)} usage=${String(used).padEnd(6)} spent=${String(spent).padEnd(8)} ratio=${ratio.toFixed(3)} expect=${expect} ${Math.abs(ratio - expect) < 0.02 ? "OK" : "(±diff)"}`);
  }

  // Free-tier OpenCode/Atria harus benar-benar Rp 0 (tidak memotong saldo).
  for (const model of zeroBill) {
    const b0 = await bal();
    const res = await fetch(`${B}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + k.apiKey },
      body: JSON.stringify({ model, messages: [{ role: "user", content: "say ok" }], max_tokens: 8 }),
    });
    const b1 = await bal();
    console.log(`${("FREE " + model).padEnd(26)} ${String(res.status).padEnd(4)} spent=${b0 - b1} ${b0 - b1 === 0 ? "OK" : "(should be 0)"}`);
  }
})();
