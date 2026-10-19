function formatAgGemini(id: string): string {
  if (id === "ag/gemini-pro-agent") return "Gemini 3.1 Pro (High)";
  const raw = id.replace(/^ag\//, "");
  const parts = raw.split("-");
  const version = parts[1] || "";
  const type = (parts[2] || "").charAt(0).toUpperCase() + (parts[2] || "").slice(1);
  const tier = parts[3] ? ` (${parts[3].charAt(0).toUpperCase() + parts[3].slice(1)})` : "";
  return `Gemini ${version} ${type}${tier}`.trim();
}

/**
 * Format model ID for clean display across web UI.
 * - Admin: sees internal routing keys (kr/claude-haiku-4.5-thinking-agentic, cx/..., etc.)
 * - Regular user: sees 100% clean commercial names (claude-haiku-4.5, grok-4, etc. NO cx/, cl/, xai/, etc.)
 */
export function formatModelName(modelId: string, isAdmin: boolean = false): string {
  if (!modelId) return "";
  if (isAdmin) {
    return modelId.replace(/^tokenharbor\//, "").replace(/:free$/, "");
  }

  const lower = modelId.toLowerCase();
  if (lower.includes("deepseek-v4.1-flash")) return "deepseek-v4.1-flash";
  if (lower.includes("claude-haiku-4.5")) return "claude-haiku-4.5";
  if (lower.includes("claude-sonnet-4.5")) return "claude-sonnet-4.5";
  if (lower === "ag/claude-sonnet-4-6") return "Claude Sonnet 4.6 (Thinking)";
  if (lower === "ag/claude-opus-4-6-thinking") return "Claude Opus 4.6 (Thinking)";
  if (lower.startsWith("ag/gemini-")) return formatAgGemini(lower);

  // Strip trailing :free or :batch, -free, _free, (max)
  const withoutSuffix = modelId
    .replace(/:(free|batch)$/i, "")
    .replace(/-(free|batch)$/i, "")
    .replace(/_free$/i, "")
    .replace(/\(max\)$/i, "");

  const parts = withoutSuffix.split("/");
  let slug = parts[parts.length - 1].replace(/^~/, "");
  return slug
    .replace(/-(free|batch)$/i, "")
    .replace(/_free$/i, "")
    .replace(/-free\([^)]*\)$/i, "");
}

/**
 * Resolves commercial / clean UI aliases back to actual upstream 9Router model IDs.
 */
export function resolveModelAlias(modelId: string): string {
  if (!modelId) return "";
  const m = modelId.trim();
  const lower = m.toLowerCase();

  if (m === "claude-haiku-4.5" || m === "kr/claude-haiku-4.5") {
    return "kr/claude-haiku-4.5-thinking-agentic";
  }
  if (m === "claude-sonnet-4.5" || m === "kr/claude-sonnet-4.5") {
    return "kr/claude-sonnet-4.5-thinking-agentic";
  }
  if (lower === "claude-3.7-sonnet" || lower === "anthropic/claude-3.7-sonnet") {
    return "ag/claude-sonnet-4-6";
  }
  if (lower === "gpt-4o" || lower === "openai/gpt-4o") {
    return "cx/gpt-6-luna";
  }
  if (lower === "gemini-2.0-flash" || lower === "google/gemini-2.0-flash") {
    return "ag/gemini-3.8-flash-high";
  }
  if (lower === "deepseek-r1" || lower === "deepseek/deepseek-r1") {
    return "cf/@cf/deepseek-ai/deepseek-r1-distill-qwen-32b";
  }
  if (lower === "llama-3.3-70b" || lower === "meta/llama-3.3-70b") {
    return "cf/@cf/meta/llama-3.3-70b-instruct-fp8-fast";
  }
  if (m === "deepseek-v4.1-flash") {
    return "tokenharbor/deepseek-v4.1-flash:free";
  }
  if (m === "deepseek-v4.1-flash-free" || m === "beatapi/deepseek-v4.1-flash-free") {
    return "beatapi/deepseek-v4.1-flash-free";
  }
  if (lower === "atria-dawn-preview" || lower === "atria") {
    return "tokenharbor/deepseek-v4.1-flash:free";
  }
  if (m === "claude-sonnet-4-6" || m === "Claude Sonnet 4.6 (Thinking)") {
    return "ag/claude-sonnet-4-6";
  }
  if (m === "claude-opus-4-6-thinking" || m === "Claude Opus 4.6 (Thinking)") {
    return "ag/claude-opus-4-6-thinking";
  }
  if (lower === "deepseek-v4.1-flash-free(max)" || lower === "oc/deepseek-v4.1-flash-free(max)") {
    return "oc/deepseek-v4.1-flash-free(max)";
  }
  if (lower === "muse-spark-1.3-contributor-free" || lower === "oc/muse-spark-1.3-contributor-free" || lower === "muse-spark-1.3-contributor") {
    return "oc/muse-spark-1.3-contributor-free";
  }
  if (lower === "mimo-v2.6-flash-free" || lower === "oc/mimo-v2.6-flash-free" || lower === "mimo-v2.6-flash") {
    return "oc/mimo-v2.6-flash-free";
  }
  if (lower === "nemotron-3.5-lightning-free" || lower === "oc/nemotron-3.5-lightning-free" || lower === "nemotron-3.5-lightning") {
    return "oc/nemotron-3.5-lightning-free";
  }
  return m;
}

/**
 * Mengubah pesan error teknis gateway / upstream menjadi bahasa manusia ramah pengguna.
 * Untuk admin, pesan ramah disertai [Detail Teknis: ...] untuk kemudahan debugging.
 */
export function humanizeErrorMessage(msg: string, isAdmin: boolean = false): string {
  if (!msg) return "Terjadi kendala saat memproses permintaan. Silakan coba lagi.";
  const lower = msg.toLowerCase();
  let friendly = "";

  const resetMatch = msg.match(/reset after\s*([0-9a-z]+)/i) || msg.match(/reset in\s*([0-9a-z]+)/i);
  const resetTime = resetMatch ? resetMatch[1] : null;

  if (lower.includes("530") || lower.includes("1016") || lower.includes("origin dns") || lower.includes("dns")) {
    friendly = "Server model AI upstream sedang mengalami gangguan koneksi atau DNS. Silakan beralih ke model lain seperti DeepSeek atau Gemini.";
  } else if (lower.includes("upstream_fatal") || lower.includes("upstream error") || lower.includes("upstream (50") || lower.includes("bad_gateway") || lower.includes("502") || lower.includes("504")) {
    friendly = "Jalur koneksi ke provider model AI sedang terganggu sementara. Silakan coba sesaat lagi atau gunakan model alternatif.";
  } else if (lower.includes("token quota exhausted") || lower.includes("insufficient_quota") || lower.includes("quota exceeded")) {
    friendly = resetTime
      ? `Kuota provider untuk model ini sedang habis (reset dalam ${resetTime}). Silakan beralih ke model lain.`
      : "Kuota provider untuk model ini sedang mencapai batas. Silakan beralih ke model lain atau coba beberapa saat lagi.";
  } else if (lower.includes("rate limit") || lower.includes("429") || lower.includes("too many requests")) {
    friendly = resetTime
      ? `Batas frekuensi permintaan tercapai (reset dalam ${resetTime}). Silakan tunggu ${resetTime} sebelum mencoba lagi.`
      : "Terlalu banyak permintaan dalam waktu singkat. Silakan tunggu beberapa detik sebelum mencoba lagi.";
  } else if (lower.includes("503") || lower.includes("overloaded") || lower.includes("service unavailable")) {
    friendly = "Layanan model AI upstream sedang sibuk atau mengalami gangguan sementara. Silakan beralih ke model lain.";
  } else if (lower.includes("timeout") || lower.includes("timed out") || lower.includes("aborterror")) {
    friendly = "Waktu tunggu permintaan habis (timeout). Silakan ulangi pertanyaan atau gunakan model yang lebih ringan.";
  } else if (lower.includes("tier_restricted") || lower.includes("tier free")) {
    friendly = "Model ini hanya tersedia untuk paket Pro. Silakan beli paket Pro untuk membuka akses seluruh model.";
  } else if (lower.includes("balance_exhausted") || lower.includes("saldo tidak cukup") || lower.includes("saldo habis")) {
    friendly = "Saldo token Anda tidak mencukupi untuk permintaan ini. Silakan isi saldo di menu Beli Token.";
  } else {
    friendly = msg.replace(/^Upstream error:\s*/i, "").replace(/^UPSTREAM_FATAL_\d+:\s*/i, "");
  }

  return friendly;
}
