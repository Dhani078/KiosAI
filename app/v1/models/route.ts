import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, getRequiredTierForModel } from "@/lib/keys";

export const runtime = "nodejs";

const UPSTREAM_URL = process.env.NINEROUTER_URL || "http://127.0.0.1:20128";
const UPSTREAM_KEY = process.env.NINEROUTER_API_KEY || "";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const rawKey = authHeader.replace(/^Bearer\s+/i, "").trim();

  let userTier = "bronze";
  if (rawKey) {
    const auth = await validateApiKey(rawKey);
    if (!auth.valid) {
      return NextResponse.json({ error: { message: auth.error, type: "auth_error" } }, { status: 401 });
    }
    if (auth.user) {
      userTier = auth.user.tier;
    }
  }

  try {
    const res = await fetch(`${UPSTREAM_URL}/v1/models`, {
      headers: {
        ...(UPSTREAM_KEY ? { Authorization: `Bearer ${UPSTREAM_KEY}` } : {}),
      },
    });

    if (!res.ok) {
      throw new Error(`Upstream returned ${res.status}`);
    }

    const data = await res.json();
    const rawList: any[] = Array.isArray(data.data) ? data.data : [];

    const enhanced = rawList.map((m) => {
      const tier = getRequiredTierForModel(m.id);
      return {
        id: m.id,
        object: "model",
        created: m.created || 1700000000,
        owned_by: "kiosai",
        required_tier: tier,
        accessible: userTier === "gold" || (userTier === "silver" && tier !== "gold") || tier === "bronze",
      };
    });

    return NextResponse.json({
      object: "list",
      data: enhanced,
      user_tier: userTier,
    });
  } catch (err: any) {
    // Fallback model list if 9router unreachable
    const fallbacks = [
      { id: "tokenharbor/deepseek-v4.1-flash:free", tier: "bronze" },
      { id: "kr/claude-haiku-4.5", tier: "bronze" },
      { id: "kr/deepseek-3.2-thinking", tier: "bronze" },
      { id: "kr/claude-sonnet-4.5", tier: "silver" },
      { id: "openai/gpt-5", tier: "silver" },
      { id: "combomaut", tier: "gold" },
    ];

    return NextResponse.json({
      object: "list",
      data: fallbacks.map((f) => ({
        id: f.id,
        object: "model",
        created: 1700000000,
        owned_by: "kiosai",
        required_tier: f.tier,
        accessible: userTier === "gold" || (userTier === "silver" && f.tier !== "gold") || f.tier === "bronze",
      })),
      user_tier: userTier,
    });
  }
}
