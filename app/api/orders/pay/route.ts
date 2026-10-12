import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
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

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "paid") {
      return NextResponse.json({ message: "Order already paid", order });
    }

    // Update order status
    await db.execute(
      `UPDATE kiosai.orders SET status = 'paid', paid_at = NOW() WHERE id = ?`,
      [orderId]
    );

    // Add tokens to user and upgrade tier if higher
    await db.execute(
      `UPDATE kiosai.users 
       SET balance_tokens = balance_tokens + ?,
           tier = CASE 
             WHEN ? = 'gold' THEN 'gold'
             WHEN ? = 'silver' AND tier != 'gold' THEN 'silver'
             WHEN ? = 'bronze' AND tier NOT IN ('silver', 'gold') THEN 'bronze'
             ELSE tier
           END
       WHERE id = ?`,
      [order.tokens_purchased, order.package_tier, order.package_tier, order.package_tier, order.user_id]
    );

    return NextResponse.json({
      success: true,
      message: `Pembayaran berhasil! ${order.tokens_purchased.toLocaleString()} token telah ditambahkan.`,
      tokensAdded: order.tokens_purchased,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
