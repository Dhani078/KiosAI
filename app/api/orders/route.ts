import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export const runtime = "nodejs";

const PACKAGES: Record<string, { amountIdr: number; tokens: number; name: string; tier: string }> = {
  free: { amountIdr: 0, tokens: 2500000, name: "Free", tier: "free" },
  pro_25k: { amountIdr: 25000, tokens: 100000000, name: "Pro 25K", tier: "pro" },
  pro_100k: { amountIdr: 100000, tokens: 600000000, name: "Pro 100K", tier: "pro" },
  pro_150k: { amountIdr: 150000, tokens: 1000000000, name: "Pro 150K", tier: "pro" },
  // Legacy aliases — orders created before the 2-tier rename.
  bronze: { amountIdr: 25000, tokens: 100000000, name: "Pro 25K", tier: "pro" },
  silver: { amountIdr: 100000, tokens: 600000000, name: "Pro 100K", tier: "pro" },
  gold: { amountIdr: 150000, tokens: 1000000000, name: "Pro 150K", tier: "pro" },
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
    const requestedTier = (body.tier || "pro_25k") as string;

    const pkg = PACKAGES[requestedTier] || PACKAGES.pro_25k;

    if (requestedTier === "free") {
      const existing = await db.queryOne<any>(
        `SELECT id FROM kiosai.orders WHERE user_id = ? AND package_tier = 'free' AND status = 'paid' LIMIT 1`,
        [userId]
      );
      if (existing) {
        return NextResponse.json(
          { error: "Paket Free sudah pernah diklaim pada akun ini. Silakan beli paket Pro." },
          { status: 400 }
        );
      }
    }

    const orderId = crypto.randomUUID();

    await db.execute(
      `INSERT INTO kiosai.orders (id, user_id, amount_idr, tokens_purchased, package_tier, payment_method, status)
       VALUES (?, ?, ?, ?, ?, 'qris', 'pending')`,
      [orderId, userId, pkg.amountIdr, pkg.tokens, pkg.tier]
    );

    return NextResponse.json({
      orderId,
      tier: pkg.tier,
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
