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
      q: "Bagaimana multiplier token bekerja?",
      a: "Model Silver menggunakan 2.0× token dan model Gold 4.0× token dari jumlah token asli request Anda.",
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
