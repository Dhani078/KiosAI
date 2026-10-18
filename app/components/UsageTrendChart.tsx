"use client";

import { useState } from "react";
import { BarChart3, TrendingUp, Calendar } from "lucide-react";

interface DailyData {
  day: string;
  requests: number | string;
  tokens: number | string;
}

export function UsageTrendChart({
  dailyTrend = [],
  isAdmin = false,
}: {
  dailyTrend: DailyData[];
  isAdmin?: boolean;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const data = (dailyTrend || []).map((d) => ({
    day: d.day,
    requests: Number(d.requests || 0),
    tokens: Number(d.tokens || 0),
  }));

  const maxTokens = Math.max(...data.map((d) => d.tokens), 1);
  const totalTokens = data.reduce((sum, d) => sum + d.tokens, 0);
  const totalReqs = data.reduce((sum, d) => sum + d.requests, 0);
  const avgTokensPerDay = data.length > 0 ? Math.round(totalTokens / data.length) : 0;

  const formatDateLabel = (isoDate: string) => {
    try {
      const [, m, d] = isoDate.split("-");
      return `${d}/${m}`;
    } catch {
      return isoDate;
    }
  };

  return (
    <section className="panel" style={{ padding: "20px 24px" }}>
      <div className="section-heading" style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2>Tren Aktivitas 7 Hari Terakhir</h2>
          <span>Volume konsumsi token harian & frekuensi request dari {isAdmin ? "TiDB Cloud" : "database"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "11px", color: "var(--text-muted)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
            <TrendingUp size={14} style={{ color: "var(--primary)" }} /> Rata-rata: <strong style={{ color: "var(--text)", fontFamily: "JetBrains Mono" }}>{avgTokensPerDay.toLocaleString("id-ID")}</strong> tkn/hari
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
            <Calendar size={14} /> Total 7h: <strong style={{ color: "var(--text)", fontFamily: "JetBrains Mono" }}>{totalTokens.toLocaleString("id-ID")}</strong>
          </span>
        </div>
      </div>

      {data.length === 0 ? (
        <div style={{ textAlign: "center", padding: "36px 16px", color: "var(--text-muted)", fontSize: "13px" }}>
          <BarChart3 size={28} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
          Belum ada aktivitas inferensi dalam 7 hari terakhir. Request via Playground atau API Keys akan tercatat otomatis.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Bar Chart Container */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "130px", padding: "12px 6px 0", background: "var(--canvas)", borderRadius: "var(--radius-input)", border: "1px solid var(--border)" }}>
            {data.map((item, idx) => {
              const heightPct = Math.max(6, Math.round((item.tokens / maxTokens) * 100));
              const isHovered = hoveredIdx === idx;

              return (
                <div
                  key={item.day}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    height: "100%",
                    justifyContent: "flex-end",
                    position: "relative",
                    cursor: "pointer",
                  }}
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: `${heightPct + 12}%`,
                        zIndex: 20,
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        boxShadow: "0 6px 16px rgba(0,0,0,0.5)",
                        fontSize: "11px",
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "var(--text)" }}>{item.day}</span>
                      <span style={{ color: "var(--primary)", fontFamily: "JetBrains Mono" }}>{item.tokens.toLocaleString("id-ID")} token</span>
                      <span style={{ color: "var(--text-muted)" }}>{item.requests} requests</span>
                    </div>
                  )}

                  {/* Visual Bar */}
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "42px",
                      height: `${heightPct}%`,
                      background: isHovered
                        ? "var(--primary-hover, #D9742A)"
                        : "var(--primary, #F28C38)",
                      borderRadius: "4px 4px 1px 1px",
                      transition: "all 0.2s ease",
                      opacity: hoveredIdx !== null && !isHovered ? 0.45 : 1,
                    }}
                  />
                  <span style={{ fontSize: "10px", color: isHovered ? "var(--primary)" : "var(--text-muted)", marginTop: "6px", fontFamily: "JetBrains Mono" }}>
                    {formatDateLabel(item.day)}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--text-muted)", padding: "0 4px" }}>
            <span>7 hari terakhir</span>
            <span>Total {totalReqs.toLocaleString("id-ID")} request AI</span>
          </div>
        </div>
      )}
    </section>
  );
}

export default UsageTrendChart;
