/**
 * Live UI audit — renders the real pages in the installed chrome-headless-shell
 * and fails on horizontal overflow (standing 0-overflow requirement) or leftover
 * multiplier/bansos copy.
 * Run: npm run audit:ui   (server must be on :3000)
 */
import { launch, connect, REPORT_EXPR } from "./cdp.mjs";

const BASE = process.env.AUDIT_BASE || "http://127.0.0.1:3000";
const PORT = 9333;
const VIEWPORTS = [
  { name: "pc", width: 1440, height: 900, mobile: false },
  { name: "mobile", width: 390, height: 844, mobile: true },
];
const ROUTES = ["/", "/dashboard"];
const BANNED = ["1.0×", "2.0×", "4.0×", "ansos", "ultiplier"];

const child = await launch(PORT);
let failures = 0;

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

    for (const route of ROUTES) {
      await c.goto(BASE + route, 4500);
      const r = await c.evaluate(REPORT_EXPR);
      const overflow = Math.max(r.docW, r.bodyW) > r.innerW + 1;
      const banned = BANNED.filter((t) => r.text.includes(t));
      const ok = !overflow && r.overflowCount === 0 && banned.length === 0;
      if (!ok) failures++;

      console.log(`[${ok ? "PASS" : "FAIL"}] ${vp.name.padEnd(6)} ${route.padEnd(11)} scrollW=${r.docW} innerW=${r.innerW} overflowEls=${r.overflowCount} banned=${JSON.stringify(banned)}`);
      r.sample.forEach((s) => console.log("        >", s));
    }
    c.close();
  }
} finally {
  child.kill();
}

console.log(failures === 0 ? "\nUI audit: all checks passed" : `\nUI audit: ${failures} failed`);
process.exit(failures === 0 ? 0 : 1);