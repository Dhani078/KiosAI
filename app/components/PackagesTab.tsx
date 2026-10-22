"use client";

import { useState } from "react";
import {
  Zap,
  Clock3,
  ArrowUpRight,
  ArrowRight,
  Check,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { Badge, Button } from "./ui";
import { PACKAGES, ADMIN_TEST_PACKAGE, getPackages } from "./packageData";
import PackageComparison from "./PackageComparison";
import PackageFaq from "./PackageFaq";

export { PACKAGES, ADMIN_TEST_PACKAGE, getPackages };

export function PackagesTab({
  balance,
  activeTier,
  isAdmin = false,
  onSelectPackage,
  onNavigateStatistik,
  onNavigateDocs,
}: {
  balance: number;
  activeTier: string;
  isAdmin?: boolean;
  onSelectPackage: (pkgIndex: number) => void;
  onNavigateStatistik: () => void;
  onNavigateDocs: () => void;
}) {
  const packages = getPackages(isAdmin);
  const [selected, setSelected] = useState(isAdmin ? 0 : 1);

  return (
    <>
      <section className="balance-strip">
        <div className="balance-main">
          <div className="balance-icon">
            <Zap size={20} />
          </div>
          <div>
            <span className="small-label">Saldo token Anda</span>
            <div className="balance-number">
              {balance.toLocaleString("id-ID")} <span>token</span>
            </div>
          </div>
        </div>
        <div className="balance-detail">
          <span className="small-label">Tier aktif</span>
          <Badge tier={activeTier.toUpperCase()} />
        </div>
        <div className="balance-detail expiration">
          <span className="small-label">Masa berlaku token</span>
          <span className="expiry">
            <Clock3 size={14} />
            Tidak kedaluwarsa
          </span>
        </div>
        <button className="text-link balance-link" onClick={onNavigateStatistik}>
          Lihat penggunaan <ArrowUpRight size={16} />
        </button>
      </section>

      <div className="section-heading">
        <h2>Pilih paket Anda</h2>
        <span>Bayar sekali. Pakai kapan saja.</span>
      </div>

      <div className="packages">
        {packages.map((p, i) => (
          <article
            key={p.name}
            className={`package-card ${selected === i ? "selected" : ""}`}
            onClick={() => setSelected(i)}
          >
            <div className="package-top">
              <Badge tier={p.tierKey === "free" ? "FREE" : "PRO"} />
              {p.tierKey === "test_100" && <span className="popular" style={{ color: "var(--warning)" }}>TEST ADMIN</span>}
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
            <ul className="package-features">
              {p.features.map((f) => (
                <li key={f}>
                  <Check size={15} />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              kind={selected === i ? "primary" : "secondary"}
              onClick={() => onSelectPackage(i)}
            >
              {p.price === "0" ? "Klaim" : "Beli"} {p.name}
              <ArrowRight size={16} />
            </Button>
            <div className="package-foot">
              <CreditCard size={13} />
              {p.price === "0" ? (isAdmin ? "Langsung aktif ke TiDB" : "Langsung aktif ke akun") : "Bayar dengan DOKU"}
            </div>
          </article>
        ))}
      </div>

      <div className="purchase-note">
        <ShieldCheck size={15} />
        <span>Pembayaran instan via DOKU</span>
        <span className="note-dot">·</span>
        <span>Token langsung masuk setelah pembayaran</span>
        <span className="note-dot">·</span>
        <span>Harga sudah termasuk PPN</span>
      </div>

      <PackageComparison onNavigateDocs={onNavigateDocs} />

      <div className="lower-grid">
        <section className="how-section">
          <div className="section-heading">
            <h2>Dari bayar ke berkarya.</h2>
            <span>Hanya 3 langkah</span>
          </div>
          <div className="steps">
            {[
              {
                title: "Pilih & bayar",
                text: "Pilih paket, lalu buka halaman checkout DOKU untuk membayar.",
              },
              {
                title: "Buat API key",
                text: isAdmin ? "Token masuk otomatis ke TiDB. Buat kunci API di halaman API Keys." : "Token masuk otomatis ke akun Anda. Buat kunci API di halaman API Keys.",
              },
              {
                title: "Mulai membangun",
                text: "Hubungkan ke SDK OpenAI, atau langsung coba di Playground.",
              },
            ].map((s, i) => (
              <div className="step" key={s.title}>
                <span className="step-number">0{i + 1}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <PackageFaq />
      </div>
    </>
  );
}
export default PackagesTab;
