import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export const runtime = "nodejs";

const PACKAGES = {
  free: { amountIdr: 0, tokens: 5000000, name: "Free Bansos", tier: "bronze" },
  starter: { amountIdr: 5000, tokens: 15000000, name: "Starter", tier: "bronze" },
  bronze: { amountIdr: 25000, tokens: 100000000, name: "Bronze", tier: "bronze" },
  silver: { amountIdr: 100000, tokens: 600000000, name: "Silver", tier: "silver" },
  gold: { amountIdr: 150000, tokens: 1000000000, name: "Gold", tier: "gold" },
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
      [orderId, userId, pkg.amountIdr, pkg.tokens, pkg.tier]
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
