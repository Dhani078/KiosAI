/**
 * Normalisasi payload prompt yang code-fence-aware.
 * Melindungi 100% isi di dalam blok kode (```...``` dan `...`) agar aman
 * untuk asisten koding (Cline/Roo Code), sementara merapikan whitespace prosa.
 */

export function normalizePromptTextSafely(rawText: string): string {
  if (!rawText) return "";

  const codeBlockRegex = /(```[\s\S]*?```|`[^`\n]+`)/g;
  const parts = rawText.split(codeBlockRegex);

  return parts
    .map((segment) => {
      // Di dalam blok kode: hanya seragamkan line ending CRLF -> LF, jangan ubah spasi/indentasi
      if (segment.startsWith("```") || (segment.startsWith("`") && segment.endsWith("`"))) {
        return segment.replace(/\r\n/g, "\n");
      }

      // Di luar blok kode: rapikan spasi berlebih, tab, dan tanda baca berulang
      let cleaned = segment
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/([?!.]){2,}/g, "$1")
        .trim();

      // Prosa pendek tanpa karakter sintaks kode diseragamkan ke lowercase
      if (cleaned.length < 180 && !/[{}()[\];=<>\\/]/.test(cleaned)) {
        cleaned = cleaned.toLowerCase();
      }

      return cleaned;
    })
    .join(" ")
    .trim();
}

export function canonicalizeJsonValue(value: unknown): unknown {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(canonicalizeJsonValue);
  }

  const record = value as Record<string, unknown>;
  const sortedKeys = Object.keys(record).sort();
  const result: Record<string, unknown> = {};

  for (const key of sortedKeys) {
    const val = record[key];
    if (val !== undefined) {
      result[key] = canonicalizeJsonValue(val);
    }
  }
  return result;
}

export interface NormalizedMessage {
  role: string;
  content: unknown;
  name?: string;
  tool_call_id?: string;
}

export function normalizeMessagesArray(messages: unknown): NormalizedMessage[] {
  if (!Array.isArray(messages)) return [];

  return messages.map((msg) => {
    const item = (msg && typeof msg === "object" ? msg : {}) as Record<string, unknown>;
    const role = String(item.role || "user").toLowerCase().trim();
    let normalizedContent: unknown = item.content;

    if (typeof item.content === "string") {
      normalizedContent = normalizePromptTextSafely(item.content);
    } else if (Array.isArray(item.content)) {
      normalizedContent = item.content.map((part) => {
        if (part && typeof part === "object" && (part as Record<string, unknown>).type === "text") {
          const textPart = part as Record<string, unknown>;
          return {
            ...textPart,
            text: normalizePromptTextSafely(String(textPart.text || "")),
          };
        }
        return canonicalizeJsonValue(part);
      });
    }

    return {
      role,
      content: normalizedContent,
      ...(item.name ? { name: String(item.name).trim() } : {}),
      ...(item.tool_call_id ? { tool_call_id: String(item.tool_call_id).trim() } : {}),
    };
  });
}

export function buildCanonicalPayloadString(body: Record<string, unknown>): string {
  const canonicalObject = {
    model: String(body.model || "").toLowerCase().trim(),
    messages: normalizeMessagesArray(body.messages),
    tools: canonicalizeJsonValue(body.tools ?? null),
    tool_choice: canonicalizeJsonValue(body.tool_choice ?? null),
    response_format: canonicalizeJsonValue(body.response_format ?? null),
    seed: body.seed ?? null,
    stream: Boolean(body.stream),
  };

  return JSON.stringify(canonicalObject);
}
