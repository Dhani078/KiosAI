import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
    }

    const user = await db.queryOne<any>(
      `SELECT id, email, password_hash, full_name, tier, balance_tokens FROM kiosai.users WHERE email = ?`,
      [email.toLowerCase().trim()]
    );

    if (!user) {
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    }

    if (user.password_hash) {
      const isValid = verifyPassword(password, user.password_hash);
      if (!isValid) {
        return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        tier: user.tier,
        balance_tokens: user.balance_tokens,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
