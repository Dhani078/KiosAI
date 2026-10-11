export const models = [
  { name: "GPT-4o mini", id: "gpt-4o-mini", tier: 0 },
  { name: "Gemini 2.0 Flash", id: "gemini-2.0-flash", tier: 0 },
  { name: "Llama 3.3 70B", id: "llama-3.3-70b", tier: 0 },
  { name: "Claude 3.5 Sonnet", id: "claude-3.5-sonnet", tier: 1 },
  { name: "GPT-4o", id: "gpt-4o", tier: 1 },
  { name: "Gemini 2.5 Pro", id: "gemini-2.5-pro", tier: 1 },
  { name: "Claude 3.7 Sonnet", id: "claude-3.7-sonnet", tier: 2 },
  { name: "o3", id: "o3", tier: 2 },
  { name: "GPT-4.1", id: "gpt-4.1", tier: 2 },
]
export const tiers = ["Bronze", "Silver", "Gold"]
export type ChatMessage = {
  text: string
  user: boolean
  model?: string
  cost?: number
  multiplier?: number
}
export type Order = {
  id: string
  date: string
  tier: string
  price: string
}
export const initialOrders: Order[] = [
  { id: "INV-2025-0182", date: "18 Jun 2025", tier: "Bronze", price: "50.000" },
  { id: "INV-2025-0109", date: "02 Jun 2025", tier: "Bronze", price: "50.000" },
]
export function demoReply(prompt: string) {
  if (/python|fungsi|coding/i.test(prompt))
    return "Berikut contoh fungsi Python sederhana untuk menghitung total belanja:\n\n def hitung_total(harga, jumlah):\n     return harga * jumlah\n\n total = hitung_total(15000, 3)\n print(total)  # 45000\n\nValidasi harga dan jumlah sebelum digunakan di aplikasi. Respons ini adalah contoh lokal, bukan hasil model AI."
  if (/konten|bisnis|toko/i.test(prompt))
    return "Tiga ide konten untuk bisnis Anda:\n\n1. Ceritakan proses di balik produk — tunjukkan apa yang membuatnya berbeda.\n2. Jawab satu pertanyaan pelanggan lewat video singkat.\n3. Bagikan contoh penggunaan produk dan ajak pelanggan berbagi pengalaman.\n\nMulai dari satu konten per hari, lalu evaluasi respons audiens. Ini adalah contoh respons demo lokal."
  if (/api/i.test(prompt))
    return "API adalah penghubung antara aplikasi Anda dan sebuah layanan. Untuk gateway yang kompatibel dengan OpenAI, kirim API key pada header Authorization, pilih model, lalu sertakan pesan pada endpoint /v1/chat/completions.\n\nContoh integrasi tersedia di Dokumentasi. Base URL dan key di prototipe ini hanya ilustrasi; belum ada layanan gateway aktif."
  return `Anda menulis: “${prompt}”\n\nMulai dengan mendefinisikan tujuan, kebutuhan pengguna, dan hasil yang ingin dicapai. Pecah pekerjaan menjadi langkah kecil yang dapat diuji, lalu ukur dampaknya.\n\nIni respons contoh lokal. Prototipe belum mengirim prompt ke layanan AI.`
}
