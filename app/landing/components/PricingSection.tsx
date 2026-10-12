"use client";

import Link from "next/link";
import { Check, ArrowRight, CreditCard, ShieldCheck } from "lucide-react";
import { Badge } from "@/app/components/ui";
import { PACKAGES } from "@/app/components/packageData";

export function PricingSection() {
  return (
    <section id="paket" style={{ padding: "80px 24px", maxWidth: "1100px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <span className="eyebrow" style={{ color: "var(--primary)" }}>PILIHAN PAKET TOKEN</span>
        <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", marginTop: "8px", fontWeight: 700 }}>
          Bayar Sekali. Pakai Kapan Saja Tanpa Kedaluwarsa.
        </h2>
        <p className="muted" style={{ maxWidth: "580px", margin: "12px auto 0", fontSize: "15px" }}>
          Tanpa tagihan bulanan berulang. Token Anda tetap aktif selamanya sampai terpakai habis.
        </p>
      </div>

      <div className="packages">
        {PACKAGES.map((p, i) => (
          <article
            key={p.name}
            className={`package-card ${i === 1 ? "selected" : ""}`}
            style={{ display: "flex", flexDirection: "column" }}
          >
            <div className="package-top">
              <Badge tier={p.tierKey === "free" ? "FREE" : "PRO"} />
              {p.tierKey === "pro_25k" && <span className="popular">PALING POPULER</span>}
              {p.tierKey === "free" && <span className="popular">GRATIS</span>}
            </div>
            <p className="package-desc">{p.desc}</p>
            <div className="price">
              <span>Rp</span> {p.price}
            </div>
            <div className="one-time">{p.price === "0" ? "gratis uji coba" : "sekali bayar"}</div>
            <div className="token-box">
              <div>
                <span className="small-label">Token yang didapat</span>
                <div className="token-number">
                  {p.tokens} <span>token</span>
                </div>
              </div>
              <Badge tier={p.tierKey === "free" ? "FREE" : "PRO"} />
            </div>
            <ul className="package-features" style={{ flexGrow: 1 }}>
              {p.features.map((f) => (
                <li key={f}>
                  <Check size={15} />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/dashboard"
              className={`button ${p.tierKey === "pro_25k" ? "primary" : "secondary"}`}
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: "100%",
                height: "44px",
              }}
            >
              {p.price === "0" ? "Klaim" : "Beli"} {p.name}
              <ArrowRight size={16} />
            </Link>
            <div className="package-foot">
              <CreditCard size={13} />
              {p.price === "0" ? "Aktivasi instan" : "Bayar instan via QRIS"}
            </div>
          </article>
        ))}
      </div>

      <div className="purchase-note" style={{ marginTop: "24px" }}>
        <ShieldCheck size={16} />
        <span>Konfirmasi otomatis 24/7</span>
        <span className="note-dot">·</span>
        <span>Harga transparan sudah termasuk pajak</span>
        <span className="note-dot">·</span>
        <span>Bonus 2.500.000 token bansos gratis untuk akun baru</span>
      </div>
    </section>
  );
}
export default PricingSection;
