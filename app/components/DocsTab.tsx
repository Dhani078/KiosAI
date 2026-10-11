"use client";

import { useState } from "react";
import { Terminal, Copy } from "lucide-react";
import { Badge, Button } from "./ui";

export function DocsTab({
  models,
  activeKey,
  onCopy,
}: {
  models: any[];
  activeKey: string;
  onCopy: (t: string) => void;
}) {
  const [codeTab, setCodeTab] = useState<"cURL" | "Python" | "Node.js">("cURL");
  const displayKey = activeKey || "kios-YOUR_API_KEY";
  const baseUrl = "http://localhost:3000/v1";

  const codeSnippets = {
    cURL: `curl ${baseUrl}/chat/completions \\
  -H "Authorization: Bearer ${displayKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "tokenharbor/deepseek-v4.1-flash:free",
    "messages": [{"role": "user", "content": "Halo KiosAI!"}]
  }'`,
    Python: `from openai import OpenAI

client = OpenAI(
    api_key="${displayKey}",
    base_url="${baseUrl}"
)

response = client.chat.completions.create(
    model="tokenharbor/deepseek-v4.1-flash:free",
    messages=[{"role": "user", "content": "Halo KiosAI!"}]
)

print(response.choices[0].message.content)`,
    "Node.js": `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "${displayKey}",
  baseURL: "${baseUrl}"
});

const response = await client.chat.completions.create({
  model: "tokenharbor/deepseek-v4.1-flash:free",
  messages: [{ role: "user", content: "Halo KiosAI!" }]
});

console.log(response.choices[0].message.content);`,
  };

  const currentCode = codeSnippets[codeTab];

  return (
    <>
      <div className="docs-intro">
        <div>
          <span className="eyebrow">OPENAI-COMPATIBLE</span>
          <h2>API yang sudah Anda kenal.</h2>
          <p>
            Gunakan SDK OpenAI resmi di bahasa pemrograman apa saja. Cukup ganti base URL dan API key.
          </p>
        </div>
        <Terminal size={44} />
      </div>

      <div className="base-url">
        <span>BASE URL</span>
        <code>{baseUrl}</code>
        <Button
          kind="ghost"
          onClick={() => onCopy(baseUrl)}
          aria-label="Salin base URL"
        >
          <Copy size={16} />
        </Button>
      </div>

      <section className="code-panel">
        <div className="code-tabs">
          <div className="code-tab-list" role="tablist">
            {(["cURL", "Python", "Node.js"] as const).map((t) => (
              <button
                key={t}
                className={codeTab === t ? "active" : ""}
                onClick={() => setCodeTab(t)}
                role="tab"
                aria-selected={codeTab === t}
              >
                {t}
              </button>
            ))}
          </div>
          <Button kind="ghost" onClick={() => onCopy(currentCode)}>
            <Copy size={15} />
            Salin kode
          </Button>
        </div>
        <pre id="code-example" tabIndex={0}>
          <code>{currentCode}</code>
        </pre>
      </section>

      <section className="panel docs-models">
        <h2>Model aktif dari gateway</h2>
        {models.map((m) => (
          <div className="doc-model" key={m.id}>
            <code>{m.id}</code>
            <Badge tier={(m.required_tier || "bronze").toUpperCase()} />
          </div>
        ))}
      </section>

      <div className="error-docs">
        <h2>Menangani respons error</h2>
        <div>
          <code>429 · rate_limit_exceeded</code>
          <p>
            Terlalu banyak permintaan dalam 60 detik. Cek header <strong>Retry-After</strong> sebelum mencoba lagi.
          </p>
        </div>
        <div>
          <code>403 · tier_restricted</code>
          <p>
            Model memerlukan paket lebih tinggi. Upgrade paket di menu Beli Token untuk membuka akses.
          </p>
        </div>
      </div>
    </>
  );
}
export default DocsTab;
