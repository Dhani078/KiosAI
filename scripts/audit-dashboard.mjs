/**
 * Logged-in dashboard audit: seeds the real admin session into localStorage,
 * then renders every dashboard tab at PC + mobile and asserts the 2-tier copy,
 * the $/1M model cards, and zero horizontal overflow.
 * Run: node scripts/audit-dashboard.mjs   (server on :3000)
 */
import { launch, connect, sleep, REPORT_EXPR } from "./cdp.mjs";

const BASE = process.env.AUDIT_BASE || "http://127.0.0.1:3000";
const PORT = 9335;
const USER_ID = process.env.AUDIT_USER_ID || "usr_admin_dhani";

const TABS = ["Beli Token", "Model", "Playground", "API Keys", "Statistik", "Dokumentasi"];
const VIEWPORTS = [
  { name: "pc", width: 1440, height: 900, mobile: false },
  { name: "mobile", width: 390, height: 844, mobile: true },
];

const BANNED = ["1.0×", "2.0×", "4.0×", "Bansos", "bansos", "multiplier", "Multiplier"];

const child = await launch(PORT);
let failures = 0;
const summaries = [];

try {
  for (const vp of VIEWPORTS) {
    const c = await connect(PORT);
    await c.send("Page.enable");
    await c.send("Emulation.setDeviceMetricsOverride", {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.mobile,
    });

    // Seed the session on the app origin, then load the guard-protected route.
    await c.goto(BASE + "/", 2500);
    await c.evaluate(`localStorage.setItem("kiosai_user_id", ${JSON.stringify(USER_ID)}); true`);
    await c.goto(BASE + "/dashboard", 5000);

    const landed = await c.evaluate(`({ url: location.pathname, hasNav: !!document.querySelector('.sidebar, .bottom-nav'), tier: (document.body.innerText.match(/\\b(FREE|PRO)\\b/)||[])[0] || null })`);
    if (landed.url !== "/dashboard") {
      console.log(`[FAIL] ${vp.name}: AuthGuard bounced to ${landed.url} — session seed did not take`);
      failures++;
      c.close();
      continue;
    }

    for (const tab of TABS) {
      const clicked = await c.evaluate(`(() => {
        const nodes = [...document.querySelectorAll('.nav-item, .bottom-nav button, nav button, aside button')];
        const t = nodes.find(n => n.textContent.trim().startsWith(${JSON.stringify(tab)}));
        if (!t) return false;
        t.click();
        return true;
      })()`);
      if (!clicked) {
        console.log(`[FAIL] ${vp.name.padEnd(6)} ${tab.padEnd(13)} nav button not found`);
        failures++;
        continue;
      }
      await sleep(2600);

      const r = await c.evaluate(REPORT_EXPR);
      const overflow = Math.max(r.docW, r.bodyW) > r.innerW + 1;
      const banned = BANNED.filter((t) => r.text.includes(t));
      const ok = !overflow && r.overflowCount === 0 && banned.length === 0;
      if (!ok) failures++;

      console.log(`[${ok ? "PASS" : "FAIL"}] ${vp.name.padEnd(6)} ${tab.padEnd(13)} scrollW=${r.docW} innerW=${r.innerW} overflowEls=${r.overflowCount} banned=${JSON.stringify(banned)}`);
      r.sample.forEach((s) => console.log("        >", s));
      if (tab === "Beli Token" && vp.name === "pc") {
        summaries.push("PRICING:\n" + r.text.split("\n").filter((l) => /Rp|token|FREE|PRO|Juta|Miliar/i.test(l)).slice(0, 24).join("\n"));
      }
      if (tab === "Model" && vp.name === "pc") {
        summaries.push("MODELS (has INPUT/OUTPUT labels): " + (/INPUT/.test(r.text) && /OUTPUT/.test(r.text) && /\$/.test(r.text)));
      }
    }
    c.close();
  }
} finally {
  child.kill();
}

summaries.forEach((s) => console.log("\n=== " + s));
console.log(failures === 0 ? "\nDashboard audit: all checks passed" : `\nDashboard audit: ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);