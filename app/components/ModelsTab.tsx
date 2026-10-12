"use client";

import { useState } from "react";
import { Search, Sparkles, CheckCircle2 } from "lucide-react";
import { Badge, Button } from "./ui";
import { formatModelName } from "@/lib/model-utils";

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

  const filtered = models
    .filter((m) => m.id !== "combomaut")
    .filter((m) => {
      const clean = formatModelName(m.name || m.id, isAdmin).toLowerCase();
      const raw = (m.id || "").toLowerCase();
      const matchesSearch = !search || clean.includes(search.toLowerCase()) || raw.includes(search.toLowerCase());
      const matchesTier = tierFilter === "all" || (m.required_tier || "bronze").toLowerCase() === tierFilter;
      return matchesSearch && matchesTier;
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
              placeholder="Cari model AI (DeepSeek, Claude, GPT, Gemini...)"
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
            {(["all", "bronze", "silver", "gold"] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={`button ${tierFilter === t ? "primary" : "ghost"}`}
                style={{ height: "32px", padding: "0 12px", fontSize: "12px", textTransform: "uppercase" }}
                onClick={() => setTierFilter(t)}
              >
                {t === "all" ? "Semua Model" : t}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
        {filtered.map((m) => {
          const reqTier = (m.required_tier || "bronze").toLowerCase();
          const mult = reqTier === "gold" ? "4.0×" : reqTier === "silver" ? "2.0×" : "1.0×";
          const displayName = formatModelName(m.name || m.id, isAdmin);
          const displayId = isAdmin ? m.id : displayName;

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
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{mult}</span>
                  <Badge tier={reqTier.toUpperCase()} />
                </div>
              </div>

              <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "12px", color: "var(--success)" }}>
                <CheckCircle2 size={13} />
                <span>Terbuka (potong saldo token {mult})</span>
              </div>

              <div style={{ marginTop: "auto", paddingTop: "8px" }}>
                <Button kind="primary" style={{ width: "100%", height: "34px", fontSize: "12px" }} onClick={() => onNavigatePlayground(m.id)}>
                  <Sparkles size={14} /> Coba di Playground
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default ModelsTab;
