import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyDokuNotification } from "@/lib/doku";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const clientId = req.headers.get("Client-Id") || "";
    const requestId = req.headers.get("Request-Id") || "";
    const requestTimestamp = req.headers.get("Request-Timestamp") || "";
    const signature = req.headers.get("Signature") || "";

    const verified = verifyDokuNotification({
      clientId,
      requestId,
      requestTimestamp,
      signature,
      body,
    });

    if (!verified) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const payload = JSON.parse(body);
    const orderId = payload.order?.invoice_number || payload.invoice_number;
    const transactionStatus = payload.transaction?.status || payload.status;
    const amountPaid = payload.transaction?.amount || payload.amount;

    if (!orderId) {
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    }

    if (transactionStatus !== "SUCCESS" && transactionStatus !== "PAID") {
      return NextResponse.json({ message: "Payment not complete" }, { status: 200 });
    }

    const order = await db.queryOne<any>(
      `SELECT id, user_id, amount_idr, tokens_purchased, package_tier, status FROM kiosai.orders WHERE id = ? LIMIT 1`,
      [orderId]
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "paid") {
      return NextResponse.json({ message: "Already paid" }, { status: 200 });
    }

    if (amountPaid && Math.abs(amountPaid - order.amount_idr) > 1) {
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    const updateRes: any = await db.execute(
      `UPDATE kiosai.orders SET status = 'paid', paid_at = NOW() WHERE id = ? AND status != 'paid'`,
      [orderId],
      { fullResult: true }
    );

    if (updateRes && updateRes.rowsAffected === 0) {
      return NextResponse.json({ message: "Already paid (race condition)" }, { status: 200 });
    }

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

    return NextResponse.json({ success: true, orderId });
  } catch (err: any) {
    console.error("[DOKU QRIS Webhook Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
