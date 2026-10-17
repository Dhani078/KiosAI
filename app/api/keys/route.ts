import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiKey, ApiKeyRecord } from "@/lib/keys";
import { readSessionUserId, unauthorized } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const userId = readSessionUserId(req);
  if (!userId) return unauthorized();

  try {
    const keys = await db.query<ApiKeyRecord>(
      `SELECT id, user_id, key_prefix, name, rate_limit_per_min, allowed_models, max_spend_tokens, spent_tokens, is_active, last_used_at, created_at
       FROM kiosai.api_keys WHERE user_id = ? AND is_active = TRUE ORDER BY created_at DESC`,
      [userId]
    );

    return NextResponse.json({ keys });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = readSessionUserId(req);
  if (!userId) return unauthorized();

  try {
    const body = await req.json();
    const name = body.name || "Default Key";
    const allowedModels = body.allowedModels || null;
    const rateLimit = Number(body.rateLimit) || 60;
    const maxSpendTokens = Number(body.maxSpendTokens) || 0;

    const { rawKey, keyRecord } = await createApiKey({
      userId,
      name,
      allowedModels,
      rateLimit,
      maxSpendTokens,
    });

    return NextResponse.json({
      apiKey: rawKey,
      key: keyRecord,
      message: "Simpan API Key ini sekarang. Kunci tidak akan ditampilkan lagi secara lengkap.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
