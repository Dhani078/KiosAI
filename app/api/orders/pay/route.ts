import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readSessionUserId, unauthorized } from "@/lib/session";

export const runtime = "nodejs";

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

    if (order.status === "paid") {
      return NextResponse.json({ message: "Order already paid", order });
    }

    // Atomic Compare-And-Swap (CAS): Hanya update jika status belum paid
    const updateRes: any = await db.execute(
      `UPDATE kiosai.orders SET status = 'paid', paid_at = NOW() WHERE id = ? AND status != 'paid'`,
      [orderId],
      { fullResult: true }
    );

    if (updateRes && updateRes.rowsAffected === 0) {
      return NextResponse.json({ message: "Order already paid", order });
    }

    // Add tokens to user, match-vest bonus from vault, and upgrade tier to Pro
    await db.execute(
      `UPDATE kiosai.users 
       SET balance_tokens = balance_tokens + ? + LEAST(locked_bonus_tokens, ?),
           locked_bonus_tokens = GREATEST(0, locked_bonus_tokens - ?),
           is_pro_unlocked = 1,
           tier = CASE 
             WHEN ? IN ('pro', 'pro_25k', 'pro_100k', 'pro_150k', 'bronze', 'silver', 'gold', 'test_100') THEN 'pro'
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
