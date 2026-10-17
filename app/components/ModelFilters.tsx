"use client";

import { Search, X } from "lucide-react";

export function ModelFilters({
  search,
  onSearchChange,
  tierFilter,
  onTierChange,
  providerFilter,
  onProviderChange,
  totalCount,
  freeCount,
  proCount,
}: {
  search: string;
  onSearchChange: (s: string) => void;
  tierFilter: string;
  onTierChange: (t: string) => void;
  providerFilter: string;
  onProviderChange: (p: string) => void;
  totalCount: number;
  freeCount: number;
  proCount: number;
}) {
  const providers = ["all", "Google", "DeepSeek", "Anthropic", "OpenAI", "OpenCode", "Meta"];

  return (
    <section className="panel" style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ position: "relative", minWidth: "260px", flex: 1 }}>
          <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari model AI (Atria, DeepSeek, Claude, GPT, Gemini...)"
            style={{ width: "100%", padding: "8px 34px", borderRadius: "var(--radius-input)", background: "var(--canvas)", border: "1px solid var(--border)", color: "var(--text)", fontSize: "13px" }}
          />
          {search && (
            <button type="button" onClick={() => onSearchChange("")} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", padding: "2px", background: "none", border: "none", cursor: "pointer" }}>
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { id: "all", label: `Semua (${totalCount})` },
            { id: "free", label: `Free (${freeCount})` },
            { id: "pro", label: `Pro (${proCount})` },
          ].map((t) => (
            <button key={t.id} type="button" className={`button ${tierFilter === t.id ? "primary" : "ghost"}`} style={{ height: "32px", padding: "0 12px", fontSize: "12px" }} onClick={() => onTierChange(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
        {providers.map((p) => {
          const isAct = providerFilter === p;
          const label = p === "all" ? "Semua Provider" : p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onProviderChange(p)}
              style={{
                padding: "3px 10px",
                borderRadius: "999px",
                fontSize: "11px",
                cursor: "pointer",
                background: isAct ? "var(--primary)" : "var(--surface)",
                color: isAct ? "#fff" : "var(--text-muted)",
                border: isAct ? "1px solid var(--primary)" : "1px solid var(--border)",
                whiteSpace: "nowrap",
                fontWeight: isAct ? 600 : 400,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default ModelFilters;
