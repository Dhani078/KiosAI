"use client";

import { useState } from "react";
import { Search, Sparkles, CheckCircle2, Lock, X } from "lucide-react";
import { Badge, Button } from "./ui";
import { formatModelName } from "@/lib/model-utils";
import { getModelPricing } from "@/lib/model-pricing";

function getProvider(id: string): string {
  const s = (id || "").toLowerCase();
  if (s.includes("atria")) return "Atria";
  if (s.includes("claude") || s.includes("anthropic")) return "Anthropic";
  if (s.includes("deepseek")) return "DeepSeek";
  if (s.includes("gpt") || s.includes("openai") || s.includes("o1") || s.includes("o3")) return "OpenAI";
  if (s.includes("gemini") || s.includes("google")) return "Google";
  if (s.includes("llama") || s.includes("meta")) return "Meta";
  if (s.includes("grok") || s.includes("xai")) return "xAI";
  if (s.includes("mistral") || s.includes("codestral")) return "Mistral";
  return s.includes("qwen") ? "Qwen" : "AI";
}

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
  const getModelTier = (m: any): "free" | "pro" => m.required_tier || ((m.id || "").toLowerCase().includes("atria") ? "free" : "pro");
  const checkAllowed = (m: any) => (!isFreeTier ? true : getModelTier(m) === "free");

  const validModels = models.filter((m) => m.id !== "combomaut");
  const freeTotal = validModels.filter((m) => getModelTier(m) === "free").length;
  const proTotal = validModels.length - freeTotal;

  const filtered = validModels
    .filter((m) => {
      const clean = formatModelName(m.name || m.id, isAdmin).toLowerCase();
      const raw = (m.id || "").toLowerCase();
      const match = !search || clean.includes(search.toLowerCase()) || raw.includes(search.toLowerCase());
      return match && (tierFilter === "all" || getModelTier(m) === tierFilter);
    })
    .sort((a, b) => {
      const aAllowed = checkAllowed(a) ? 1 : 0, bAllowed = checkAllowed(b) ? 1 : 0;
      if (aAllowed !== bAllowed) return bAllowed - aAllowed;
      return (getModelTier(b) === "free" ? 1 : 0) - (getModelTier(a) === "free" ? 1 : 0);
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <section className="panel" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ position: "relative", minWidth: "260px", flex: 1 }}>
            <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari model AI (Atria, DeepSeek, Claude, GPT, Gemini...)"
              style={{ width: "100%", padding: "8px 34px", borderRadius: "var(--radius-input)", background: "var(--canvas)", border: "1px solid var(--border)", color: "var(--text)", fontSize: "13px" }}
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", padding: "2px" }}>
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            {[
              { id: "all", label: `Semua (${validModels.length})` },
              { id: "free", label: `Free Tier (${freeTotal})` },
              { id: "pro", label: `Pro Tier (${proTotal})` },
            ].map((t) => (
              <button key={t.id} type="button" className={`button ${tierFilter === t.id ? "primary" : "ghost"}`} style={{ height: "32px", padding: "0 12px", fontSize: "12px" }} onClick={() => setTierFilter(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
        {filtered.length === 0 ? (
          <div className="panel" style={{ gridColumn: "1 / -1", padding: "48px 24px", textAlign: "center", color: "var(--text-muted)" }}>
            <p style={{ fontSize: "14px", marginBottom: "12px" }}>Tidak ada model yang cocok dengan &quot;{search}&quot;</p>
            <Button kind="secondary" onClick={() => { setSearch(""); setTierFilter("all"); }}>Reset Pencarian</Button>
          </div>
        ) : (
          filtered.map((m) => {
            const isAllowed = checkAllowed(m);
            const modelTier = getModelTier(m);
            const displayName = formatModelName(m.name || m.id, isAdmin);
            const displayId = isAdmin ? m.id : displayName;
            const pricing = getModelPricing(m.id);
            const provider = getProvider(m.id);

            return (
              <article key={m.id} className="panel" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "12px", border: "1px solid var(--border)", borderRadius: "var(--radius-card)", background: "var(--surface)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: "10px", color: "var(--primary)", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>{provider}</div>
                    <h3 style={{ fontSize: "15px", fontWeight: 600, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={displayName}>{displayName}</h3>
                    <code style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayId}</code>
                  </div>
                  <Badge tier={modelTier.toUpperCase()} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", padding: "8px 10px", background: "var(--canvas)", borderRadius: "var(--radius-input)", border: "1px solid var(--border)", fontSize: "11px", textAlign: "center" }}>
                  <div><span style={{ color: "var(--text-muted)", fontSize: "9px", display: "block" }}>INPUT / 1M</span><strong style={{ fontFamily: "'JetBrains Mono', monospace" }}>${pricing.input}</strong></div>
                  <div><span style={{ color: "var(--text-muted)", fontSize: "9px", display: "block" }}>OUTPUT / 1M</span><strong style={{ fontFamily: "'JetBrains Mono', monospace" }}>${pricing.output}</strong></div>
                  <div><span style={{ color: "var(--text-muted)", fontSize: "9px", display: "block" }}>CACHED / 1M</span><strong style={{ fontFamily: "'JetBrains Mono', monospace" }}>${pricing.cached}</strong></div>
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

                <div style={{ marginTop: "auto", paddingTop: "4px" }}>
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
          })
        )}
      </div>
    </div>
  );
}

export default ModelsTab;
