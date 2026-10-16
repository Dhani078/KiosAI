/**
 * Normalisasi payload prompt yang code-fence-aware dan aman memory V8 (Base64 Large Blob Protection).
 * Melindungi 100% isi di dalam blok kode (```...``` dan `...`) agar aman
 * untuk asisten koding (Cline/Roo Code), sementara merapikan whitespace prosa.
 */

const LARGE_BLOB_THRESHOLD = 4096;

export function fingerprintLargeBlob(str: string): string {
  if (str.length <= LARGE_BLOB_THRESHOLD) return str;
  const len = str.length;
  const head = str.slice(0, 32);
  const mid = str.slice(Math.floor(len / 2), Math.floor(len / 2) + 32);
  const tail = str.slice(len - 32);
  return `__KIOS_BLOB_${len}_${head}_${mid}_${tail}__`;
}

export function normalizePromptTextSafely(rawText: string): string {
  if (!rawText) return "";
  if (rawText.length > LARGE_BLOB_THRESHOLD) return fingerprintLargeBlob(rawText);

  const codeBlockRegex = /(```[\s\S]*?```|`[^`\n]+`)/g;
  const parts = rawText.split(codeBlockRegex);

  return parts
    .map((segment) => {
      if (segment.startsWith("```") || (segment.startsWith("`") && segment.endsWith("`"))) {
        return segment.replace(/\r\n/g, "\n");
      }

      let cleaned = segment
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/([?!.]){2,}/g, "$1")
        .trim();

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
    if (typeof value === "string" && value.length > LARGE_BLOB_THRESHOLD) {
      return fingerprintLargeBlob(value);
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(canonicalizeJsonValue);
  }

  const record = value as Record<string, unknown>;
  const sortedKeys = Object.keys(record).sort();
  const result: Record<string, unknown> = Object.create(null);

  for (const key of sortedKeys) {
    // Anti-prototype-pollution: filter dangerous prototype keys
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue;
    }
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
        if (part && typeof part === "object") {
          const rec = part as Record<string, unknown>;
          if (rec.type === "text" && typeof rec.text === "string") {
            return { ...rec, text: normalizePromptTextSafely(rec.text) };
          }
          if (rec.type === "image_url" && rec.image_url && typeof rec.image_url === "object") {
            const img = rec.image_url as Record<string, unknown>;
            const urlStr = String(img.url || "");
            return {
              ...rec,
              image_url: { ...img, url: fingerprintLargeBlob(urlStr) },
            };
          }
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
