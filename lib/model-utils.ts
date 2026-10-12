/**
 * Format model ID for clean display across web UI.
 * - Admin: sees internal routing keys (kr/claude-haiku-4.5-thinking-agentic, etc.)
 * - Regular user: sees clean commercial names (claude-haiku-4.5, claude-sonnet-4.5)
 */
export function formatModelName(modelId: string, isAdmin: boolean = false): string {
  if (!modelId) return "";
  if (modelId === "atria/Atria-Dawn-Preview" || modelId.toLowerCase().includes("atria-dawn")) {
    return isAdmin ? "atria/Atria-Dawn-Preview" : "Atria-Dawn-Preview (Bansos)";
  }
  if (!isAdmin) {
    if (modelId === "kr/claude-haiku-4.5-thinking-agentic" || modelId === "kr/claude-haiku-4.5") {
      return "claude-haiku-4.5";
    }
    if (modelId === "kr/claude-sonnet-4.5-thinking-agentic" || modelId === "kr/claude-sonnet-4.5") {
      return "claude-sonnet-4.5";
    }
    return modelId
      .replace(/^tokenharbor\//, "")
      .replace(/:free$/, "")
      .replace(/^kr\//, "");
  }
  return modelId
    .replace(/^tokenharbor\//, "")
    .replace(/:free$/, "");
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
