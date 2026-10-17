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
      `SELECT id, email, username, full_name, tier, balance_tokens, locked_bonus_tokens, is_pro_unlocked, alert_webhook_url, alert_threshold_tokens, oauth_provider, avatar_url 
       FROM kiosai.users WHERE id = ?`,
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

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, alertWebhookUrl, alertThresholdTokens } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await db.execute(
      `UPDATE kiosai.users 
       SET alert_webhook_url = ?, alert_threshold_tokens = ? 
       WHERE id = ?`,
      [alertWebhookUrl || null, Number(alertThresholdTokens) || 50000, userId]
    );

    return NextResponse.json({ success: true, message: "Pengaturan notifikasi berhasil diperbarui." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
