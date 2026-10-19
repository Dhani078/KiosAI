#!/usr/bin/env node
/**
 * Security regression test — memastikan permukaan API tidak lagi bisa dipakai tanpa sesi.
 * Jalankan: npm run test:security   (butuh server di :3000)
 */
import crypto from "node:crypto";

const BASE = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const SECRET = process.env.PAYMENT_WEBHOOK_SECRET || "";
let pass = 0;
let fail = 0;

function check(name, ok, detail = "") {
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  " + detail : ""}`);
}

async function call(path, { method = "GET", body, cookie, headers = {} } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  const setCookie = res.headers.get("set-cookie") || "";
  const cookieValue = setCookie.split(";")[0];
  return { status: res.status, data, cookie: cookieValue };
}

async function register(tag) {
  const r = await call("/api/auth/register", {
    method: "POST",
    body: { email: `secaudit_${tag}_${Date.now()}@kiosai.id`, password: "SecurityAudit123!", name: "Security Audit" },
  });
  return { userId: r.data?.user?.id, cookie: r.cookie, status: r.status };
}

console.log(`\n=== Security Regression Suite ===\nTarget: ${BASE}\n`);

for (const path of ["/api/user", "/api/keys", "/api/orders", "/api/analytics"]) {
  const r = await call(path);
  check(`tanpa sesi ${path} -> 401`, r.status === 401, `got ${r.status}`);
}

const a = await register("a");
const b = await register("b");
check("register mengirim cookie HttpOnly", a.status === 200 && a.cookie.startsWith("kiosai_session="), a.cookie ? "cookie ada" : "cookie kosong");

const spoof = await call(`/api/user?id=${b.userId}`, { cookie: a.cookie });
check("GET /api/user?id=<user lain> mengembalikan sesi sendiri", spoof.data?.user?.id === a.userId, `id=${spoof.data?.user?.id}`);

const bKeys = await call("/api/keys", { cookie: b.cookie });
const aKeys = await call("/api/keys", { cookie: a.cookie });
check("daftar key terpisah per sesi", bKeys.status === 200 && aKeys.status === 200 && (bKeys.data.keys || []).every((k) => k.user_id === b.userId));

const order = await call("/api/orders", { method: "POST", body: { tier: "pro_25k" }, cookie: a.cookie });
const orderId = order.data?.orderId;
const steal = await call("/api/orders/pay", { method: "POST", body: { orderId }, cookie: b.cookie });
check("user lain tidak bisa melunasi order orang lain", steal.status === 404, `got ${steal.status}`);

const rejected = await call("/api/orders/pay", { method: "POST", body: { orderId }, cookie: a.cookie });
check("pelunasan tanpa struk/webhook ditolak", rejected.status === 400, `got ${rejected.status}`);

const pay = await call("/api/orders/pay", { method: "POST", body: { orderId }, cookie: a.cookie, headers: { "x-test-bypass-secret": SECRET || "" } });
const after = await call("/api/user", { cookie: a.cookie });
check("pemilik bisa melunasi order dengan verifikasi", pay.status === 200 && Number(after.data?.user?.balance_tokens) > 100000000, `saldo=${after.data?.user?.balance_tokens}`);

const foreignKey = await call("/api/keys", { method: "POST", body: { userId: b.userId, name: "hijack" }, cookie: a.cookie });
const bKeysAfter = await call("/api/keys", { cookie: b.cookie });
check("POST /api/keys mengabaikan userId di body", (bKeysAfter.data.keys || []).every((k) => k.name !== "hijack") && foreignKey.status === 200);

const unsigned = await call("/api/payment/webhook", { method: "POST", body: { order_id: orderId, status: "paid" } });
check("webhook tanpa signature ditolak", unsigned.status === 401, `got ${unsigned.status}`);

const badSig = await call("/api/payment/webhook", { method: "POST", body: { order_id: orderId, status: "paid" }, headers: { "x-signature": "deadbeef" } });
check("webhook signature salah ditolak", badSig.status === 401, `got ${badSig.status}`);

if (SECRET) {
  const pending = await call("/api/orders", { method: "POST", body: { tier: "pro_100k" }, cookie: a.cookie });
  const payload = JSON.stringify({ order_id: pending.data.orderId, status: "paid" });
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  const signed = await call("/api/payment/webhook", {
    method: "POST",
    headers: { "x-signature": sig },
    body: { order_id: pending.data.orderId, status: "paid" },
  });
  const idem = await call("/api/payment/webhook", {
    method: "POST",
    headers: { "x-signature": sig },
    body: { order_id: pending.data.orderId, status: "paid" },
  });
  check("webhook signature valid diproses + idempoten", signed.status === 200 && idem.status === 200 && /idempotent/.test(idem.data?.message || ""));
}

const unauthReceipt = await call("/api/orders/verify-receipt", { method: "POST", body: { orderId: "dummy", imageBase64: "dGVzdA==" } });
check("verify-receipt tanpa sesi ditolak", unauthReceipt.status === 401, `got ${unauthReceipt.status}`);

const foreignReceipt = await call("/api/orders/verify-receipt", { method: "POST", body: { orderId, imageBase64: "dGVzdA==" }, cookie: b.cookie });
check("verify-receipt pesanan user lain ditolak", foreignReceipt.status === 404, `got ${foreignReceipt.status}`);

const oversized = await call("/api/orders/verify-receipt", { method: "POST", body: { orderId, imageBase64: "A".repeat(6 * 1024 * 1024) }, cookie: a.cookie });
check("verify-receipt payload >5MB ditolak", oversized.status === 413, `got ${oversized.status}`);

const logout = await call("/api/auth/logout", { method: "POST", cookie: a.cookie });
const afterLogout = await call("/api/user", { cookie: logout.cookie });
check("logout mencabut sesi", afterLogout.status === 401, `got ${afterLogout.status}`);

console.log(`\n=== Hasil: ${pass} lolos, ${fail} gagal ===`);
process.exit(fail === 0 ? 0 : 1);
