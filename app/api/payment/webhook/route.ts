import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export const runtime = "nodejs";

const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || "kiosai_webhook_secret_key";

function verifySignature(payload: string, signature: string): boolean {
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-callback-signature") || req.headers.get("x-signature") || "";

    // If production secret configured, verify HMAC signature
    if (process.env.PAYMENT_WEBHOOK_SECRET && !verifySignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const orderId = payload.order_id || payload.orderId || payload.reference;
    const status = payload.status || payload.transaction_status;

    if (!orderId) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
    }

    // Only process paid / settlement statuses
    if (!["paid", "settlement", "success"].includes(status?.toLowerCase())) {
      return NextResponse.json({ message: "Ignored non-success status", status });
    }

    const order = await db.queryOne<any>(
      `SELECT * FROM kiosai.orders WHERE id = ?`,
      [orderId]
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Idempotency: Prevent duplicate execution
    if (order.status === "paid") {
      return NextResponse.json({ success: true, message: "Order already fulfilled (idempotent)" });
    }

    // Mark order paid
    await db.execute(
      `UPDATE kiosai.orders SET status = 'paid', paid_at = NOW() WHERE id = ?`,
      [orderId]
    );

    // Credit tokens to user, match-vest bonus from vault (100% match), and upgrade tier to Pro
    // Prevents F-01 arbitrage: bonus unlocks proportionally with purchased tokens
    await db.execute(
      `UPDATE kiosai.users 
       SET balance_tokens = balance_tokens + ? + LEAST(locked_bonus_tokens, ?),
           locked_bonus_tokens = GREATEST(0, locked_bonus_tokens - ?),
           is_pro_unlocked = 1,
           tier = CASE 
             WHEN ? IN ('pro', 'pro_25k', 'pro_100k', 'pro_150k', 'bronze', 'silver', 'gold') THEN 'pro'
             ELSE tier
           END
       WHERE id = ?`,
      [order.tokens_purchased, order.tokens_purchased, order.tokens_purchased, order.package_tier, order.user_id]
    );

    return NextResponse.json({
      success: true,
      message: `Order ${orderId} successfully fulfilled. Credited ${order.tokens_purchased} tokens.`,
      orderId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
