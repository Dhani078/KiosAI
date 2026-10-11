"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

export function LandingFaq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "Apa itu KiosAI dan bagaimana cara kerjanya?",
      a: "KiosAI adalah gateway API OpenAI-compatible lokal Indonesia. Kami menghubungkan aplikasi Anda ke berbagai provider model AI kelas dunia melalui satu endpoint terpusat dengan pembayaran instan via QRIS Rupiah.",
    },
    {
      q: "Bisa dipakai di Cursor, Cline, atau Claude Code?",
      a: "Tentu saja! Cukup masukkan baseURL KiosAI dan API key Anda pada pengaturan OpenAI di Cursor, Cline, Roo Code, atau ekstensi AI coding editor lainnya.",
    },
    {
      q: "Apakah token yang saya beli memiliki masa kedaluwarsa?",
      a: "Tidak ada. Token yang Anda beli berlaku selamanya sampai terpakai habis.",
    },
    {
      q: "Bagaimana cara kerja sistem multiplier token?",
      a: "Setiap paket memiliki pengali konsumsi: model ringan (Flash) dihitung 1.0x token, model reasoning lanjutan dihitung 2.0x atau 4.0x token dari usage asli request.",
    },
    {
      q: "Apakah ada bonus untuk pendaftaran akun baru?",
      a: "Ya! Setiap akun yang baru mendaftar otomatis mendapatkan saldo gratis 100.000 token untuk mencoba endpoint dan Playground langsung.",
    },
  ];

  return (
    <section id="faq" style={{ padding: "80px 24px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <span className="eyebrow" style={{ color: "var(--primary)" }}>PERTANYAAN UMUM</span>
        <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", marginTop: "8px", fontWeight: 700 }}>
          Kerap Ditanyakan oleh Developer
        </h2>
      </div>

      <div className="questions">
        {faqs.map((f, i) => (
          <div className="faq-item" key={f.q}>
            <button
              aria-expanded={openIdx === i}
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
            >
              {f.q}
              <Plus size={16} className={openIdx === i ? "rotated" : ""} />
            </button>
            {openIdx === i && <p style={{ lineHeight: 1.6 }}>{f.a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
export default LandingFaq;
