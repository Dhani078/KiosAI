import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName } = await req.json();

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
    const initialTokens = 5000000; // 5M trial token (Free Plan Bansos)

    await db.execute(
      `INSERT INTO kiosai.users (id, email, password_hash, full_name, tier, balance_tokens)
       VALUES (?, ?, ?, ?, 'bronze', ?)`,
      [userId, email.toLowerCase().trim(), passwordHash, fullName || "Pengguna KiosAI", initialTokens]
    );

    const user = {
      id: userId,
      email: email.toLowerCase().trim(),
      full_name: fullName || "Pengguna KiosAI",
      tier: "bronze",
      balance_tokens: initialTokens,
    };

    return NextResponse.json({
      success: true,
      user,
      message: "Pendaftaran berhasil! Anda mendapatkan 5.000.000 token uji coba gratis (Free Plan).",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
