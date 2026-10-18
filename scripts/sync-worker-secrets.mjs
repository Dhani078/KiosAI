#!/usr/bin/env node
/**
 * sync-worker-secrets.mjs — dorong semua env dari .env lokal ke Worker `kiosai`.
 *
 * Pakai saat: habis ganti kredensial TiDB, ganti key 9Router, atau deploy
 * Worker baru di akun Cloudflare yang sama.
 *
 * Pakai: node --env-file=.env scripts/sync-worker-secrets.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const ACCOUNT_ID = process.env.CF_ACCOUNT_ID || "c734e9afeed67d74624f8dcf9de3c6f8";
const WORKER = process.env.CF_WORKER_NAME || "kiosai";

// Kunci yang dibaca Worker saat runtime (lib/db.ts, lib/proxy-http.ts, lib/oauth.ts).
const KEYS = [
  "DATABASE_URL",
  "NINEROUTER_URL",
  "NINEROUTER_API_KEY_2",
  "NINEROUTER_API_KEY",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "SESSION_SECRET",
  "PAYMENT_WEBHOOK_SECRET",
  "DOKU_CLIENT_ID",
  "DOKU_SECRET_KEY",
  "GEMINI_API_KEY",
];

async function wranglerOauthToken() {
  const paths = [
    join(homedir(), "AppData", "Roaming", "xdg.config", ".wrangler", "config", "default.toml"),
    join(homedir(), ".wrangler", "config", "default.toml"),
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

async function putSecret(token, name, value) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/${WORKER}/secrets`,
    {
      method: "PUT",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ name, text: value, type: "secret_text" }),
    }
  );
  const body = await res.json();
  if (!body.success) throw new Error(`${name}: ${JSON.stringify(body.errors)}`);
  return res.status;
}

const token = await wranglerOauthToken();
let pushed = 0;

for (const key of KEYS) {
  const raw = process.env[key];
  if (!raw) {
    console.log(`  ${key.padEnd(22)} dilewati (kosong di .env)`);
    continue;
  }
  const value = raw.trim().replace(/^["']|["']$/g, "");

  // NINEROUTER_URL lokal (127.0.0.1/localhost) tidak bisa dijangkau Cloudflare edge
  // dan akan menimpa URL tunnel yang sedang aktif. Jalankan `npm run tunnel` untuk itu.
  if (key === "NINEROUTER_URL" && /(127\.0\.0\.1|localhost)/.test(value)) {
    console.log(`  ${key.padEnd(22)} DILEWATI (loopback tidak bisa diakses edge — pakai: npm run tunnel)`);
    continue;
  }

  const status = await putSecret(token, key, value);
  console.log(`  ${key.padEnd(22)} HTTP ${status}  (len ${value.length})`);
  pushed++;
}

console.log(`\n${pushed} secret tersinkron ke Worker "${WORKER}".`);