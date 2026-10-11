import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = (body.identifier || body.username || body.email || "").toLowerCase().trim();
    const password = body.password;

    if (!identifier || !password) {
      return NextResponse.json({ error: "Email/username dan password wajib diisi" }, { status: 400 });
    }

    const searchEmail = identifier === "adminfordhani" ? "adminfordhani@kiosai.id" : identifier;

    const user = await db.queryOne<any>(
      `SELECT id, email, password_hash, full_name, tier, balance_tokens FROM kiosai.users WHERE email = ?`,
      [searchEmail]
    );

    if (!user) {
      return NextResponse.json({ error: "Email/username atau password salah" }, { status: 401 });
    }

    if (user.password_hash) {
      const isValid = verifyPassword(password, user.password_hash);
      if (!isValid) {
        return NextResponse.json({ error: "Email/username atau password salah" }, { status: 401 });
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
