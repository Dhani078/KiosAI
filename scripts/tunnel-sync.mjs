#!/usr/bin/env node
/**
 * tunnel-sync.mjs — jalankan Cloudflare Tunnel ke 9Router, lalu push URL-nya
 * ke secret NINEROUTER_URL milik Worker `kiosai` secara otomatis.
 *
 * Kenapa perlu: Quick Tunnel menghasilkan URL acak baru setiap restart.
 * Kalau URL tidak di-sync, Worker akan balas http_403 (loopback ditolak edge).
 *
 * Pakai: npm run tunnel
 * Butuh: cloudflared di PATH + sudah `npx wrangler login`.
 */
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, createWriteStream } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

const ACCOUNT_ID = process.env.CF_ACCOUNT_ID || "c734e9afeed67d74624f8dcf9de3c6f8";
const WORKER = process.env.CF_WORKER_NAME || "kiosai";
const LOCAL_ROUTER = process.env.NINEROUTER_LOCAL || "http://localhost:20128";
const LOG = join(tmpdir(), "cf_tunnel.log");

async function wranglerOauthToken() {
  const paths = [
    join(homedir(), "AppData", "Roaming", "xdg.config", ".wrangler", "config", "default.toml"),
    join(homedir(), ".wrangler", "config", "default.toml"),
    join(homedir(), "Library", "Preferences", ".wrangler", "config", "default.toml"),
  ];
  for (const p of paths) {
    if (!existsSync(p)) continue;
    const content = readFileSync(p, "utf8");
    const m = content.match(/oauth_token = "([^"]+)"/);
    const rt = content.match(/refresh_token = "([^"]+)"/);
    const exp = content.match(/expiration_time = "([^"]+)"/);
    if (!m) continue;
    if (rt && exp && new Date(exp[1]).getTime() - Date.now() < 60_000) {
      try {
        const res = await fetch("https://dash.cloudflare.com/oauth2/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: "54d11594-84e4-41aa-b438-e81b8fa78ee7",
            refresh_token: rt[1],
          }),
        });
        const data = await res.json();
        if (data.access_token) {
          let updated = content.replace(/oauth_token = "[^"]+"/, `oauth_token = "${data.access_token}"`);
          if (data.refresh_token) updated = updated.replace(/refresh_token = "[^"]+"/, `refresh_token = "${data.refresh_token}"`);
          const newExp = new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString();
          updated = updated.replace(/expiration_time = "[^"]+"/, `expiration_time = "${newExp}"`);
          writeFileSync(p, updated, "utf8");
          return data.access_token;
        }
      } catch {}
    }
    return m[1];
  }
  throw new Error("OAuth token wrangler tidak ditemukan. Jalankan: npx wrangler login");
}

async function pushSecret(name, value) {
  const token = await wranglerOauthToken();
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/${WORKER}/secrets`,
    {
      method: "PUT",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ name, text: value, type: "secret_text" }),
    }
  );
  const body = await res.json();
  if (!body.success) throw new Error(`Gagal set ${name}: ${JSON.stringify(body.errors)}`);
  return res.status;
}

function startTunnel() {
  writeFileSync(LOG, "");
  const out = createWriteStream(LOG, { flags: "a" });
  const proc = spawn("cloudflared", ["tunnel", "--url", LOCAL_ROUTER, "--protocol", "http2", "--edge-ip-version", "4", "--no-autoupdate"], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  proc.stdout.pipe(out);
  proc.stderr.pipe(out);
  return proc;
}

function waitForUrl(proc, timeoutMs = 90_000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = setInterval(() => {
      const log = existsSync(LOG) ? readFileSync(LOG, "utf8") : "";
      const m = log.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (m) {
        clearInterval(tick);
        resolve(m[0]);
      } else if (Date.now() - started > timeoutMs) {
        clearInterval(tick);
        reject(new Error("Timeout menunggu URL tunnel. Cek " + LOG));
      }
    }, 1000);
    proc.on("exit", (code) => {
      clearInterval(tick);
      reject(new Error(`cloudflared keluar dengan kode ${code}`));
    });
  });
}

async function verify(tunnelUrl) {
  for (let attempt = 1; attempt <= 12; attempt++) {
    try {
      const res = await fetch(`${tunnelUrl}/v1/models`, { signal: AbortSignal.timeout(10_000) });
      if (res.status === 401 || res.ok) return `HTTP ${res.status}`;
    } catch {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  return "HTTP provisional";
}

async function runTunnelSupervisor() {
  while (true) {
    let proc = null;
    try {
      proc = startTunnel();
      const url = await waitForUrl(proc);
      console.log(`\nTunnel aktif: ${url}`);
      const check = await verify(url);
      console.log(`Verifikasi tunnel -> 9Router: ${check}`);
      const status = await pushSecret("NINEROUTER_URL", url);
      console.log(`NINEROUTER_URL terpasang di Worker "${WORKER}" (HTTP ${status})`);
      console.log(`\nWorker live: https://${WORKER}.<subdomain>.workers.dev`);

      await new Promise((resolve) => {
        proc.on("exit", resolve);
      });
      console.warn("Tunnel terputus. Mencoba reconnect otomatis dalam 5 detik...");
    } catch (err) {
      console.error("Tunnel error:", err.message);
      if (proc) try { proc.kill(); } catch {}
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
}

runTunnelSupervisor();

process.on("SIGINT", () => {
  console.log("\nMenghentikan tunnel...");
  process.exit(0);
});