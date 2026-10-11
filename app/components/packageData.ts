export const PACKAGES = [
  {
    tierKey: "bronze",
    name: "Bronze",
    price: "50.000",
    tokens: "1.000.000",
    multiplier: "1.0",
    desc: "Untuk chatbot & eksperimen harian.",
    features: [
      "Model standar (Flash & Haiku)",
      "Cocok untuk chatbot cepat",
      "Akses API & Playground",
    ],
  },
  {
    tierKey: "silver",
    name: "Silver",
    price: "150.000",
    tokens: "3.500.000",
    multiplier: "2.0",
    desc: "Lebih banyak ruang untuk aplikasi bisnis.",
    features: [
      "Semua model Bronze + Silver",
      "Coding & reasoning (GPT-4o, Sonnet)",
      "Konteks lebih panjang",
    ],
  },
  {
    tierKey: "gold",
    name: "Gold",
    price: "400.000",
    tokens: "10.000.000",
    multiplier: "4.0",
    desc: "Performa penuh tanpa kompromi.",
    features: [
      "Semua model, termasuk Flagship & Reasoning",
      "Penalaran & tugas riset kompleks",
      "Prioritas rate limit tertinggi",
    ],
  },
];
