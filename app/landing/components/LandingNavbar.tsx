"use client";

import Link from "next/link";
import Logo from "@/app/components/Logo";
import { ArrowRight, LayoutDashboard } from "lucide-react";

export function LandingNavbar() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(18, 15, 12, 0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        maxWidth: "1280px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
        <Logo />
      </Link>

      <nav
        style={{
          display: "flex",
          gap: "24px",
          alignItems: "center",
          fontSize: "13px",
        }}
        className="landing-nav-links"
      >
        <a href="#fitur" className="text-link" style={{ minHeight: "auto" }}>
          Fitur
        </a>
        <a href="#paket" className="text-link" style={{ minHeight: "auto" }}>
          Paket Harga
        </a>
        <a href="#integrasi" className="text-link" style={{ minHeight: "auto" }}>
          Integrasi SDK
        </a>
        <a href="#faq" className="text-link" style={{ minHeight: "auto" }}>
          FAQ
        </a>
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Link
          href="/dashboard"
          className="button primary"
          style={{
            fontSize: "13px",
            height: "38px",
            padding: "0 16px",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <LayoutDashboard size={15} />
          Buka Dashboard
          <ArrowRight size={14} />
        </Link>
      </div>
    </header>
  );
}
export default LandingNavbar;
