/**
 * Diagnose a specific overflow: dump geometry + computed style of the offending
 * elements on a route/viewport.
 * Run: node scripts/probe-overflow.mjs [route] [width]
 */
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const BASE = process.env.AUDIT_BASE || "http://127.0.0.1:3000";
const PORT = 9334;
const route = process.argv[2] || "/";
const width = Number(process.argv[3] || 390);

function findShell() {
  const root = join(homedir(), "AppData", "Local", "ms-playwright");
  for (const dir of readdirSync(root)) {
    if (!dir.startsWith("chromium_headless_shell")) continue;
    const p = join(root, dir, "chrome-headless-shell-win64", "chrome-headless-shell.exe");
    if (existsSync(p)) return p;
  }
  return null;
}

const child = spawn(findShell(), [
  `--remote-debugging-port=${PORT}`, "--headless", "--disable-gpu", "--no-first-run",
  "--user-data-dir=" + join(homedir(), "AppData", "Local", "Temp", `cdp-probe-${Date.now()}`), "about:blank",
], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (let i = 0; i < 40; i++) {
  try { await fetch(`http://127.0.0.1:${PORT}/json/version`); break; } catch { await sleep(300); }
}

const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 1;
const pending = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
};
const send = (method, params = {}) => new Promise((res, rej) => { const i = id++; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });

try {
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width, height: 844, deviceScaleFactor: 1, mobile: width < 700 });
  await send("Page.navigate", { url: BASE + route });
  await sleep(4500);
  const r = await send("Runtime.evaluate", {
    returnByValue: true,
    expression: `(() => {
      const innerW = window.innerWidth;
      const rows = [];
      document.querySelectorAll("*").forEach((el) => {
        const b = el.getBoundingClientRect();
        if (b.width <= 0 || b.right <= innerW + 1) return;
        const cs = getComputedStyle(el);
        rows.push({
          tag: el.tagName,
          cls: String(el.className || "").slice(0, 50),
          right: Math.round(b.right), w: Math.round(b.width),
          display: cs.display, position: cs.position, overflowX: cs.overflowX,
          parent: el.parentElement ? el.parentElement.tagName + "." + String(el.parentElement.className || "").slice(0, 30) : "-",
          parentW: el.parentElement ? Math.round(el.parentElement.getBoundingClientRect().width) : 0,
          parentOverflow: el.parentElement ? getComputedStyle(el.parentElement).overflowX : "-",
        });
      });
      return JSON.stringify(rows.slice(0, 14), null, 1);
    })()`,
  });
  console.log(r.result.value);
} finally {
  child.kill();
}