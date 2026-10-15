"use client";

import { PieChart, Cpu } from "lucide-react";
import { formatModelName } from "@/lib/model-utils";

const PALETTE = [
  "#F28C38", // KiosAI primary orange
  "#4FBF7A", // Green
  "#4DA8DA", // Blue
  "#E5533D", // Red
  "#9D4EDD", // Purple
  "#F5C542", // Yellow
  "#FF9F1C", // Amber
  "#2EC4B6", // Teal
];

export function ModelUsageBreakdown({
  perModel,
  totalTokens,
}: {
  perModel: any[];
  totalTokens: number;
}) {
  const models = perModel || [];
  const safeTotal = totalTokens > 0 ? totalTokens : 1;

  return (
    <section className="panel usage-panel" style={{ padding: "20px 24px" }}>
      <div className="section-heading" style={{ marginBottom: "16px" }}>
        <div>
          <h2>Distribusi Penggunaan per Model</h2>
          <span>Analisis konsumsi token & latensi dari database TiDB</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "12px" }}>
          <PieChart size={15} /> {models.length} Model Terpakai
        </div>
      </div>

      {models.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-muted)", fontSize: "13px" }}>
          <Cpu size={28} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
          Belum ada log penggunaan token. Gunakan Playground atau API untuk melihat statistik performa.
        </div>
      ) : (
        <>
          {/* Multi-segment visual bar */}
          <div
            style={{
              height: "10px",
              width: "100%",
              borderRadius: "999px",
              overflow: "hidden",
              display: "flex",
              background: "var(--border)",
              marginBottom: "20px",
            }}
          >
            {models.map((m, i) => {
              const pct = (Number(m.tokens) / safeTotal) * 100;
              const color = PALETTE[i % PALETTE.length];
              return (
                <div
                  key={m.model}
                  style={{
                    width: `${Math.max(1, pct)}%`,
                    background: color,
                    transition: "width 0.3s ease",
                  }}
                  title={`${formatModelName(m.model)}: ${pct.toFixed(1)}%`}
                />
              );
            })}
          </div>

          {/* Model rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {models.map((item, idx) => {
              const pct = (Number(item.tokens) / safeTotal) * 100;
              const color = PALETTE[idx % PALETTE.length];
              const cleanName = formatModelName(item.model);

              return (
                <div
                  key={item.model}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    padding: "10px 14px",
                    background: "var(--canvas)",
                    borderRadius: "var(--radius-input)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
                      <strong style={{ fontSize: "13px", fontWeight: 600 }}>{cleanName}</strong>
                      <code style={{ fontSize: "11px", color: "var(--text-muted)" }}>{item.model}</code>
                    </div>
                    <div style={{ display: "flex", gap: "14px", fontSize: "11px", alignItems: "center" }}>
                      <span><strong style={{ fontFamily: "JetBrains Mono" }}>{item.requests}</strong> req</span>
                      <span>Avg: <strong style={{ fontFamily: "JetBrains Mono" }}>{item.avg_latency || 0}</strong>ms</span>
                      <strong style={{ color: "var(--primary)", fontFamily: "JetBrains Mono", fontSize: "12px" }}>
                        {Number(item.tokens).toLocaleString("id-ID")} token ({pct.toFixed(1)}%)
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

export default ModelUsageBreakdown;
