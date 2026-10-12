"use client";

import { Check, ArrowUpRight, Zap } from "lucide-react";

export function PackageComparison({
  onNavigateDocs,
}: {
  onNavigateDocs: () => void;
}) {
  const comparisonModels = [
    {
      name: "Gemini Flash / DeepSeek",
      sub: "Google / DeepSeek",
      use: "Chatbot & tugas cepat sehari-hari",
      tier: 0,
    },
    {
      name: "Claude Haiku / GPT-4o mini",
      sub: "Anthropic / OpenAI",
      use: "Respons cepat & multimodal",
      tier: 0,
    },
    {
      name: "Claude 3.5 Sonnet / GPT-4o",
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
      name: "Claude 3.7 Sonnet / Flagship",
      sub: "Anthropic / Flagship",
      use: "Penalaran kompleks tanpa kompromi",
      tier: 2,
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
              <th>BRONZE</th>
              <th>SILVER</th>
              <th>GOLD</th>
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
                {[0, 1, 2].map((t) => (
                  <td className="check-cell" key={t}>
                    {t >= m.tier ? (
                      <Check size={17} />
                    ) : (
                      <span className="dash">—</span>
                    )}
                  </td>
                ))}
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
