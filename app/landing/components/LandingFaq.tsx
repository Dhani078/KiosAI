"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

export function LandingFaq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "Apa itu TokoAI dan bagaimana cara kerjanya?",
      a: "TokoAI adalah gateway API OpenAI-compatible lokal Indonesia. Kami menghubungkan aplikasi Anda ke berbagai provider model AI kelas dunia melalui satu endpoint terpusat dengan pembayaran instan via QRIS Rupiah.",
    },
    {
      q: "Bisa dipakai di Cursor, Cline, atau Claude Code?",
      a: "Tentu saja! Cukup masukkan baseURL TokoAI dan API key Anda pada pengaturan OpenAI di Cursor, Cline, Roo Code, atau ekstensi AI coding editor lainnya.",
    },
    {
      q: "Apakah token yang saya beli memiliki masa kedaluwarsa?",
      a: "Tidak ada. Token yang Anda beli berlaku selamanya sampai terpakai habis.",
    },
    {
      q: "Bagaimana cara kerja tarif token?",
      a: "Tiap model punya tarif Input / Output ($ per 1 juta token) yang tampil di katalog. Token terpotong mengikuti tarif model yang Anda pakai. Model hemat saldo, model flagship memakai proporsional.",
    },
    {
      q: "Apakah ada bonus untuk pendaftaran akun baru?",
      a: "Ya! Setiap akun baru otomatis mendapat 2.500.000 token gratis (Free tier) untuk langsung mencoba endpoint dan Playground.",
    },
  ];

  return (
    <section id="faq" style={{ padding: "80px 24px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h2 style={{ fontSize: "clamp(26px, 3.5vw, 38px)", letterSpacing: "-0.8px", fontWeight: 700 }}>
          Pertanyaan Kerap Ditanyakan Developer
        </h2>
        <p className="muted" style={{ maxWidth: "560px", margin: "12px auto 0", fontSize: "15px" }}>
          Jawaban langsung seputar akun, gateway, dan pembayaran token.
        </p>
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
