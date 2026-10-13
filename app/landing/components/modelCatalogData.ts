export interface ModelItem {
  id: string;
  name: string;
  provider: "Anthropic" | "OpenAI" | "DeepSeek" | "Google" | "Meta" | "Atria";
  context: string;
  tier: "free" | "pro";
  pricing: string;
  desc: string;
  strengths: string[];
}

export const MODELS: ModelItem[] = [
  {
    id: "atria/Atria-Dawn-Preview",
    name: "Atria Dawn Preview",
    provider: "Atria",
    context: "128k",
    tier: "free",
    pricing: "Gratis",
    desc: "Model uji coba gratis untuk eksplorasi chat & prompt bagi semua pengguna baru.",
    strengths: ["Free Tier", "Trial Cepat", "Multi-turn Chat"],
  },
  {
    id: "tokenharbor/deepseek-v4.1-flash:free",
    name: "DeepSeek V4.1 Flash",
    provider: "DeepSeek",
    context: "128k",
    tier: "pro",
    pricing: "In $0.27 · Out $1.10 / 1M",
    desc: "Model reasoning super cepat, efisien untuk coding & chat harian.",
    strengths: ["Pro Tier", "Coding Cepat", "Bahasa Indonesia"],
  },
  {
    id: "anthropic/claude-3.7-sonnet",
    name: "Claude 3.7 Sonnet",
    provider: "Anthropic",
    context: "200k",
    tier: "pro",
    pricing: "In $3.00 · Out $15.00 / 1M",
    desc: "Standar tertinggi arsitektur software, coding kompleks & hybrid reasoning.",
    strengths: ["Fullstack Dev", "Hybrid Reasoning", "Analisis"],
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    context: "128k",
    tier: "pro",
    pricing: "In $2.50 · Out $10.00 / 1M",
    desc: "Multimodal flagship OpenAI dengan performa analitis seimbang.",
    strengths: ["Multimodal", "Instruksi Ketat", "JSON Mode"],
  },
  {
    id: "google/gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    context: "1M",
    tier: "pro",
    pricing: "In $0.075 · Out $0.30 / 1M",
    desc: "Model generasi baru Google dengan context window 1 juta token kilat.",
    strengths: ["Ultra Low Latency", "1M Context", "Hemat"],
  },
  {
    id: "deepseek/deepseek-r1",
    name: "DeepSeek R1",
    provider: "DeepSeek",
    context: "128k",
    tier: "pro",
    pricing: "In $0.55 · Out $2.19 / 1M",
    desc: "Reasoning mendalam untuk matematika, algoritma, dan logika berat.",
    strengths: ["Chain of Thought", "Matematika", "Problem Solving"],
  },
  {
    id: "meta/llama-3.3-70b",
    name: "Llama 3.3 70B",
    provider: "Meta",
    context: "128k",
    tier: "pro",
    pricing: "In $0.40 · Out $0.90 / 1M",
    desc: "Open weights tercanggih kelas enterprise dari Meta AI.",
    strengths: ["Open Intelligence", "General Task", "Efisiensi"],
  },
];

export const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  free: { bg: "rgba(79, 191, 122, 0.15)", text: "#4FBF7A", border: "#4FBF7A" },
  pro: { bg: "rgba(242, 140, 56, 0.15)", text: "#F28C38", border: "#F28C38" },
};
