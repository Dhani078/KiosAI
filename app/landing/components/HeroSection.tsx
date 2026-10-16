"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap, Terminal, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section
      style={{
        padding: "80px 24px 60px",
        maxWidth: "1000px",
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 14px",
          borderRadius: "999px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          fontSize: "12px",
          color: "var(--primary)",
          marginBottom: "24px",
        }}
      >
        <Sparkles size={14} />
        <span>250K Token Instan + 2.25M Brankas Bonus · Mulai Rp 0</span>
      </div>

      <h1
        style={{
          fontSize: "clamp(32px, 5vw, 54px)",
          letterSpacing: "-1.5px",
          lineHeight: 1.15,
          fontWeight: 700,
          marginBottom: "20px",
        }}
      >
        Satu Kunci untuk Semua Model AI.{" "}
        <span style={{ color: "var(--primary)" }}>Bayar Instan via QRIS.</span>
      </h1>

      <p
        style={{
          fontSize: "clamp(15px, 2vw, 18px)",
          color: "var(--text-muted)",
          maxWidth: "680px",
          margin: "0 auto 36px",
          lineHeight: 1.6,
        }}
      >
        Akses ratusan model AI mutakhir (Claude 3.7, DeepSeek R1, GPT-4o, Gemini 2.0) tanpa kartu kredit luar negeri. Cukup ganti base URL di Cursor, Cline, atau kode aplikasi Anda.
      </p>

      <div
        style={{
          display: "flex",
          gap: "14px",
          justifyContent: "center",
          flexWrap: "wrap",
          marginBottom: "48px",
        }}
      >
        <Link
          href="/dashboard"
          className="button primary"
          style={{
            fontSize: "15px",
            height: "48px",
            padding: "0 28px",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: 600,
          }}
        >
          Mulai Gratis (250K + 2.25M Bonus)
          <ArrowRight size={17} />
        </Link>
        <a
          href="#integrasi"
          className="button secondary"
          style={{
            fontSize: "15px",
            height: "48px",
            padding: "0 24px",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Terminal size={16} />
          Contoh Kode Integrasi
        </a>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          borderTop: "1px solid var(--border)",
          paddingTop: "32px",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "10px", borderRadius: "8px", color: "var(--primary)" }}>
            <Zap size={20} />
          </div>
          <div>
            <strong style={{ display: "block", fontSize: "14px" }}>65+ Model Terverifikasi</strong>
            <small className="muted" style={{ fontSize: "12px" }}>DeepSeek, Claude, GPT, Gemini</small>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "10px", borderRadius: "8px", color: "var(--success)" }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <strong style={{ display: "block", fontSize: "14px" }}>Pembayaran QRIS</strong>
            <small className="muted" style={{ fontSize: "12px" }}>Rupiah langsung aktif instan</small>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "10px", borderRadius: "8px", color: "var(--primary)" }}>
            <Terminal size={20} />
          </div>
          <div>
            <strong style={{ display: "block", fontSize: "14px" }}>100% Drop-in SDK</strong>
            <small className="muted" style={{ fontSize: "12px" }}>Tinggal ganti baseURL & key</small>
          </div>
        </div>
      </div>
    </section>
  );
}
export default HeroSection;
