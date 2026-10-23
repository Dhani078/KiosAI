"use client";

import { useState } from "react";
import { X, Copy, Check } from "lucide-react";
import { Button } from "./ui";

export function ModelSnippetModal({
  modelId,
  displayName,
  activeKey,
  onClose,
  onCopy,
}: {
  modelId: string;
  displayName: string;
  activeKey: string;
  onClose: () => void;
  onCopy: (t: string) => void;
}) {
  const [tab, setTab] = useState<"cURL" | "Python" | "Node.js">("cURL");
  const displayKey = activeKey || "kios-YOUR_API_KEY";
  const baseUrl = typeof window !== "undefined" ? `${window.location.origin}/v1` : "http://localhost:3000/v1";

  const snippets = {
    cURL: `curl ${baseUrl}/chat/completions \\
  -H "Authorization: Bearer ***" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${modelId}",
    "messages": [{"role": "user", "content": "Halo TokoAI!"}]
  }'`,
    Python: `from openai import OpenAI

client = OpenAI(
  api_key="${displayKey}",
  base_url="${baseUrl}"
)

response = client.chat.completions.create(
  model="${modelId}",
  messages=[{"role": "user", "content": "Halo TokoAI!"}]
)

print(response.choices[0].message.content)`,
    "Node.js": `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: ***
  baseURL: "${baseUrl}"
});

const response = await client.chat.completions.create({
  model: "${modelId}",
  messages: [{ role: "user", content: "Halo TokoAI!" }]
});

console.log(response.choices[0].message.content);`,
  };

  const currentCode = snippets[tab];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section role="dialog" aria-modal="true" className="modal" style={{ maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
        <button aria-label="Tutup" className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <span className="eyebrow">INTEGRASI CEPAT</span>
        <h2>Integrasikan {displayName}</h2>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
          Cuplikan kode siap pakai untuk model <code>{modelId}</code>.
        </p>

        <div className="code-tabs" style={{ marginBottom: "12px" }}>
          <div className="code-tab-list" role="tablist">
            {(["cURL", "Python", "Node.js"] as const).map((t) => (
              <button
                key={t}
                className={tab === t ? "active" : ""}
                onClick={() => setTab(t)}
                role="tab"
                aria-selected={tab === t}
              >
                {t}
              </button>
            ))}
          </div>
          <Button kind="ghost" onClick={() => onCopy(currentCode)}>
            <Copy size={14} /> Salin
          </Button>
        </div>

        <pre style={{ padding: "14px", background: "var(--canvas)", borderRadius: "var(--radius-input)", border: "1px solid var(--border)", overflowX: "auto", fontSize: "12px" }}>
          <code>{currentCode}</code>
        </pre>

        <Button kind="primary" style={{ width: "100%", marginTop: "16px" }} onClick={onClose}>
          Selesai <Check size={16} />
        </Button>
      </section>
    </div>
  );
}

export default ModelSnippetModal;
