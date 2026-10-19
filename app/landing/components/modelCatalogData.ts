export interface ModelItem {
  id: string;
  name: string;
  provider: "Anthropic" | "OpenAI" | "DeepSeek" | "Google" | "Meta" | "OpenCode";
  context: string;
  tier: "free" | "pro";
  pricing: string;
  desc: string;
  strengths: string[];
}

export const MODELS: ModelItem[] = [
  {
    id: "deepseek-v4.1-flash",
    name: "DeepSeek V4.1 Flash",
    provider: "DeepSeek",
    context: "128k",
    tier: "free",
    pricing: "Gratis",
    desc: "Model uji coba gratis untuk eksplorasi chat & prompt bagi semua pengguna baru.",
    strengths: ["Free Tier", "Trial Cepat", "Multi-turn Chat"],
  },
  {
    id: "oc/deepseek-v4.1-flash-free(max)",
    name: "DeepSeek V4.1 Flash Free (Max)",
    provider: "OpenCode",
    context: "200k",
    tier: "free",
    pricing: "Gratis",
    desc: "Model reasoning kilat OpenCode gratis dengan 200k context window dan thinking max.",
    strengths: ["Free Tier", "200k Context", "Thinking Max"],
  },
  {
    id: "oc/mimo-v2.6-flash-free",
    name: "MiMo V2.6 Flash Free",
    provider: "OpenCode",
    context: "200k",
    tier: "free",
    pricing: "Gratis",
    desc: "Model efisien OpenCode untuk tugas coding cepat dan percakapan interaktif bebas kuota.",
    strengths: ["Free Tier", "Coding Ringan", "Bebas Kuota"],
  },
  {
    id: "ag/gemini-3.8-flash-high",
    name: "Gemini 3.8 Flash (High)",
    provider: "Google",
    context: "1M",
    tier: "pro",
    pricing: "In $0.075 · Out $0.30 / 1M",
    desc: "Model reasoning generasi terbaru Google dengan dukungan vision dan context window luas.",
    strengths: ["Vision", "Reasoning", "Ultra Fast"],
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
    id: "deepseek-v4.1-flash",
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
    id: "ag/claude-sonnet-4-6",
    name: "Claude Sonnet 4.6 (Thinking)",
    provider: "Anthropic",
    context: "200k",
    tier: "pro",
    pricing: "In $3.00 · Out $15.00 / 1M",
    desc: "Model flagship reasoning Anthropic dengan kapabilitas vision & coding tingkat lanjut.",
    strengths: ["Vision", "Thinking", "Coding"],
  },
  {
    id: "ag/claude-opus-4-6-thinking",
    name: "Claude Opus 4.6 (Thinking)",
    provider: "Anthropic",
    context: "200k",
    tier: "pro",
    pricing: "In $15.00 · Out $75.00 / 1M",
    desc: "Model penalaran mendalam tertinggi dari Anthropic untuk arsitektur dan problem solving kompleks.",
    strengths: ["Vision", "Deep Thinking", "Kompleks"],
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
