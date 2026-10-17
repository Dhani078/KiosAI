import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, getRequiredTierForModel, isModelAllowedForTier } from "@/lib/keys";
import { UPSTREAM_URL, UPSTREAM_KEY } from "@/lib/proxy-http";
import { formatModelName } from "@/lib/model-utils";
import { isModelVerified, VERIFIED_MODEL_IDS } from "@/lib/verified-models";

export const runtime = "nodejs";

function isHiddenModel(id: string): boolean {
  const lower = (id || "").toLowerCase();
  if (lower.startsWith("oc/")) return false;
  return (
    lower === "combomaut" ||
    lower === "free123" ||
    lower === "tesss" ||
    lower === "auto" ||
    lower === "auto-thinking" ||
    lower.endsWith("/auto") ||
    lower.endsWith("/auto-thinking") ||
    lower.includes("free123") ||
    lower.includes("tesss") ||
    lower.startsWith("ag/gemini-3.7") ||
    lower.startsWith("ag/gemini-3.6") ||
    lower.startsWith("ag/gemini-3.1") ||
    lower === "ag/gemini-pro-agent" ||
    lower.includes("nemotron-3.5-lightning") ||
    lower.includes("sakana-namazu") ||
    lower.includes("solar-pro4") ||
    lower.includes("muse-glimmer-30b") ||
    lower.includes("muse-spark-1.2") ||
    lower.includes("deepseek-v4-flash-latest") ||
    lower === "cl/deepseek/deepseek-v4-flash-0731" ||
    lower === "apinex/free/deepseek-v4-flash-0731" ||
    lower.includes("inkling-small")
  );
}

function buildEntry(rawId: string, displayName: string, userTier: string, isAdmin: boolean) {
  return {
    id: rawId,
    name: formatModelName(displayName || rawId, isAdmin),
    object: "model",
    created: 1700000000,
    owned_by: "kiosai",
    required_tier: getRequiredTierForModel(rawId),
    accessible: isModelAllowedForTier(userTier, rawId),
  };
}

type CatalogEntry = ReturnType<typeof buildEntry>;

function sortCatalog(list: CatalogEntry[]) {
  return list.sort((a, b) => {
    const aAcc = a.accessible ? 1 : 0;
    const bAcc = b.accessible ? 1 : 0;
    if (aAcc !== bAcc) return bAcc - aAcc;
    const aGemini = a.id.toLowerCase().includes("gemini") ? 1 : 0;
    const bGemini = b.id.toLowerCase().includes("gemini") ? 1 : 0;
    if (aGemini !== bGemini) return bGemini - aGemini;
    const aFree = a.required_tier === "free" ? 1 : 0;
    const bFree = b.required_tier === "free" ? 1 : 0;
    return bFree - aFree;
  });
}

/** Katalog lengkap dari daftar ID kurasi (dipakai saat upstream mati). */
function catalogFromIds(userTier: string, isAdmin: boolean) {
  return sortCatalog(
    Array.from(VERIFIED_MODEL_IDS)
      .filter((id) => !isHiddenModel(id))
      .map((id) => buildEntry(id, id, userTier, isAdmin))
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

    const live = rawList
      .filter((m) => isModelVerified(m.id) && !isHiddenModel(m.id))
      .map((m) => buildEntry(m.id, m.name, userTier, isAdmin));

    // 9Router tidak selalu mendaftarkan rute yang sebenarnya jalan di /v1/models
    // (mis. oc/...-free(max)), jadi model kurasi yang belum ada di daftar upstream tetap ditambahkan.
    const liveIds = new Set(live.map((m) => m.id));
    const curatedOnly = catalogFromIds(userTier, isAdmin).filter((m) => !liveIds.has(m.id));

    return NextResponse.json({
      object: "list",
      data: sortCatalog([...live, ...curatedOnly]),
      user_tier: userTier,
    });
  } catch {
    return NextResponse.json({
      object: "list",
      data: catalogFromIds(userTier, isAdmin),
      user_tier: userTier,
    });
  }
}
