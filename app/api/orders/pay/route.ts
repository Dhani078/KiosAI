import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readSessionUserId, unauthorized } from "@/lib/session";

export const runtime = "nodejs";

const TEST_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || "";

export async function POST(req: NextRequest) {
  // Hanya pemilik order (dari sesi cookie) yang boleh melunasi ordernya sendiri.
  const sessionUserId = readSessionUserId(req);
  if (!sessionUserId) return unauthorized();

  try {
    const body = await req.json();
    const orderId = body.orderId;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const order = await db.queryOne<any>(
      `SELECT * FROM kiosai.orders WHERE id = ?`,
      [orderId]
    );

    if (!order || order.user_id !== sessionUserId) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Jika pesanan sudah berstatus paid (misal via AI Vision OCR verifier atau Webhook)
    if (order.status === "paid") {
      return NextResponse.json({ success: true, message: "Pesanan ini sudah lunas.", order });
    }

    const isFree = order.package_tier === "free" || Number(order.amount_idr) === 0;
    const bypassHeader = req.headers.get("x-test-bypass-secret");
    const isTestBypass = Boolean(TEST_SECRET && bypassHeader === TEST_SECRET);

    if (isFree) {
      const alreadyClaimed = await db.queryOne<any>(
        `SELECT id FROM kiosai.orders WHERE user_id = ? AND package_tier = 'free' AND status = 'paid' LIMIT 1`,
        [sessionUserId]
      );
      if (alreadyClaimed) {
        return NextResponse.json(
          { error: "Paket Free sudah pernah diklaim pada akun ini. Silakan beli paket Pro." },
          { status: 400 }
        );
      }
    }

    // Keamanan produksi: Pesanan berbayar DILARANG dilunasi langsung tanpa bukti struk atau webhook
    if (!isFree && !isTestBypass) {
      return NextResponse.json(
        {
          success: false,
          error: "Pembayaran belum terkonfirmasi. Silakan unggah bukti struk transfer di atas untuk verifikasi instan via AI atau tunggu konfirmasi otomatis gateway.",
        },
        { status: 400 }
      );
    }

    // Atomic Compare-And-Swap (CAS): Hanya update jika status belum paid
    const updateRes: any = await db.execute(
      `UPDATE kiosai.orders SET status = 'paid', paid_at = NOW() WHERE id = ? AND status != 'paid'`,
      [orderId],
      { fullResult: true }
    );

    if (updateRes && updateRes.rowsAffected === 0) {
      return NextResponse.json({ success: true, message: "Pesanan ini sudah lunas.", order });
    }

    // Add tokens to user, match-vest bonus from vault, and upgrade tier to Pro
    await db.execute(
      `UPDATE kiosai.users 
       SET balance_tokens = balance_tokens + ? + LEAST(locked_bonus_tokens, ?),
           locked_bonus_tokens = GREATEST(0, locked_bonus_tokens - ?),
           is_pro_unlocked = 1,
           tier = CASE 
             WHEN ? IN ('pro', 'pro_25k', 'pro_100k', 'pro_150k', 'bronze', 'silver', 'gold', 'test_1', 'test_100') THEN 'pro'
             ELSE tier
           END
       WHERE id = ?`,
      [order.tokens_purchased, order.tokens_purchased, order.tokens_purchased, order.package_tier, order.user_id]
    );

    return NextResponse.json({
      success: true,
      message: `Pembayaran berhasil! ${Number(order.tokens_purchased).toLocaleString("id-ID")} token telah ditambahkan.`,
      tokensAdded: order.tokens_purchased,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
