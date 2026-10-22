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
      `SELECT id, user_id, amount_idr, tokens_purchased, status FROM kiosai.orders WHERE id = ? LIMIT 1`,
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
      `UPDATE kiosai.users SET balance = balance + ? WHERE id = ?`,
      [order.tokens_purchased, order.user_id]
    );

    return NextResponse.json({ success: true, orderId });
  } catch (err: any) {
    console.error("[DOKU QRIS Webhook Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
