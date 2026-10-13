"use client";

import { Code2, CreditCard, Layers, ShieldCheck, Gauge, Zap } from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: Code2,
      title: "100% Kompatibel OpenAI SDK",
      desc: "Gunakan library resmi OpenAI di Python, Node.js, Go, atau PHP. Cukup ubah baseURL dan API key.",
    },
    {
      icon: CreditCard,
      title: "Bayar Pakai QRIS Rupiah",
      desc: "Beli token mulai Rp 25.000 dengan Gopay, OVO, Dana, ShopeePay, atau BCA Mobile tanpa kartu kredit.",
    },
    {
      icon: Layers,
      title: "Multi-Model Gateway Instan",
      desc: "Akses ratusan model AI dari satu akun: DeepSeek R1, Claude 3.7 Sonnet, GPT-4o, hingga Gemini Flash.",
    },
    {
      icon: Gauge,
      title: "Tarif Token Transparan",
      desc: "Setiap model menampilkan tarif Input / Output ($ per 1M token). Tanpa pengali tersembunyi — Anda hanya membayar apa yang dipakai.",
    },
    {
      icon: Zap,
      title: "Latensi Rendah Region Tokyo",
      desc: "Infrastruktur serverless dekat dengan node AI regional untuk respons streaming SSE yang kilat.",
    },
    {
      icon: ShieldCheck,
      title: "Keamanan Standar Industri",
      desc: "Kunci API di-hash dengan SHA-256 satu arah, password scrypt, dan proteksi sliding window rate limiting.",
    },
  ];

  return (
    <section id="fitur" style={{ padding: "80px 24px", maxWidth: "1100px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <span className="eyebrow" style={{ color: "var(--primary)" }}>KEUNGGULAN UTAMA</span>
        <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", marginTop: "8px", fontWeight: 700 }}>
          Didesain Khusus untuk Pengembang & Tim Digital
        </h2>
        <p className="muted" style={{ maxWidth: "600px", margin: "12px auto 0", fontSize: "15px" }}>
          Semua kebutuhan integrasi AI dirancang sesederhana mungkin agar Anda bisa fokus membangun produk.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
        }}
      >
        {features.map((f) => (
          <article
            key={f.title}
            className="panel"
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              background: "var(--surface)",
              borderRadius: "var(--radius-card)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "8px",
                background: "var(--canvas)",
                border: "1px solid var(--border)",
                display: "grid",
                placeItems: "center",
                color: "var(--primary)",
              }}
            >
              <f.icon size={20} />
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: 600 }}>{f.title}</h3>
            <p className="muted" style={{ fontSize: "13px", lineHeight: 1.6 }}>{f.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
export default FeaturesSection;
