"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Cpu } from "lucide-react";
import { MODELS, TIER_COLORS } from "./modelCatalogData";

export function ModelsSection() {
  const [filter, setFilter] = useState<string>("Semua");
  const providers = ["Semua", "Atria", "DeepSeek", "Anthropic", "OpenAI", "Google", "Meta"];
  const filtered = filter === "Semua" ? MODELS : MODELS.filter((m) => m.provider === filter);

  return (
    <section id="model" style={{ padding: "80px 24px", maxWidth: "1100px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <span className="eyebrow" style={{ color: "var(--primary)" }}>KATALOG MODEL AI</span>
        <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", marginTop: "8px", fontWeight: 700 }}>
          Satu Gateway untuk Beragam Model Mutakhir
        </h2>
        <p className="muted" style={{ maxWidth: "620px", margin: "12px auto 0", fontSize: "15px" }}>
          Pilih model sesuai beban kerja. Cukup operasikan dari satu endpoint OpenAI-compatible.
        </p>
      </div>

      <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", marginBottom: "36px" }}>
        {providers.map((p) => (
          <button
            key={p}
            type="button"
            className={`button ${filter === p ? "primary" : "ghost"}`}
            style={{ height: "34px", padding: "0 14px", fontSize: "13px" }}
            onClick={() => setFilter(p)}
          >
            {p}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: "18px", marginBottom: "40px" }}>
        {filtered.map((m) => {
          const tc = TIER_COLORS[m.tier];
          return (
            <article
              key={m.id}
              className="panel"
              style={{
                padding: "22px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-card)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {m.provider}
                  </span>
                  <h3 style={{ fontSize: "17px", fontWeight: 600, marginTop: "2px" }}>{m.name}</h3>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: "4px",
                    background: tc.bg,
                    color: tc.text,
                    border: `1px solid ${tc.border}40`,
                    textTransform: "uppercase",
                  }}
                >
                  {m.tier} • {m.multiplier}
                </span>
              </div>

              <p className="muted" style={{ fontSize: "13px", lineHeight: 1.5, minHeight: "38px" }}>
                {m.desc}
              </p>

              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "auto" }}>
                <span style={{ fontSize: "11px", background: "var(--canvas)", padding: "3px 8px", borderRadius: "4px", border: "1px solid var(--border)", color: "var(--primary)", fontWeight: 500 }}>
                  {m.context} context
                </span>
                {m.strengths.map((s) => (
                  <span key={s} style={{ fontSize: "11px", background: "var(--canvas)", padding: "3px 8px", borderRadius: "4px", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                    {s}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <div style={{ textAlign: "center" }}>
        <Link
          href="/dashboard"
          className="button secondary"
          style={{
            fontSize: "13px",
            height: "42px",
            padding: "0 22px",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Cpu size={15} />
          Uji Coba Langsung di Playground
          <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
export default ModelsSection;
