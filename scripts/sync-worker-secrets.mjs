#!/usr/bin/env node
/**
 * sync-worker-secrets.mjs — dorong semua env dari .env lokal ke Worker `kiosai`.
 *
 * Pakai saat: habis ganti kredensial TiDB, ganti key 9Router, atau deploy
 * Worker baru di akun Cloudflare yang sama.
 *
 * Pakai: node --env-file=.env scripts/sync-worker-secrets.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const ACCOUNT_ID = process.env.CF_ACCOUNT_ID || "c734e9afeed67d74624f8dcf9de3c6f8";
const WORKER = process.env.CF_WORKER_NAME || "kiosai";

// Hanya yang dibaca Worker saat runtime (lib/db.ts, lib/proxy-http.ts).
const KEYS = ["DATABASE_URL", "NINEROUTER_URL", "NINEROUTER_API_KEY_2", "NINEROUTER_API_KEY"];

function wranglerOauthToken() {
  const paths = [
    join(homedir(), "AppData", "Roaming", "xdg.config", ".wrangler", "config", "default.toml"),
    join(homedir(), ".wrangler", "config", "default.toml"),
  ];
  for (const p of paths) {
    if (!existsSync(p)) continue;
    const m = readFileSync(p, "utf8").match(/oauth_token = "([^"]+)"/);
    if (m) return m[1];
  }
  throw new Error("OAuth token wrangler tidak ditemukan. Jalankan: npx wrangler login");
}

async function putSecret(token, name, value) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/${WORKER}/secrets`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name, text: value, type: "secret_text" }),
    }
  );
  const body = await res.json();
  if (!body.success) throw new Error(`${name}: ${JSON.stringify(body.errors)}`);
  return res.status;
}

const token = wranglerOauthToken();
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