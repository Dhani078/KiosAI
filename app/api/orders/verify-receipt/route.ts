import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readSessionUserId, unauthorized } from "@/lib/session";
import { verifyReceiptWithAI } from "@/lib/receipt-verifier";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sessionUserId = readSessionUserId(req);
  if (!sessionUserId) return unauthorized();

  try {
    const body = await req.json();
    const { orderId, imageBase64, mimeType } = body;

    if (!orderId || !imageBase64) {
      return NextResponse.json({ error: "orderId dan gambar bukti struk (imageBase64) wajib diisi." }, { status: 400 });
    }

    const order = await db.queryOne<any>(
      `SELECT * FROM kiosai.orders WHERE id = ?`,
      [orderId]
    );

    if (!order || order.user_id !== sessionUserId) {
      return NextResponse.json({ error: "Order tidak ditemukan pada akun ini." }, { status: 404 });
    }

    if (order.status === "paid") {
      return NextResponse.json({ success: true, message: "Order sudah terverifikasi dan berstatus lunas.", order });
    }

    // Panggil AI Vision OCR
    const verification = await verifyReceiptWithAI({
      imageBase64,
      mimeType: mimeType || "image/jpeg",
      expectedAmount: Number(order.amount_idr),
    });

    if (!verification.valid) {
      return NextResponse.json({ error: verification.error || "Bukti transfer tidak valid." }, { status: 400 });
    }

    // Tandai order paid di database
    await db.execute(
      `UPDATE kiosai.orders SET status = 'paid', paid_at = NOW() WHERE id = ?`,
      [orderId]
    );

    // Tambah saldo token, cairkan locked bonus dari brankas, dan upgrade tier ke Pro
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
      message: `Bukti transfer Rp ${Number(order.amount_idr).toLocaleString("id-ID")} terverifikasi oleh AI Vision! ${Number(order.tokens_purchased).toLocaleString("id-ID")} token telah ditambahkan.`,
      tokensAdded: order.tokens_purchased,
      verifiedBy: "gemini-3.8-flash",
      transactionId: verification.transactionId || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
