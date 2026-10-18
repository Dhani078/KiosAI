"use client";

import { Code2, CreditCard, Layers, ShieldCheck, Gauge, Zap } from "lucide-react";

interface BentoFeature {
  icon: typeof Code2;
  title: string;
  desc: string;
  badge?: string;
  footer: string;
  highlight?: boolean;
}

const FEATURES: BentoFeature[] = [
  {
    icon: Code2,
    title: "100% Drop-in OpenAI SDK",
    desc: "Gunakan library resmi OpenAI di Python, Node.js, Go, atau PHP. Cukup ubah baseURL ke TokoAI.",
    badge: "0 Migrasi",
    footer: "baseURL = \"https://tokoai.my.id/v1\"",
    highlight: true,
  },
  {
    icon: CreditCard,
    title: "Bayar Pakai QRIS Rupiah",
    desc: "Top up saldo mulai Rp 25.000 dengan GoPay, OVO, Dana, ShopeePay, atau BCA Mobile tanpa kartu kredit.",
    badge: "Otomatis 24/7",
    footer: "QRIS · GoPay · DANA · OVO · BCA",
  },
  {
    icon: Layers,
    title: "70+ Model AI Terverifikasi",
    desc: "Satu saldo untuk Claude 3.7 Sonnet, DeepSeek R1, GPT-4o, hingga Gemini 2.0 Flash.",
    badge: "Multi-Model",
    footer: "5 Free · 65+ Pro Model",
  },
  {
    icon: Gauge,
    title: "Tarif Transparan",
    desc: "Tarif Input dan Output per 1M token transparan. Tanpa pengali tersembunyi, saldo terpotong nyata.",
    badge: "Transparan",
    footer: "Rasio potong real-time sesuai tarif provider",
  },
  {
    icon: Zap,
    title: "Edge Serverless Tokyo",
    desc: "Node edge terdekat dengan regional AI untuk latensi streaming SSE instan dan stabil.",
    badge: "Tokyo Region",
    footer: "Avg TTFT 142ms · 99.98% Uptime",
  },
  {
    icon: ShieldCheck,
    title: "Keamanan Standar Industri",
    desc: "Key SHA-256 satu arah, password scrypt, cookie HttpOnly HMAC-SHA256, dan sliding window limiter.",
    badge: "OWASP Hardened",
    footer: "Zero plain-text key storage",
  },
];

export function FeaturesSection() {
  return (
    <section id="fitur" style={{ padding: "80px 24px", maxWidth: "1100px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h2 style={{ fontSize: "clamp(26px, 3.5vw, 38px)", letterSpacing: "-0.8px", fontWeight: 700 }}>
          Didesain Khusus untuk Pengembang & Tim Digital
        </h2>
        <p className="muted" style={{ maxWidth: "580px", margin: "12px auto 0", fontSize: "15px" }}>
          Infrastruktur gateway AI modern tanpa friksi. Ganti satu baris konfigurasi, nikmati ratusan model AI.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "18px",
        }}
      >
        {FEATURES.map((f) => (
          <article
            key={f.title}
            className="panel"
            style={{
              padding: "26px",
              background: "var(--surface)",
              borderRadius: "var(--radius-card)",
              border: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  background: "var(--canvas)",
                  border: "1px solid var(--border)",
                  display: "grid",
                  placeItems: "center",
                  color: f.highlight ? "var(--primary)" : "var(--text)",
                }}
              >
                <f.icon size={20} />
              </div>
              {f.badge && (
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: f.highlight ? "var(--primary)" : "var(--text-muted)",
                    background: f.highlight ? "rgba(242, 140, 56, 0.12)" : "var(--canvas)",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    border: "1px solid var(--border)",
                  }}
                >
                  {f.badge}
                </span>
              )}
            </div>

            <div>
              <h3 style={{ fontSize: "17px", fontWeight: 600, marginBottom: "6px" }}>{f.title}</h3>
              <p className="muted" style={{ fontSize: "13px", lineHeight: 1.6 }}>{f.desc}</p>
            </div>

            <div
              style={{
                marginTop: "auto",
                background: "var(--canvas)",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                fontFamily: f.highlight ? "'JetBrains Mono', monospace" : "inherit",
                fontSize: "11px",
                color: f.highlight ? "var(--primary)" : "var(--text-muted)",
              }}
            >
              {f.footer}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default FeaturesSection;
