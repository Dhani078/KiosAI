import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body?.email;
    const password = body?.password;
    const fullName = body?.fullName || body?.name;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
    }

    const existing = await db.queryOne(
      `SELECT id FROM kiosai.users WHERE email = ?`,
      [email.toLowerCase().trim()]
    );

    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }

    const userId = `usr_${crypto.randomUUID()}`;
    const passwordHash = hashPassword(password);
    const initialTokens = 2500000; // 2.5M bonus token (Free tier)

    await db.execute(
      `INSERT INTO kiosai.users (id, email, password_hash, full_name, tier, balance_tokens)
       VALUES (?, ?, ?, ?, 'free', ?)`,
      [userId, email.toLowerCase().trim(), passwordHash, fullName || "Pengguna KiosAI", initialTokens]
    );

    const orderId = crypto.randomUUID();
    await db.execute(
      `INSERT INTO kiosai.orders (id, user_id, amount_idr, tokens_purchased, package_tier, payment_method, status, paid_at)
       VALUES (?, ?, 0, ?, 'free', 'bonus', 'paid', NOW())`,
      [orderId, userId, initialTokens]
    ).catch(() => {});

    const user = {
      id: userId,
      email: email.toLowerCase().trim(),
      full_name: fullName || "Pengguna KiosAI",
      tier: "free",
      balance_tokens: initialTokens,
    };

    return NextResponse.json({
      success: true,
      user,
      message: "Pendaftaran berhasil! Anda mendapatkan 2.500.000 token gratis (Free tier).",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
