import { NextResponse } from "next/server";

export const UPSTREAM_URL =
  process.env.NINEROUTER_URL || "http://127.0.0.1:20128";
// ponytail: single upstream key; fallback NINEROUTER_API_KEY_2 -> NINEROUTER_API_KEY. Add rotation when >2 keys.
export const UPSTREAM_KEY =
  process.env.NINEROUTER_API_KEY_2 || process.env.NINEROUTER_API_KEY || "";

export function errorResponse(
  message: string,
  status: number,
  code: string = "kiosai_error",
  headers?: Record<string, string>,
) {
  return NextResponse.json(
    {
      error: {
        message,
        type:
          status === 401
            ? "authentication_error"
            : status === 429
              ? "rate_limit_error"
              : "invalid_request_error",
        code,
      },
    },
    { status, headers },
  );
}

/**
 * 9Router answers a `stream:false` request in three different shapes depending on
 * the model, and `[DONE]` is not always newline-separated:
 *   1. plain `chat.completion` JSON           → deepseek-v4.1-flash, atria
 *   2. plain JSON with `data: [DONE]` glued on → same models, more often
 *   3. a real SSE chunk stream                 → kr/* thinking models
 * Normalize all three into one chat.completion object so a non-stream request
 * never 502s.
 */
export function parseUpstreamJson(rawText: string): any {
  const text = (rawText || "").replace(/data:\s*\[DONE\]/g, "").trim();

  // Shapes 1 & 2: the body is (or starts with) a complete JSON object.
  if (text.startsWith("{")) {
    try {
      return JSON.parse(text);
    } catch {
      // Glued whatever-the-upstream-appended: salvage the leading JSON object.
      const end = lastBalancedObjectEnd(text);
      if (end > 0) {
        try {
          return JSON.parse(text.slice(0, end));
        } catch {
          // fall through to SSE aggregation
        }
      }
    }
  }

  // Shape 3: SSE chunks: stitch them into one chat.completion object.
  let id = "chatcmpl-kiosai";
  let model = "";
  let created = Math.floor(Date.now() / 1000);
  let content = "";
  let reasoning = "";
  let finishReason: string | null = null;
  let usage: any = null;

  for (const line of text.split("\n")) {
    if (!line.startsWith("data: ")) continue;
    const payload = line.slice(6).trim();
    if (!payload) continue;
    let chunk: any;
    try {
      chunk = JSON.parse(payload);
    } catch {
      continue;
    }
    if (chunk.id) id = chunk.id;
    if (chunk.model) model = chunk.model;
    if (chunk.created) created = chunk.created;
    if (chunk.usage) usage = chunk.usage;
    const choice = chunk.choices?.[0];
    if (!choice) continue;
    if (choice.finish_reason) finishReason = choice.finish_reason;
    const delta = choice.delta || choice.message || {};
    if (typeof delta.content === "string") content += delta.content;
    if (typeof delta.reasoning_content === "string")
      reasoning += delta.reasoning_content;
  }

  if (!content && !reasoning && !usage) {
    // Nothing recognised: rethrow the raw JSON error so upstreamMessage reaches the client.
    return JSON.parse(text);
  }

  // ponytail: char/4 estimate when upstream omits usage. Swap for a real
  // tokenizer if billing disputes appear on thinking models.
  const promptTokens = usage?.prompt_tokens ?? 15;
  const completionTokens =
    usage?.completion_tokens ??
    Math.max(1, Math.round((content.length + reasoning.length) / 4));

  return {
    id,
    object: "chat.completion",
    created,
    model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content,
          ...(reasoning ? { reasoning_content: reasoning } : {}),
        },
        finish_reason: finishReason || "stop",
      },
    ],
    usage: usage || {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
    },
  };
}

/** Index just past the closing brace of the first balanced `{...}` object, or -1. */
function lastBalancedObjectEnd(text: string): number {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}
