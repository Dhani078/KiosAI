import { launch, connect, sleep, REPORT_EXPR } from "./cdp.mjs";

const BASE = process.env.AUDIT_BASE || "https://tokoai.my.id";
const PORT = 9559;
const child = await launch(PORT);

const results = [];
let totalFailures = 0;

try {
  const c = await connect(PORT);
  await c.send("Page.enable");
  await c.send("Network.enable");

  // Viewports
  const viewports = [
    { name: "PC (1440x900)", width: 1440, height: 900, mobile: false },
    { name: "Mobile (390x844)", width: 390, height: 844, mobile: true },
  ];

  // 1. Audit Landing Page
  for (const vp of viewports) {
    await c.send("Emulation.setDeviceMetricsOverride", {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.mobile,
    });

    await c.goto(BASE + "/", 4000);
    const r = await c.evaluate(REPORT_EXPR);
    const overflow = Math.max(r.docW, r.bodyW) > r.innerW + 1;
    const ok = !overflow && r.overflowCount === 0;
    if (!ok) totalFailures++;

    results.push({
      page: "Landing",
      viewport: vp.name,
      docW: r.docW,
      innerW: r.innerW,
      overflowElements: r.overflowCount,
      status: ok ? "PASS" : "FAIL",
    });
  }

  // 2. Audit Dashboard with Admin Session
  const loginRes = await fetch(BASE + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "adminfordhani", password: process.env.ADMIN_PASSWORD }),
  });
  const loginData = await loginRes.json();
  const cookieHeader = loginRes.headers.get("set-cookie") || "";
  const cookieVal = cookieHeader.split(";")[0].split("=")[1];

  await c.send("Network.setCookie", {
    name: "kiosai_session",
    value: cookieVal,
    url: BASE,
    path: "/",
    httpOnly: true,
  });

  await c.goto(BASE + "/", 2000);
  await c.evaluate(`localStorage.setItem("kiosai_user_id", "${loginData.user.id}")`);

  const tabs = ["Beli Token", "Model", "Playground", "API Keys", "Statistik", "Dokumentasi"];

  for (const vp of viewports) {
    await c.send("Emulation.setDeviceMetricsOverride", {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.mobile,
    });

    await c.goto(BASE + "/dashboard", 4500);

    for (const tab of tabs) {
      await c.evaluate(`(() => {
        const nodes = [...document.querySelectorAll('.nav-item, .bottom-nav button, nav button, aside button')];
        const t = nodes.find(n => n.textContent.trim().startsWith(${JSON.stringify(tab)}));
        if (t) t.click();
      })()`);
      await sleep(1500);

      const r = await c.evaluate(REPORT_EXPR);
      const overflow = Math.max(r.docW, r.bodyW) > r.innerW + 1;
      const ok = !overflow && r.overflowCount === 0;
      if (!ok) totalFailures++;

      results.push({
        page: `Dashboard (${tab})`,
        viewport: vp.name,
        docW: r.docW,
        innerW: r.innerW,
        overflowElements: r.overflowCount,
        status: ok ? "PASS" : "FAIL",
      });
    }
  }

  console.log("=== CHROME FULL AUDIT RESULTS ===");
  console.table(results);
  console.log("Total Failures:", totalFailures);

} finally {
  child.kill();
}
