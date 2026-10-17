export async function streamPlaygroundCompletion(params: {
  apiKey: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
  onChunk: (delta: string) => void;
  signal?: AbortSignal;
}): Promise<{ text: string; tokensEstimate: number }> {
  const { apiKey, model, messages, onChunk, signal } = params;

  const res = await fetch("/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, stream: true }),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text();
    let errJson: any;
    try { errJson = JSON.parse(errText); } catch {}
    throw new Error(errJson?.error?.message || errJson?.error || `HTTP ${res.status}: ${errText.slice(0, 100)}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("Stream response body tidak dapat dibaca");

  const decoder = new TextDecoder();
  let fullText = "";
  let lineBuf = "";
  let deltas = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    lineBuf += decoder.decode(value, { stream: true });
    const lines = lineBuf.split("\n");
    lineBuf = lines.pop() || "";

    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith("data:")) continue;
      const dataStr = line.slice(5).trim();
      if (!dataStr || dataStr === "[DONE]") continue;

      try {
        const parsed = JSON.parse(dataStr);
        const delta = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.delta?.reasoning_content || "";
        if (delta) {
          fullText += delta;
          deltas++;
          onChunk(delta);
        }
      } catch {}
    }
  }

  const estTokens = Math.max(1, Math.ceil(fullText.length / 3.8));
  return { text: fullText, tokensEstimate: estTokens };
}
