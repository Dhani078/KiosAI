#!/usr/bin/env node
/**
 * rotate-admin-password.mjs — ganti password admin `adminfordhani` dengan hash scrypt baru.
 * Password baru ditulis ke backups/ADMIN-CREDENTIALS.txt (folder gitignored) dan ke .env
 * sebagai ADMIN_PASSWORD untuk kebutuhan skrip audit lokal.
 * Pakai: node --env-file=.env scripts/rotate-admin-password.mjs
 */
import crypto from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { connect } from "@tidbcloud/serverless";

const ADMIN_ID = process.env.ADMIN_USER_ID || "usr_admin_dhani";
const ENV = ".env";
const OUT = "backups/ADMIN-CREDENTIALS.txt";

const password = process.env.NEW_ADMIN_PASSWORD || `Sbs-${crypto.randomBytes(18).toString("base64url")}`;
const salt = crypto.randomBytes(16).toString("hex");
const hash = `${salt}:${crypto.scryptSync(password, salt, 64).toString("hex")}`;

const client = connect({ url: process.env.DATABASE_URL });
// Klien HTTP TiDB tidak mengembalikan affected-rows, jadi verifikasi lewat SELECT.
await client.execute("UPDATE kiosai.users SET password_hash = ? WHERE id = ?", [hash, ADMIN_ID]);
const row = (await client.execute("SELECT password_hash FROM kiosai.users WHERE id = ?", [ADMIN_ID]))[0];
if (!row || row.password_hash !== hash) throw new Error("Update gagal diverifikasi (id admin salah?)");

let env = existsSync(ENV) ? readFileSync(ENV, "utf8") : "";
env = env.split(/\r?\n/).filter((l) => !l.startsWith("ADMIN_PASSWORD=")).join("\n").replace(/\n*$/, "\n");
env += `ADMIN_PASSWORD=${password}\n`;
writeFileSync(ENV, env, "utf8");

mkdirSync("backups", { recursive: true });
writeFileSync(
  OUT,
  `identifier: adminfordhani\npassword: ${password}\nupdated: ${new Date().toISOString()}\n`,
  "utf8"
);

console.log("Password admin dirotasi + terverifikasi di TiDB.");
console.log(`Disimpan di: ${OUT} (gitignored) dan ADMIN_PASSWORD di .env.`);
console.log(`PASSWORD BARU: ${password}`);
