import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/keys";

export const runtime = "nodejs";

const UPSTREAM_URL = process.env.NINEROUTER_URL || "http://127.0.0.1:20128";
const UPSTREAM_KEY = process.env.NINEROUTER_API_KEY || "";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const rawKey = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (rawKey) {
    const auth = await validateApiKey(rawKey);
    if (!auth.valid) {
      return NextResponse.json({ error: { message: auth.error, type: "auth_error" } }, { status: 401 });
    }
  }

  try {
    const res = await fetch(`${UPSTREAM_URL}/v1/models`, {
      headers: {
        ...(UPSTREAM_KEY ? { Authorization: `Bearer ${UPSTREAM_KEY}` } : {}),
      },
    });

    if (!res.ok) {
      return NextResponse.json({
        object: "list",
        data: [
          { id: "ag/gemini-3.8-flash-high", object: "model", owned_by: "kiosai" },
          { id: "openai/gpt-5", object: "model", owned_by: "kiosai" },
          { id: "claude-3-5-sonnet", object: "model", owned_by: "kiosai" },
        ],
      });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({
      object: "list",
      data: [{ id: "ag/gemini-3.8-flash-high", object: "model", owned_by: "kiosai" }],
    });
  }
}
