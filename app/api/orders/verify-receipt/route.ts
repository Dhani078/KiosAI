import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readSessionUserId, unauthorized } from "@/lib/session";
import { verifyReceiptWithAI } from "@/lib/receipt-verifier";
import crypto from "crypto";

export const runtime = "nodejs";

const BASE_AMOUNTS: Record<string, number> = {
  test_100: 100,
  pro_25k: 25000,
  pro_100k: 100000,
  pro_150k: 150000,
  bronze: 25000,
  silver: 100000,
  gold: 150000,
};

export async function POST(req: NextRequest) {
  const sessionUserId = readSessionUserId(req);
  if (!sessionUserId) return unauthorized();

  try {
    const body = await req.json();
    const { orderId, imageBase64, mimeType } = body;

    if (!orderId || !imageBase64) {
      return NextResponse.json({ error: "orderId dan bukti struk (imageBase64) wajib diisi." }, { status: 400 });
    }

    if (typeof imageBase64 !== "string" || imageBase64.length > 7_000_000) {
      return NextResponse.json({ error: "Ukuran file bukti transfer maksimal 5 MB." }, { status: 413 });
    }

    let safeMime = String(mimeType || "image/jpeg").toLowerCase().trim();
    if (safeMime === "image/jpg") safeMime = "image/jpeg";
    if (!safeMime.startsWith("image/")) safeMime = "image/jpeg";

    // 1. Anti-Replay Lapisan 1: Cek Hash SHA-256 Foto Struk
    const cleanImg = imageBase64.replace(/^data:[^;]+;base64,/, "").trim();
    const receiptHash = crypto.createHash("sha256").update(cleanImg).digest("hex");
    const duplicateImg = await db.queryOne<any>(
      `SELECT id FROM kiosai.orders WHERE receipt_hash = ? AND status = 'paid' LIMIT 1`,
      [receiptHash]
    );
    if (duplicateImg) {
      return NextResponse.json({
        error: "Foto struk transfer ini sudah pernah digunakan sebelumnya (Anti-Duplicate Image Protection).",
      }, { status: 400 });
    }

    const order = await db.queryOne<any>(
      `SELECT * FROM kiosai.orders WHERE id = ?`,
      [orderId]
    );

    if (!order || order.user_id !== sessionUserId) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan pada akun ini." }, { status: 404 });
    }

    if (order.status === "paid") {
      return NextResponse.json({ success: true, message: "Pesanan ini sudah lunas.", order });
    }

    const baseAmount = BASE_AMOUNTS[order.package_tier] || Number(order.amount_idr);

    // Verifikasi via AI Multimodal OCR
    const verification = await verifyReceiptWithAI({
      imageBase64,
      mimeType: safeMime,
      expectedAmount: Number(order.amount_idr),
      expectedBaseAmount: baseAmount,
    });

    if (!verification.valid) {
      return NextResponse.json({ error: verification.error || "Bukti transfer tidak valid." }, { status: 400 });
    }

    // 2. Anti-Replay Lapisan 2: Wajib ada ID transaksi unik dari struk
    if (!verification.transactionId || verification.transactionId.length < 5) {
      return NextResponse.json({
        error: "Nomor referensi transaksi tidak terbaca pada struk. Pastikan nomor transaksi terlihat jelas.",
      }, { status: 400 });
    }

    const existing = await db.queryOne<any>(
      `SELECT id FROM kiosai.orders WHERE payment_ref = ? AND status = 'paid' LIMIT 1`,
      [verification.transactionId]
    );
    if (existing) {
      return NextResponse.json({
        error: "Nomor referensi transaksi ini sudah pernah digunakan untuk pesanan lain (Anti-Duplicate Reference Protection).",
      }, { status: 400 });
    }

    // Atomic CAS: Kunci pesanan dan simpan nomor referensi serta hash struk
    const updateRes: any = await db.execute(
      `UPDATE kiosai.orders SET status = 'paid', paid_at = NOW(), payment_ref = ?, receipt_hash = ? WHERE id = ? AND status != 'paid'`,
      [verification.transactionId, receiptHash, orderId],
      { fullResult: true }
    );

    if (updateRes && updateRes.rowsAffected === 0) {
      return NextResponse.json({ success: true, message: "Pesanan ini sudah lunas.", order });
    }

    // Kredit token, buka bonus brankas, dan upgrade tier ke Pro
    await db.execute(
      `UPDATE kiosai.users 
       SET balance_tokens = balance_tokens + ? + LEAST(locked_bonus_tokens, ?),
           locked_bonus_tokens = GREATEST(0, locked_bonus_tokens - ?),
           is_pro_unlocked = 1,
           tier = 'pro'
       WHERE id = ?`,
      [order.tokens_purchased, order.tokens_purchased, order.tokens_purchased, order.user_id]
    );

    return NextResponse.json({
      success: true,
      message: `Bukti transfer Rp ${Number(verification.amount || order.amount_idr).toLocaleString("id-ID")} berhasil diverifikasi! ${Number(order.tokens_purchased).toLocaleString("id-ID")} token telah ditambahkan.`,
      tokensAdded: order.tokens_purchased,
      verifiedBy: verification.modelUsed || "gemini-vision",
      transactionId: verification.transactionId || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
