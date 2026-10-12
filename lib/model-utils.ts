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
  if (lower.includes("atria-dawn")) {
    return "Atria-Dawn-Preview (Bansos)";
  }
  if (lower.includes("deepseek-v4.1-flash")) {
    return "deepseek-v4.1-flash";
  }
  if (lower.includes("claude-haiku-4.5")) {
    return "claude-haiku-4.5";
  }
  if (lower.includes("claude-sonnet-4.5")) {
    return "claude-sonnet-4.5";
  }

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
  if (m === "claude-haiku-4.5" || m === "kr/claude-haiku-4.5") {
    return "kr/claude-haiku-4.5-thinking-agentic";
  }
  if (m === "claude-sonnet-4.5" || m === "kr/claude-sonnet-4.5") {
    return "kr/claude-sonnet-4.5-thinking-agentic";
  }
  if (m === "deepseek-v4.1-flash") {
    return "tokenharbor/deepseek-v4.1-flash:free";
  }
  if (m === "Atria-Dawn-Preview (Bansos)" || m.toLowerCase() === "atria-dawn-preview" || m.toLowerCase() === "atria-bansos") {
    return "atria/Atria-Dawn-Preview";
  }
  return m;
}
