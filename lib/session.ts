import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

/**
 * Sesi server-side: cookie HttpOnly bertanda tangan HMAC-SHA256.
 * userId diambil dari cookie ini, BUKAN dari query/body yang bisa dipalsukan klien.
 * Wajib: SESSION_SECRET di .env (dan sebagai secret Worker).
 */
export const SESSION_COOKIE = "kiosai_session";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET belum diset (min 16 karakter)");
  return s;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

export function createSessionToken(userId: string, ttlMs: number = TTL_MS): string {
  const exp = Date.now() + ttlMs;
  const payload = `${userId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expRaw, sig] = parts;
  const exp = Number(expRaw);
  if (!userId || !Number.isFinite(exp) || Date.now() > exp) return null;
  const expected = sign(`${userId}.${expRaw}`);
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return userId;
}

export function readSessionUserId(req: NextRequest): string | null {
  try {
    return verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  } catch {
    return null;
  }
}

export function attachSession(res: NextResponse, userId: string): NextResponse {
  res.cookies.set({
    name: SESSION_COOKIE,
    value: createSessionToken(userId),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(TTL_MS / 1000),
  });
  return res;
}

export function clearSession(res: NextResponse): NextResponse {
  res.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}

export function unauthorized(message = "Sesi tidak valid. Silakan login ulang."): NextResponse {
  return NextResponse.json({ error: { message, type: "authentication_error" } }, { status: 401 });
}
