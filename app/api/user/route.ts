import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UserRecord } from "@/lib/keys";
import { createPlaygroundToken } from "@/lib/session-key";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("id") || "usr_kiosai_demo";

  try {
    const user = await db.queryOne<UserRecord>(
      `SELECT id, email, full_name, tier, balance_tokens FROM kiosai.users WHERE id = ?`,
      [userId]
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get recent usage
    const usage = await db.query(
      `SELECT model, total_tokens, latency_ms, created_at FROM kiosai.usage_logs 
       WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`,
      [userId]
    );

    return NextResponse.json({
      user,
      recentUsage: usage,
      playgroundKey: createPlaygroundToken(user.id),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
