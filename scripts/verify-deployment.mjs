import { connect } from "@tidbcloud/serverless";
import fs from "fs";
import path from "path";

console.log("=== KiosAI Production & Deployment Readiness Audit ===\n");

// 1. Env validation
const dbUrl = process.env.DATABASE_URL;
const routerUrl = process.env.NINEROUTER_URL || "http://127.0.0.1:20128";
const routerKey = process.env.NINEROUTER_API_KEY_2 || process.env.NINEROUTER_API_KEY || "";

console.log("[1/5] Memeriksa Environment Variables...");
if (!dbUrl) {
  console.error("  ❌ DATABASE_URL missing!");
  process.exit(1);
}
console.log("  ✅ DATABASE_URL: Terdeteksi");
console.log(`  ✅ NINEROUTER_URL: ${routerUrl}`);
console.log(`  ✅ NINEROUTER_API_KEY: ${routerKey ? "Terpasang (Panjang " + routerKey.length + ")" : "KOSONG"}`);

// 2. TiDB Cloud Serverless Check
console.log("\n[2/5] Memeriksa Konektivitas TiDB Cloud Serverless...");
try {
  const conn = connect({ url: dbUrl });
  const ping = await conn.execute("SELECT 1 as ping");
  console.log("  ✅ Ping Database: Sukses");

  const tables = await conn.execute(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'kiosai'"
  );
  const tableNames = tables.map((t) => t.table_name || t.TABLE_NAME);
  console.log(`  ✅ Tabel database: ${tableNames.join(", ")}`);
} catch (e) {
  console.error("  ❌ Database check gagal:", e.message);
  process.exit(1);
}

// 3. Upstream 9Router Check
console.log("\n[3/5] Memeriksa Koneksi Gateway 9Router...");
try {
  const res = await fetch(`${routerUrl}/v1/models`, {
    headers: routerKey ? { Authorization: `Bearer ${routerKey}` } : {},
    signal: AbortSignal.timeout(6000),
  });
  if (res.ok) {
    const data = await res.json();
    console.log(`  ✅ Upstream 9Router HTTP 200: Terdeteksi ${data.data?.length || 0} model aktif`);
  } else {
    console.warn(`  ⚠️ Upstream 9Router mengembalikan HTTP ${res.status}`);
  }
} catch (e) {
  console.warn(`  ⚠️ Upstream 9Router tidak terjangkau di ${routerUrl}:`, e.message);
}

// 4. File Line Count Audit (PRD §6 Constraint)
console.log("\n[4/5] Memeriksa Aturan Maksimal 200 Baris per File...");
let violations = 0;
let totalChecked = 0;
function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (f === "node_modules" || f === ".next" || f === ".git" || f.includes("Design")) continue;
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (/\.(ts|tsx|mjs)$/.test(f)) {
      totalChecked++;
      const lines = fs.readFileSync(full, "utf8").split("\n").length;
      if (lines > 200) {
        console.error(`  ❌ Melebihi 200 baris: ${full} (${lines} baris)`);
        violations++;
      }
    }
  }
}
walk(process.cwd());
if (violations === 0) {
  console.log(`  ✅ Semua ${totalChecked} file sumber TypeScript/MJS patuh <= 200 baris!`);
} else {
  console.error(`  ❌ Terdapat ${violations} file melebihi batas 200 baris!`);
  process.exit(1);
}

// 5. Deployment Instructions
console.log("\n[5/5] Panduan Deployment Siap Produksi:");
console.log("  • Vercel Deployment:");
console.log("    1. Jalankan `vercel --prod` di folder ini.");
console.log("    2. Masukkan env DATABASE_URL, NINEROUTER_URL, dan NINEROUTER_API_KEY_2 di Vercel Dashboard.");
console.log("  • Cloudflare Tunnel (Akses 9Router 24 Jam):");
console.log("    cloudflared tunnel --url http://localhost:20128");
console.log("    Lalu pasang URL tunnel HTTPS yang dihasilkan ke NINEROUTER_URL di Vercel.");
console.log("\n=== Semua Pengecekan Lolos! KiosAI Siap Deploy! ===");
