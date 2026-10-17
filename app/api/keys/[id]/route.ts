import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readSessionUserId, unauthorized } from "@/lib/session";

export const runtime = "nodejs";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = readSessionUserId(req);
  if (!userId) return unauthorized();

  try {
    const { id } = await params;
    // Klien HTTP TiDB tidak mengembalikan affected-rows: cek kepemilikan dulu, baru update.
    const owned = await db.queryOne<any>(
      `SELECT id FROM kiosai.api_keys WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
    if (!owned) {
      return NextResponse.json({ error: "API key tidak ditemukan di akun ini" }, { status: 404 });
    }
    await db.execute(`UPDATE kiosai.api_keys SET is_active = FALSE WHERE id = ? AND user_id = ?`, [id, userId]);
    return NextResponse.json({ success: true, message: "API key deactivated" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
