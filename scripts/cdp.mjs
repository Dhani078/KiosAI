/**
 * Shared CDP helper for the local UI audits — no extra npm deps, drives the
 * installed chrome-headless-shell directly.
 */
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function findShell() {
  const root = join(homedir(), "AppData", "Local", "ms-playwright");
  if (!existsSync(root)) return null;
  for (const dir of readdirSync(root)) {
    if (!dir.startsWith("chromium_headless_shell")) continue;
    const p = join(root, dir, "chrome-headless-shell-win64", "chrome-headless-shell.exe");
    if (existsSync(p)) return p;
  }
  return null;
}

export async function launch(port) {
  const shell = findShell();
  if (!shell) throw new Error("chrome-headless-shell not found under %LOCALAPPDATA%\\ms-playwright");
  const child = spawn(
    shell,
    [
      `--remote-debugging-port=${port}`,
      "--headless",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--user-data-dir=" + join(homedir(), "AppData", "Local", "Temp", `cdp-${port}-${Date.now()}`),
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  for (let i = 0; i < 50; i++) {
    try {
      await fetch(`http://127.0.0.1:${port}/json/version`);
      return child;
    } catch {
      await sleep(300);
    }
  }
  child.kill();
  throw new Error("CDP endpoint never came up on port " + port);
}

export async function connect(port) {
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });
  let nextId = 1;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
    }
  };
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const id = nextId++;
      pending.set(id, { res, rej });
      ws.send(JSON.stringify({ id, method, params }));
    });

  const evaluate = async (expression) => {
    const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + (r.exceptionDetails.exception?.description || ""));
    return r.result.value;
  };

  const goto = async (url, settleMs = 3000) => {
    await send("Page.navigate", { url });
    await sleep(settleMs);
  };

  return { send, evaluate, goto, close: () => ws.close() };
}

/** Overflow + text probe reused by both audits. */
export const REPORT_EXPR = `(() => {
  const innerW = window.innerWidth;
  const isClipped = (el) => {
    let p = el.parentElement;
    while (p && p !== document.body) {
      const ox = getComputedStyle(p).overflowX;
      if (ox === "auto" || ox === "hidden" || ox === "scroll") return true;
      p = p.parentElement;
    }
    return false;
  };
  const bad = [];
  document.querySelectorAll("*").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.right > innerW + 1 && !isClipped(el)) {
      bad.push(el.tagName + "." + String(el.className || "").slice(0, 40) + " right=" + Math.round(r.right));
    }
  });
  return {
    docW: document.documentElement.scrollWidth,
    bodyW: document.body.scrollWidth,
    innerW,
    overflowCount: bad.length,
    sample: bad.slice(0, 6),
    text: document.body.innerText,
  };
})()`;