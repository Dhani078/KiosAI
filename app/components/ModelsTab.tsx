"use client";

import { useState } from "react";
import { Search, Sparkles, CheckCircle2, Lock } from "lucide-react";
import { Badge, Button } from "./ui";
import { formatModelName } from "@/lib/model-utils";
import { getModelPricing } from "@/lib/model-pricing";

export function ModelsTab({
  models,
  userTier,
  isAdmin = false,
  onNavigatePlayground,
  onNavigatePackages,
}: {
  models: any[];
  userTier: string;
  isAdmin?: boolean;
  onNavigatePlayground: (modelId?: string) => void;
  onNavigatePackages: () => void;
}) {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");

  const isFreeTier = (userTier || "free").toLowerCase() === "free";
  const checkAllowed = (id: string) => {
    if (!isFreeTier) return true;
    const l = id.toLowerCase();
    return l.includes("atria") || l.includes("tokenharbor/deepseek-v4.1-flash") || l === "deepseek-v4.1-flash";
  };

  const filtered = models
    .filter((m) => m.id !== "combomaut")
    .filter((m) => {
      const clean = formatModelName(m.name || m.id, isAdmin).toLowerCase();
      const raw = (m.id || "").toLowerCase();
      const matchesSearch = !search || clean.includes(search.toLowerCase()) || raw.includes(search.toLowerCase());
      const modelTier = checkAllowed(m.id) ? "free" : "pro";
      const matchesTier = tierFilter === "all" || modelTier === tierFilter;
      return matchesSearch && matchesTier;
    })
    .sort((a, b) => {
      const aAllowed = checkAllowed(a.id) ? 1 : 0;
      const bAllowed = checkAllowed(b.id) ? 1 : 0;
      if (aAllowed !== bAllowed) return bAllowed - aAllowed;
      const aP = a.id.toLowerCase().includes("atria") ? 2 : a.id.toLowerCase().includes("tokenharbor/deepseek-v4.1-flash") ? 1 : 0;
      const bP = b.id.toLowerCase().includes("atria") ? 2 : b.id.toLowerCase().includes("tokenharbor/deepseek-v4.1-flash") ? 1 : 0;
      return bP - aP;
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <section className="panel" style={{ padding: "18px 24px" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ position: "relative", minWidth: "260px", flex: 1 }}>
            <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari model AI (Atria, DeepSeek, Claude, GPT, Gemini...)"
              style={{
                width: "100%",
                padding: "8px 12px 8px 34px",
                borderRadius: "var(--radius-input)",
                background: "var(--canvas)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                fontSize: "13px",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            {[
              { id: "all", label: "Semua Model" },
              { id: "free", label: "Free Tier" },
              { id: "pro", label: "Pro Tier" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                className={`button ${tierFilter === t.id ? "primary" : "ghost"}`}
                style={{ height: "32px", padding: "0 12px", fontSize: "12px" }}
                onClick={() => setTierFilter(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
        {filtered.map((m) => {
          const isAllowed = checkAllowed(m.id);
          const modelTier = isAllowed ? "free" : "pro";
          const displayName = formatModelName(m.name || m.id, isAdmin);
          const displayId = isAdmin ? m.id : displayName;
          const pricing = getModelPricing(m.id);

          return (
            <article
              key={m.id}
              className="panel"
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-card)",
                background: "var(--surface)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                <div>
                  <h3 style={{ fontSize: "15px", fontWeight: 600, margin: 0 }}>{displayName}</h3>
                  <code style={{ fontSize: "11px", color: "var(--text-muted)" }}>{displayId}</code>
                </div>
                <Badge tier={modelTier.toUpperCase()} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", padding: "8px 10px", background: "var(--canvas)", borderRadius: "var(--radius-input)", border: "1px solid var(--border)", fontSize: "11px", textAlign: "center" }}>
                <div><span style={{ color: "var(--text-muted)", fontSize: "9px", display: "block" }}>INPUT / 1M</span><strong>${pricing.input}</strong></div>
                <div><span style={{ color: "var(--text-muted)", fontSize: "9px", display: "block" }}>OUTPUT / 1M</span><strong>${pricing.output}</strong></div>
                <div><span style={{ color: "var(--text-muted)", fontSize: "9px", display: "block" }}>CACHED / 1M</span><strong>${pricing.cached}</strong></div>
              </div>

              <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "12px", color: isAllowed ? "var(--success)" : "var(--warning)" }}>
                {isAllowed ? (
                  <>
                    <CheckCircle2 size={13} />
                    <span>Terbuka (In: ${pricing.input} · Out: ${pricing.output})</span>
                  </>
                ) : (
                  <>
                    <Lock size={13} />
                    <span>Terkunci untuk Free Plan (Upgrade ke Pro)</span>
                  </>
                )}
              </div>

              <div style={{ marginTop: "auto", paddingTop: "8px" }}>
                {isAllowed ? (
                  <Button kind="primary" style={{ width: "100%", height: "34px", fontSize: "12px" }} onClick={() => onNavigatePlayground(m.id)}>
                    <Sparkles size={14} /> Coba di Playground
                  </Button>
                ) : (
                  <Button kind="secondary" style={{ width: "100%", height: "34px", fontSize: "12px" }} onClick={onNavigatePackages}>
                    Beli Paket Pro
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default ModelsTab;
