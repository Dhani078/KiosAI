"use client";

import Link from "next/link";
import Logo from "@/app/components/Logo";

export function LandingFooter() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--surface)",
        padding: "48px 24px",
        marginTop: "80px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "24px",
        }}
      >
        <div>
          <Logo />
          <p className="muted" style={{ fontSize: "12px", marginTop: "8px", maxWidth: "340px" }}>
            Pasar kuota dan gateway API OpenAI-compatible terpercaya di Indonesia.
          </p>
        </div>

        <div style={{ display: "flex", gap: "24px", fontSize: "13px" }}>
          <Link href="/dashboard" className="text-link">Dashboard</Link>
          <a href="#fitur" className="text-link">Fitur</a>
          <a href="#paket" className="text-link">Paket Harga</a>
          <a href="#faq" className="text-link">FAQ</a>
        </div>

        <div style={{ textAlign: "right", fontSize: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end" }}>
            <span className="status-dot" />
            <span>TiDB Serverless & 9Router Live</span>
          </div>
          <span className="muted" style={{ display: "block", marginTop: "4px" }}>
            © 2026 KiosAI. Dikembangkan oleh Dhani078.
          </span>
        </div>
      </div>
    </footer>
  );
}
export default LandingFooter;
