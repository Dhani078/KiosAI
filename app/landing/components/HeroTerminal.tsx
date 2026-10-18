"use client";

import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";

export function HeroTerminal() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"bash" | "python" | "node">("python");

  const snippets = {
    python: `from openai import OpenAI

client = OpenAI(
    api_key="kios-live-xxxx",
    base_url="https://tokoai.my.id/v1"
)

stream = client.chat.completions.create(
    model="deepseek-v4.1-flash",
    messages=[{"role": "user", "content": "Halo TokoAI!"}],
    stream=True
)
for chunk in stream:
    print(chunk.choices[0].delta.content or "", end="")`,
    node: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "kios-live-xxxx",
  baseURL: "https://tokoai.my.id/v1"
});

const res = await client.chat.completions.create({
  model: "deepseek-v4.1-flash",
  messages: [{ role: "user", content: "Halo TokoAI!" }]
});
console.log(res.choices[0].message.content);`,
    bash: `curl https://tokoai.my.id/v1/chat/completions \\
  -H "Authorization: Bearer kios-live-xxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "deepseek-v4.1-flash",
    "messages": [{"role": "user", "content": "Halo TokoAI!"}]
  }'`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        marginTop: "32px",
        borderRadius: "var(--radius-card)",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
        overflow: "hidden",
        textAlign: "left",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          borderBottom: "1px solid var(--border)",
          background: "var(--canvas)",
          fontSize: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#E5533D" }} />
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#F5C542" }} />
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#4FBF7A" }} />
          </div>
          <div style={{ display: "flex", gap: "6px", marginLeft: "8px" }}>
            {(["python", "node", "bash"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setActiveTab(lang)}
                style={{
                  background: activeTab === lang ? "var(--surface)" : "transparent",
                  color: activeTab === lang ? "var(--primary)" : "var(--text-muted)",
                  border: activeTab === lang ? "1px solid var(--border)" : "1px solid transparent",
                  borderRadius: "4px",
                  padding: "3px 10px",
                  fontSize: "11px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                {lang === "node" ? "Node.js" : lang}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--success)",
              fontSize: "11px",
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--success)" }} />
            tokyo-hnd1 · 18ms
          </span>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              background: "transparent",
              border: "none",
              color: copied ? "var(--success)" : "var(--text-muted)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              cursor: "pointer",
            }}
            aria-label="Salin kode gateway"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Tersalin" : "Salin"}
          </button>
        </div>
      </div>

      <div style={{ padding: "16px 20px", overflowX: "auto" }}>
        <pre
          style={{
            margin: 0,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "13px",
            lineHeight: 1.6,
            color: "var(--text)",
          }}
        >
          <code>{snippets[activeTab]}</code>
        </pre>
      </div>

      <div
        style={{
          borderTop: "1px solid var(--border)",
          background: "var(--canvas)",
          padding: "10px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "11px",
          color: "var(--text-muted)",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <Terminal size={13} style={{ color: "var(--primary)" }} />
          Status response: HTTP 200 OK · TTFT 142ms · 70+ model aktif
        </span>
        <span style={{ fontFamily: "monospace", color: "var(--primary)" }}>
          100% Drop-in SDK
        </span>
      </div>
    </div>
  );
}

export default HeroTerminal;
