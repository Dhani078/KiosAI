import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export const runtime = "nodejs";

const PACKAGES = {
  bronze: { amountIdr: 50000, tokens: 1000000, name: "Bronze Starter" },
  silver: { amountIdr: 150000, tokens: 3500000, name: "Silver Pro" },
  gold: { amountIdr: 400000, tokens: 10000000, name: "Gold Enterprise" },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "usr_kiosai_demo";

  try {
    const orders = await db.query(
      `SELECT id, user_id, amount_idr, tokens_purchased, package_tier, payment_method, status, paid_at, created_at
       FROM kiosai.orders
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    return NextResponse.json({ orders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = body.userId || "usr_kiosai_demo";
    const tier = (body.tier || "bronze") as keyof typeof PACKAGES;

    const pkg = PACKAGES[tier];
    if (!pkg) {
      return NextResponse.json({ error: "Invalid tier selected" }, { status: 400 });
    }

    const orderId = crypto.randomUUID();

    await db.execute(
      `INSERT INTO kiosai.orders (id, user_id, amount_idr, tokens_purchased, package_tier, payment_method, status)
       VALUES (?, ?, ?, ?, ?, 'qris', 'pending')`,
      [orderId, userId, pkg.amountIdr, pkg.tokens, tier]
    );

    return NextResponse.json({
      orderId,
      tier,
      packageName: pkg.name,
      amountIdr: pkg.amountIdr,
      tokensPurchased: pkg.tokens,
      qrisUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=KIOSAI-QRIS-${orderId}`,
      status: "pending",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
