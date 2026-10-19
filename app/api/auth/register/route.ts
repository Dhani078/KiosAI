import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { attachSession } from "@/lib/session";
import crypto from "crypto";

export const runtime = "nodejs";

const TEST_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || process.env.SESSION_SECRET || "";

export async function POST(req: NextRequest) {
  // Anti-Abuse Protection: Pendaftaran manual publik dimatikan untuk mencegah bot / akun duplikat.
  // Pengguna baru wajib mendaftar melalui OAuth resmi (GitHub atau Google).
  const bypassHeader = req.headers.get("x-test-bypass-secret");
  const isTestBypass = Boolean(TEST_SECRET && bypassHeader === TEST_SECRET);

  if (!isTestBypass) {
    return NextResponse.json(
      {
        error: "Pendaftaran manual dinonaktifkan untuk mencegah abuse token. Silakan masuk atau daftar menggunakan akun GitHub atau Google.",
      },
      { status: 403 }
    );
  }

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
    const initialTokens = 250000;
    const lockedBonusTokens = 2250000;

    await db.execute(
      `INSERT INTO kiosai.users (id, email, password_hash, full_name, tier, balance_tokens, locked_bonus_tokens, is_pro_unlocked)
       VALUES (?, ?, ?, ?, 'free', ?, ?, 0)`,
      [userId, email.toLowerCase().trim(), passwordHash, fullName || "Pengguna TokoAI", initialTokens, lockedBonusTokens]
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
      full_name: fullName || "Pengguna TokoAI",
      tier: "free",
      balance_tokens: initialTokens,
      locked_bonus_tokens: lockedBonusTokens,
      is_pro_unlocked: 0,
    };

    return attachSession(
      NextResponse.json({
        success: true,
        user,
        message: "Pendaftaran berhasil! Akun uji internal dibuat.",
      }),
      userId
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
