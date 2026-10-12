/**
 * Format model ID for clean display across web UI.
 * Strips 'tokenharbor/' prefix and ':free' suffix.
 * e.g. 'tokenharbor/deepseek-v4.1-flash:free' -> 'deepseek-v4.1-flash'
 */
export function formatModelName(modelId: string): string {
  if (!modelId) return "";
  return modelId
    .replace(/^tokenharbor\//, "")
    .replace(/:free$/, "");
}
