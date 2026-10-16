export interface PromptPreset {
  id: string;
  name: string;
  system: string;
}

export const PLAYGROUND_PRESETS: PromptPreset[] = [
  {
    id: "general",
    name: "Default (Asisten Umum)",
    system: "",
  },
  {
    id: "coding",
    name: "Coding Specialist (Ringkas, Kode Saja)",
    system: "Bertindaklah sebagai Senior Software Architect. Jawab pertanyaan teknis dengan solusi kode konkret, ringkas, tanpa basa-basi pembuka/penutup.",
  },
  {
    id: "formal_id",
    name: "Penerjemah Bahasa Indonesia Formal",
    system: "Terjemahkan atau poles teks yang diberikan ke dalam bahasa Indonesia baku, profesional, dan sesuai kaidah KBBI/EYD terbaru.",
  },
  {
    id: "json_extractor",
    name: "JSON Data Extractor",
    system: "Ekstrak seluruh informasi kunci dari teks pengguna ke dalam format valid JSON murni tanpa markdown fence dan tanpa teks tambahan.",
  },
];
