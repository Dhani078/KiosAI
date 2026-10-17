"use client";

import { useState } from "react";
import { Terminal, Copy, Check } from "lucide-react";
import { Button } from "@/app/components/ui";

export function CodeSection() {
  const [tab, setTab] = useState<"cURL" | "Python" | "Node.js">("Python");
  const [copied, setCopied] = useState(false);

  const snippets = {
    Python: `from openai import OpenAI

# Cukup arahkan baseURL ke TokoAI dan gunakan API key Anda
client = OpenAI(
    api_key="toko-xxxxxxxxxxxxxxxxxxxxxxxx",
    base_url="https://tokoai.my.id/v1"
)

response = client.chat.completions.create(
    model="deepseek-v4.1-flash",
    messages=[{"role": "user", "content": "Halo TokoAI, buatkan fungsi sorting!"}],
    stream=True
)

for chunk in response:
    print(chunk.choices[0].delta.content or "", end="")`,
    "Node.js": `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: ***
  baseURL: "https://tokoai.my.id/v1"
});

const stream = await client.chat.completions.create({
  model: "deepseek-v4.1-flash",
  messages: [{ role: "user", content: "Halo TokoAI!" }],
  stream: true
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || "");
}`,
    cURL: `curl https://tokoai.my.id/v1/chat/completions \\
  -H "Authorization: Bearer ***" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "deepseek-v4.1-flash",
    "messages": [{"role": "user", "content": "Halo TokoAI!"}],
    "stream": true
  }'`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[tab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="integrasi" style={{ padding: "80px 24px", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <span className="eyebrow" style={{ color: "var(--primary)" }}>INTEGRASI SUPER MUDAH</span>
        <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", marginTop: "8px", fontWeight: 700 }}>
          Hanya Perlu 3 Baris Perubahan Kode
        </h2>
        <p className="muted" style={{ maxWidth: "560px", margin: "12px auto 0", fontSize: "15px" }}>
          Tidak perlu menginstall SDK baru. Library OpenAI yang sudah Anda miliki langsung kompatibel.
        </p>
      </div>

      <div className="code-panel">
        <div className="code-tabs">
          <div className="code-tab-list" role="tablist">
            {(["Python", "Node.js", "cURL"] as const).map((t) => (
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
          <Button kind="ghost" onClick={handleCopy}>
            {copied ? <Check size={15} style={{ color: "var(--success)" }} /> : <Copy size={15} />}
            {copied ? "Tersalin!" : "Salin Kode"}
          </Button>
        </div>
        <pre id="code-snippet-pre" tabIndex={0} style={{ margin: 0, padding: "20px 24px", overflowX: "auto" }}>
          <code>{snippets[tab]}</code>
        </pre>
      </div>
    </section>
  );
}
export default CodeSection;
