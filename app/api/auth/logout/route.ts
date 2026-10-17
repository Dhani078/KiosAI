import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  return clearSession(NextResponse.json({ success: true, message: "Logout berhasil." }));
}
