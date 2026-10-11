import { NextResponse } from "next/server";

export const UPSTREAM_URL = process.env.NINEROUTER_URL || "http://127.0.0.1:20128";
// ponytail: single upstream key; fallback NINEROUTER_API_KEY_2 -> NINEROUTER_API_KEY. Add rotation when >2 keys.
export const UPSTREAM_KEY = process.env.NINEROUTER_API_KEY_2 || process.env.NINEROUTER_API_KEY || "";

export function errorResponse(message: string, status: number, code: string = "kiosai_error", headers?: Record<string, string>) {
  return NextResponse.json(
    {
      error: {
        message,
        type: status === 401 ? "authentication_error" : status === 429 ? "rate_limit_error" : "invalid_request_error",
        code,
      },
    },
    { status, headers }
  );
}

export function parseUpstreamJson(rawText: string): any {
  let cleaned = rawText.replace(/data:\s*\[DONE\].*$/s, "").trim();
  if (cleaned.startsWith("data: ")) {
    cleaned = cleaned.slice(6).trim();
  }
  return JSON.parse(cleaned);
}

