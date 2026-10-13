const B = "http://127.0.0.1:3000";
const uid = "usr_admin_dhani";
const bal = async () => Number((await (await fetch(`${B}/api/user?id=${uid}`)).json()).user.balance_tokens);

(async () => {
  const k = await (await fetch(`${B}/api/keys`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: uid, name: "ratio", rateLimit: 120 }) })).json();
  const cases = [
    ["tokenharbor/deepseek-v4.1-flash:free", 1.0, "In $0.27 + Out $1.10"],
    ["kr/claude-haiku-4.5-thinking-agentic", 1.095, "In $0.25 + Out $1.25"],
    ["kr/claude-sonnet-4.5-thinking-agentic", 13.139, "In $3.00 + Out $15.00"],
  ];
  for (const [model, expect, label] of cases) {
    const b0 = await bal();
    const res = await fetch(`${B}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${k.apiKey}` },
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
})();