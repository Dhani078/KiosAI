export interface ModelItem {
  id: string;
  name: string;
  provider: "Anthropic" | "OpenAI" | "DeepSeek" | "Google" | "Meta";
  context: string;
  tier: "bronze" | "silver" | "gold";
  multiplier: string;
  desc: string;
  strengths: string[];
}

export const MODELS: ModelItem[] = [
  {
    id: "tokenharbor/deepseek-v4.1-flash:free",
    name: "DeepSeek V4.1 Flash",
    provider: "DeepSeek",
    context: "128k",
    tier: "bronze",
    multiplier: "1.0×",
    desc: "Model reasoning super cepat, efisien untuk coding & chat harian.",
    strengths: ["Cepat & Hemat", "Coding", "Bahasa Indonesia"],
  },
  {
    id: "anthropic/claude-3.7-sonnet",
    name: "Claude 3.7 Sonnet",
    provider: "Anthropic",
    context: "200k",
    tier: "silver",
    multiplier: "2.0×",
    desc: "Standar tertinggi arsitektur software, coding kompleks & hybrid reasoning.",
    strengths: ["Fullstack Dev", "Hybrid Reasoning", "Analisis"],
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    context: "128k",
    tier: "silver",
    multiplier: "2.0×",
    desc: "Multimodal flagship OpenAI dengan performa analitis seimbang.",
    strengths: ["Multimodal", "Instruksi Ketat", "JSON Mode"],
  },
  {
    id: "google/gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    context: "1M",
    tier: "bronze",
    multiplier: "1.0×",
    desc: "Model generasi baru Google dengan context window 1 juta token kilat.",
    strengths: ["Ultra Low Latency", "1M Context", "Hemat"],
  },
  {
    id: "deepseek/deepseek-r1",
    name: "DeepSeek R1",
    provider: "DeepSeek",
    context: "128k",
    tier: "silver",
    multiplier: "2.0×",
    desc: "Reasoning mendalam untuk matematika, algoritma, dan logika berat.",
    strengths: ["Chain of Thought", "Matematika", "Problem Solving"],
  },
  {
    id: "meta/llama-3.3-70b",
    name: "Llama 3.3 70B",
    provider: "Meta",
    context: "128k",
    tier: "bronze",
    multiplier: "1.0×",
    desc: "Open weights tercanggih kelas enterprise dari Meta AI.",
    strengths: ["Open Intelligence", "General Task", "Efisiensi"],
  },
];

export const TIER_COLORS = {
  bronze: { bg: "rgba(192, 138, 91, 0.15)", text: "#C08A5B", border: "#C08A5B" },
  silver: { bg: "rgba(185, 196, 204, 0.15)", text: "#B9C4CC", border: "#B9C4CC" },
  gold: { bg: "rgba(230, 195, 106, 0.15)", text: "#E6C36A", border: "#E6C36A" },
};
