"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

export function PackageFaq() {
  const [faq, setFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "Apakah token memiliki masa berlaku?",
      a: "Tidak. Token Anda tidak kedaluwarsa dan bisa digunakan kapan saja.",
    },
    {
      q: "Bagaimana token saya dihitung?",
      a: "Setiap model punya tarif Input / Output ($ per 1 juta token) yang ditampilkan di kartu model. Pemakaian nyata request Anda dikonversi ke tarif tersebut, jadi Anda hanya membayar sesuai harga model yang dipakai.",
    },
    {
      q: "Bisa upgrade tier kapan saja?",
      a: "Ya. Cukup beli paket tier yang lebih tinggi, tier akun Anda langsung otomatis naik.",
    },
  ];

  return (
    <section className="questions">
      <h2>Sebelum Anda mulai</h2>
      {faqs.map((f, i) => (
        <div className="faq-item" key={f.q}>
          <button
            aria-expanded={faq === i}
            onClick={() => setFaq(faq === i ? null : i)}
          >
            {f.q}
            <Plus size={16} className={faq === i ? "rotated" : ""} />
          </button>
          {faq === i && <p>{f.a}</p>}
        </div>
      ))}
    </section>
  );
}
export default PackageFaq;
