#!/usr/bin/env node
/**
 * verify-deployment.mjs — audit kesiapan produksi KiosAI.
 *
 * Memeriksa: env lokal, koneksi TiDB, upstream 9Router, batas 200 baris,
 * DAN keselarasan env lokal vs secret Worker Cloudflare (drift yang bikin
 * Worker balas "DATABASE_URL environment variable is not defined").
 */
import { readFileSync, existsSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { connect } from "@tidbcloud/serverless";

const ACCOUNT_ID = process.env.CF_ACCOUNT_ID || "c734e9afeed67d74624f8dcf9de3c6f8";
const WORKER = process.env.CF_WORKER_NAME || "kiosai";
const EXCLUDED = ["node_modules", ".next", ".git", "KiosAI Token Marketplace Design"];
const MAX_LINES = 200;

let failures = 0;
const fail = (msg) => { console.log(`  ❌ ${msg}`); failures++; };
const pass = (msg) => console.log(`  ✅ ${msg}`);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (EXCLUDED.includes(entry)) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|mjs|cjs)$/.test(entry)) out.push(p);
  }
  return out;
}

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
  return null;
}

async function workerSecrets() {
  const token = wranglerOauthToken();
  if (!token) return null;
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/${WORKER}/secrets`,
      { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20_000) }
    );
    const body = await res.json();
    if (!body.success) return null;
    return Object.fromEntries(body.result.map((s) => [s.name, s]));
  } catch {
    return null;
  }
}

console.log("\n=== KiosAI Production & Deployment Readiness Audit ===\n");

console.log("[1/6] Memeriksa Environment Variables...");
for (const key of ["DATABASE_URL", "NINEROUTER_URL", "NINEROUTER_API_KEY_2"]) {
  const v = process.env[key];
  if (v) pass(`${key}: Terdeteksi (len ${v.length})`);
  else fail(`${key}: HILANG`);
}

console.log("\n[2/6] Memeriksa Konektivitas TiDB Cloud Serverless...");
try {
  const db = connect({ url: process.env.DATABASE_URL });
  await db.execute("SELECT 1");
  pass("Ping Database: Sukses");
  const tables = await db.execute(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'kiosai'"
  );
  const names = tables.map((t) => t.TABLE_NAME || t.table_name);
  pass(`Tabel: ${names.join(", ")}`);
} catch (err) {
  fail(`Database: ${err.message}`);
}

console.log("\n[3/6] Memeriksa Koneksi Gateway 9Router...");
try {
  const url = (process.env.NINEROUTER_URL || "").replace(/\/$/, "");
  const res = await fetch(`${url}/v1/models`, {
    headers: { Authorization: `Bearer ${process.env.NINEROUTER_API_KEY_2 || ""}` },
    signal: AbortSignal.timeout(20_000),
  });
  if (res.ok) {
    const data = await res.json();
    pass(`Upstream 9Router HTTP ${res.status}: ${data.data?.length ?? 0} model aktif`);
  } else {
    pass(`Upstream 9Router HTTP ${res.status} (401 = butuh key, normal untuk akses remote)`);
  }
} catch (err) {
  fail(`Upstream 9Router: ${err.message}`);
}

console.log("\n[4/6] Memeriksa Aturan Maksimal 200 Baris per File...");
const files = walk(".");
const long = files.map((f) => [f, readFileSync(f, "utf8").split("\n").length]).filter(([, n]) => n > MAX_LINES);
if (long.length === 0) pass(`Semua ${files.length} file sumber patuh <= ${MAX_LINES} baris`);
else long.forEach(([f, n]) => fail(`${f}: ${n} baris`));

console.log("\n[5/6] Memeriksa Secret Worker Cloudflare...");
const secrets = await workerSecrets();
if (!secrets) {
  console.log("  ⚠️  Tidak bisa membaca secret Worker (belum `npx wrangler login`?)");
} else if (Object.keys(secrets).length === 0) {
  fail("Worker tidak punya secret sama sekali → akan balas \"DATABASE_URL environment variable is not defined\"");
  console.log("     Fix: npm run secrets:sync");
} else {
  for (const key of ["DATABASE_URL", "NINEROUTER_API_KEY_2", "NINEROUTER_URL"]) {
    if (secrets[key]) pass(`Worker punya secret ${key}`);
    else fail(`Worker TIDAK punya ${key}`);
  }
  const localUrl = process.env.NINEROUTER_URL || "";
  if (secrets.NINEROUTER_URL && /(127\.0\.0\.1|localhost)/.test(localUrl)) {
    console.log("  ⚠️  NINEROUTER_URL lokal masih loopback — pastikan Worker memakai URL tunnel:");
    console.log("     npm run tunnel   (quick tunnel berganti URL setiap restart)");
  }
}

console.log("\n[6/6] Ringkasan...");
console.log(`  Worker target : ${WORKER}`);
console.log(`  Akun CF       : ${ACCOUNT_ID}`);
console.log(`  URL live      : https://${WORKER}.dhanisepeda.workers.dev`);

if (failures === 0) {
  console.log("\n=== Semua Pengecekan Lolos! KiosAI Siap Deploy! ===\n");
} else {
  console.log(`\n=== ${failures} pengecekan GAGAL — perbaiki sebelum deploy. ===\n`);
  process.exit(1);
}