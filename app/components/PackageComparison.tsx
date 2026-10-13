"use client";

import { Check, ArrowUpRight, Zap } from "lucide-react";

export function PackageComparison({
  onNavigateDocs,
}: {
  onNavigateDocs: () => void;
}) {
  const comparisonModels = [
    {
      name: "Atria Dawn Preview",
      sub: "Atria / Free",
      use: "Uji coba gratis, eksperimen prompt & bot",
      tier: 0,
    },
    {
      name: "DeepSeek V4.1 Flash",
      sub: "DeepSeek / Pro",
      use: "Chatbot & tugas cepat sehari-hari",
      tier: 1,
    },
    {
      name: "Claude Haiku / GPT-4o mini",
      sub: "Anthropic / OpenAI",
      use: "Respons cepat & multimodal",
      tier: 1,
    },
    {
      name: "Claude Sonnet / GPT-4o",
      sub: "Anthropic / OpenAI",
      use: "Coding & analisis mendalam",
      tier: 1,
    },
    {
      name: "DeepSeek R1 / Reasoning",
      sub: "DeepSeek",
      use: "Penalaran & matematika lanjutan",
      tier: 1,
    },
    {
      name: "Gemini Pro / Flagship",
      sub: "Google / Flagship",
      use: "Penalaran kompleks tanpa kompromi",
      tier: 1,
    },
  ];

  return (
    <section className="comparison">
      <div className="section-heading">
        <div>
          <h2>Model yang bisa Anda akses</h2>
          <p>Model tepat untuk setiap kebutuhan.</p>
        </div>
        <button className="text-link" onClick={onNavigateDocs}>
          Lihat dokumentasi <ArrowUpRight size={15} />
        </button>
      </div>
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label="Perbandingan model"
      >
        <table>
          <thead>
            <tr>
              <th>MODEL</th>
              <th>COCOK UNTUK</th>
              <th>FREE</th>
              <th>PRO</th>
            </tr>
          </thead>
          <tbody>
            {comparisonModels.map((m, i) => (
              <tr key={m.name}>
                <td>
                  <div className="model-cell">
                    <span className={`model-logo logo-${i}`}>
                      <Zap size={16} />
                    </span>
                    <div>
                      <strong>{m.name}</strong>
                      <small>{m.sub}</small>
                    </div>
                  </div>
                </td>
                <td className="muted">{m.use}</td>
                <td className="check-cell">
                  {m.tier === 0 ? <Check size={17} /> : <span className="dash">—</span>}
                </td>
                <td className="check-cell">
                  <Check size={17} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-note">
        Semua model tersedia melalui satu API yang kompatibel dengan OpenAI.
        <span>
          Akses multi-model instan <ArrowUpRight size={14} />
        </span>
      </div>
    </section>
  );
}
export default PackageComparison;
