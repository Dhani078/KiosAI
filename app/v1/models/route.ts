import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, getRequiredTierForModel, isModelAllowedForTier } from "@/lib/keys";
import { UPSTREAM_URL, UPSTREAM_KEY } from "@/lib/proxy-http";
import { formatModelName } from "@/lib/model-utils";

export const runtime = "nodejs";

function isHiddenModel(id: string): boolean {
  const lower = (id || "").toLowerCase();
  return (
    lower === "combomaut" ||
    lower === "free123" ||
    lower === "tesss" ||
    lower === "auto" ||
    lower === "auto-thinking" ||
    lower.endsWith("/auto") ||
    lower.endsWith("/auto-thinking") ||
    lower.includes("free123") ||
    lower.includes("tesss")
  );
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const rawKey = authHeader.replace(/^Bearer\s+/i, "").trim();

  let userTier = "free";
  let isAdmin = false;

  if (rawKey) {
    const auth = await validateApiKey(rawKey);
    if (!auth.valid) {
      return NextResponse.json({ error: { message: auth.error, type: "auth_error" } }, { status: 401 });
    }
    if (auth.user) {
      userTier = auth.user.tier;
      isAdmin = Boolean(auth.user.username === "adminfordhani" || auth.user.email === "adminfordhani@kiosai.id");
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

    const enhanced = rawList
      .filter((m) => !isHiddenModel(m.id))
      .map((m) => {
        const tier = getRequiredTierForModel(m.id);
        const accessible = isModelAllowedForTier(userTier, m.id);
        return {
          id: m.id,
          name: formatModelName(m.name || m.id, isAdmin),
          object: "model",
          created: m.created || 1700000000,
          owned_by: "kiosai",
          required_tier: tier,
          accessible,
        };
      });

    return NextResponse.json({
      object: "list",
      data: enhanced,
      user_tier: userTier,
    });
  } catch {
    // Fallback model list if 9router unreachable
    const fallbacks = [
      { id: "atria/Atria-Dawn-Preview", tier: "bronze" },
      { id: "tokenharbor/deepseek-v4.1-flash:free", tier: "bronze" },
      { id: "kr/claude-haiku-4.5-thinking-agentic", tier: "bronze" },
      { id: "kr/deepseek-3.2-thinking", tier: "bronze" },
      { id: "kr/claude-sonnet-4.5-thinking-agentic", tier: "silver" },
      { id: "openai/gpt-5", tier: "silver" },
    ];

    return NextResponse.json({
      object: "list",
      data: fallbacks.map((f) => ({
        id: f.id,
        name: formatModelName(f.id, isAdmin),
        object: "model",
        created: 1700000000,
        owned_by: "kiosai",
        required_tier: f.tier,
        accessible: isModelAllowedForTier(userTier, f.id),
      })),
      user_tier: userTier,
    });
  }
}
