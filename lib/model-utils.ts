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
  if (lower.includes("atria-dawn")) return "Atria-Dawn-Preview";
  if (lower.includes("deepseek-v4.1-flash")) return "deepseek-v4.1-flash";
  if (lower.includes("claude-haiku-4.5")) return "claude-haiku-4.5";
  if (lower.includes("claude-sonnet-4.5")) return "claude-sonnet-4.5";
  if (lower === "ag/claude-sonnet-4-6") return "Claude Sonnet 4.6 (Thinking)";
  if (lower === "ag/claude-opus-4-6-thinking") return "Claude Opus 4.6 (Thinking)";
  if (lower.startsWith("ag/gemini-")) return formatAgGemini(lower);

  // Strip trailing :free or :batch
  const withoutSuffix = modelId.replace(/:(free|batch)$/i, "");
  // Extract clean model slug by taking the last segment (strips cx/, cl/, xai/, etc.)
  const parts = withoutSuffix.split("/");
  const slug = parts[parts.length - 1];
  return slug.replace(/^~/, "");
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
  if (lower === "atria-dawn-preview" || lower === "atria") {
    return "atria/Atria-Dawn-Preview";
  }
  if (m === "claude-sonnet-4-6" || m === "Claude Sonnet 4.6 (Thinking)") {
    return "ag/claude-sonnet-4-6";
  }
  if (m === "claude-opus-4-6-thinking" || m === "Claude Opus 4.6 (Thinking)") {
    return "ag/claude-opus-4-6-thinking";
  }
  return m;
}
