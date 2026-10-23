import { deductTokens, logUsage } from "./keys";
import { calculateTokenCost } from "./model-pricing";
import { releaseStreamSlot } from "./ratelimit";
import { maskModelInSseChunk } from "./prompt-defense";

export interface BilledStreamOptions {
  reader: ReadableStreamDefaultReader<Uint8Array>;
  userId: string;
  keyId: string;
  model: string;
  startTime: number;
  rawPromptEstimate?: number;
  onSettled?: (cost: number) => void;
}

// SSE stream parser with token metering, chunk boundary buffering, and usage settlement
export function createBilledStream(options: BilledStreamOptions): ReadableStream {
  const { reader, userId, keyId, model, startTime, rawPromptEstimate = 15, onSettled } = options;
  const decoder = new TextDecoder();
  let lineBuf = "";
  let usage: { prompt_tokens?: number; completion_tokens?: number } | null = null;
  let deltas = 0;
  let pureContentChars = 0;
  let settled = false;

  const processLine = (rawLine: string) => {
    const line = rawLine.trim();
    if (!line.startsWith("data:")) return;
    const payloadStr = line.slice(5).trim();
    if (!payloadStr || payloadStr === "[DONE]") return;

    try {
      const parsed = JSON.parse(payloadStr);
      if (parsed.usage && typeof parsed.usage.prompt_tokens === "number") {
        usage = parsed.usage;
      }
      const delta = parsed.choices?.[0]?.delta;
      if (delta) {
        deltas++;
        if (typeof delta.content === "string") pureContentChars += delta.content.length;
        if (typeof delta.reasoning_content === "string") pureContentChars += delta.reasoning_content.length;
        if (Array.isArray(delta.tool_calls)) {
          for (const tc of delta.tool_calls) {
            if (typeof tc?.function?.arguments === "string") pureContentChars += tc.function.arguments.length;
          }
        }
      }
    } catch {}
  };

  const settleBilling = async (isAborted: boolean = false) => {
    if (settled) return;
    settled = true;
    releaseStreamSlot(keyId);

    if (lineBuf.length > 0) {
      processLine(lineBuf);
      lineBuf = "";
    }

    const promptTokens = usage?.prompt_tokens ?? rawPromptEstimate;
    const estCompletion = Math.max(1, deltas, Math.ceil(pureContentChars / 3.5));
    const completionTokens = usage?.completion_tokens ?? estCompletion;
    const actualCost = calculateTokenCost(model, promptTokens, completionTokens);

    try {
      await deductTokens(userId, actualCost, 1.0, keyId);
      onSettled?.(actualCost);
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

        const chunkText = decoder.decode(value, { stream: true });
        lineBuf += chunkText;
        let newlineIdx = lineBuf.indexOf("\n");
        while (newlineIdx !== -1) {
          const completeLine = lineBuf.slice(0, newlineIdx);
          lineBuf = lineBuf.slice(newlineIdx + 1);
          processLine(completeLine);
          newlineIdx = lineBuf.indexOf("\n");
        }

        if (lineBuf.length > 32768) lineBuf = "";
        const masked = maskModelInSseChunk(chunkText, model);
        controller.enqueue(new TextEncoder().encode(masked));
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
