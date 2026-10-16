import { deductTokens, logUsage } from "./keys";
import { calculateTokenCost } from "./model-pricing";
import { releaseStreamSlot } from "./ratelimit";

export interface BilledStreamOptions {
  reader: ReadableStreamDefaultReader<Uint8Array>;
  userId: string;
  keyId: string;
  model: string;
  startTime: number;
  rawPromptEstimate?: number;
}

/**
 * Creates an SSE stream that tracks token usage and protects against
 * premature client stream disconnection (stream abort exploitation).
 */
export function createBilledStream(options: BilledStreamOptions): ReadableStream {
  const { reader, userId, keyId, model, startTime, rawPromptEstimate = 15 } = options;
  const decoder = new TextDecoder();
  let buf = "";
  let usage: { prompt_tokens?: number; completion_tokens?: number } | null = null;
  let deltas = 0;
  let accumulatedChars = 0;
  let settled = false;

  const settleBilling = async (isAborted: boolean = false) => {
    if (settled) return;
    settled = true;
    releaseStreamSlot(keyId);

    const promptTokens = usage?.prompt_tokens ?? rawPromptEstimate;
    const estCompletion = Math.max(1, deltas, Math.ceil(accumulatedChars / 3.5));
    const completionTokens = usage?.completion_tokens ?? estCompletion;
    const actualCost = calculateTokenCost(model, promptTokens, completionTokens);

    try {
      await deductTokens(userId, actualCost, 1.0);
      await logUsage({
        apiKeyId: keyId,
        userId,
        model,
        promptTokens,
        completionTokens,
        latencyMs: Date.now() - startTime,
        statusCode: isAborted ? 499 : 200,
      });
    } catch {
      // Suppress background logging errors on client abort
    }
  };

  return new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          await settleBilling(false);
          return;
        }

        accumulatedChars += value.byteLength;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
          try {
            const j = JSON.parse(line.slice(6));
            if (j.usage) usage = j.usage;
            if (j.choices?.[0]?.delta) deltas++;
          } catch {}
        }

        controller.enqueue(value);
      } catch (err) {
        controller.error(err);
        await settleBilling(true);
      }
    },
    async cancel(reason) {
      try {
        await reader.cancel(reason);
      } catch {}
      await settleBilling(true);
    },
  });
}
