"use client";

import { useState } from "react";
import { Terminal, Copy, Check, Search, X, Download } from "lucide-react";
import { Badge, Button } from "./ui";
import { formatModelName } from "@/lib/model-utils";
import { getModelPricing } from "@/lib/model-pricing";
import EnvExportModal from "./EnvExportModal";

export function DocsTab({
  models,
  activeKey,
  isAdmin = false,
  onCopy,
}: {
  models: any[];
  activeKey: string;
  isAdmin?: boolean;
  onCopy: (t: string) => void;
}) {
  const [codeTab, setCodeTab] = useState<"cURL" | "Python" | "Node.js" | "Cline / .env">("cURL");
  const [selectedDocModel, setSelectedDocModel] = useState("tokenharbor/deepseek-v4.1-flash:free");
  const [search, setSearch] = useState("");
  const [showEnvModal, setShowEnvModal] = useState(false);
  const displayKey = activeKey || "kios-YOUR_API_KEY";
  const baseUrl = typeof window !== "undefined" ? `${window.location.origin}/v1` : "http://localhost:3000/v1";

  const codeSnippets = {
    cURL: `curl ${baseUrl}/chat/completions \\
  -H "Authorization: Bearer ***" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${selectedDocModel}",
    "messages": [{"role": "user", "content": "Halo TokoAI!"}]
  }'`,
    Python: `from openai import OpenAI

client = OpenAI(
    api_key="${displayKey}",
    base_url="${baseUrl}"
)

response = client.chat.completions.create(
    model="${selectedDocModel}",
    messages=[{"role": "user", "content": "Halo TokoAI!"}]
)

print(response.choices[0].message.content)`,
    "Node.js": `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: ***
  baseURL: "${baseUrl}"
});

const response = await client.chat.completions.create({
  model: "${selectedDocModel}",
  messages: [{ role: "user", content: "Halo TokoAI!" }]
});

console.log(response.choices[0].message.content);`,
    "Cline / .env": `# Konfigurasi VS Code (Cline / Roo Code / Next.js AI SDK)
OPENAI_BASE_URL="${baseUrl}"
OPENAI_API_KEY="${displayKey}"
MODEL="${selectedDocModel}"`,
  };

  const currentCode = codeSnippets[codeTab];

  return (
    <>
      <div className="docs-intro">
        <div>
          <span className="eyebrow">OPENAI-COMPATIBLE</span>
          <h2>API yang sudah Anda kenal.</h2>
          <p>
            Gunakan SDK OpenAI resmi di bahasa apa saja. Cukup ganti base URL dan API key.
          </p>
        </div>
        <Terminal size={44} />
      </div>

      <div className="base-url">
        <span>BASE URL</span>
        <code>{baseUrl}</code>
        <div style={{ display: "flex", gap: "6px" }}>
          <Button kind="ghost" onClick={() => onCopy(baseUrl)} aria-label="Salin base URL"><Copy size={16} /></Button>
          <Button kind="secondary" style={{ height: "30px", fontSize: "11px", padding: "0 10px" }} onClick={() => setShowEnvModal(true)}>
            <Download size={14} /> .env
          </Button>
        </div>
      </div>

      <section className="code-panel">
        <div className="code-tabs">
          <div className="code-tab-list" role="tablist">
            {(["cURL", "Python", "Node.js", "Cline / .env"] as const).map((t) => (
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
            <Copy size={15} /> Salin kode
          </Button>
        </div>
        <pre id="code-example" tabIndex={0}>
          <code>{currentCode}</code>
        </pre>
      </section>

      <section className="panel docs-models">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
          <div>
            <h2>Model aktif dari gateway ({models.filter((m) => m.id !== "combomaut").length})</h2>
            <span className="muted" style={{ fontSize: "12px" }}>Klik model untuk memperbarui contoh kode</span>
          </div>
          <div style={{ position: "relative", width: "220px", maxWidth: "100%" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari model..."
              style={{ width: "100%", padding: "6px 26px 6px 28px", fontSize: "12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-input)", color: "var(--text)" }}
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label="Reset pencarian" style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "2px" }}>
                <X size={12} />
              </button>
            )}
          </div>
        </div>
        {models
          .filter((m) => {
            if (m.id === "combomaut") return false;
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            return m.id.toLowerCase().includes(q) || formatModelName(m.id, isAdmin).toLowerCase().includes(q);
          })
          .map((m) => {
            const cleanId = formatModelName(m.id, isAdmin);
            const isSelected = m.id === selectedDocModel;
            const pricing = getModelPricing(m.id);
            const tLabel = (m.required_tier === "free" ? "FREE" : "PRO");
            return (
              <div
                className="doc-model"
                key={m.id}
                onClick={() => setSelectedDocModel(m.id)}
                style={{ cursor: "pointer", border: isSelected ? "1px solid var(--primary)" : undefined, background: isSelected ? "rgba(242, 140, 56, 0.08)" : undefined, transition: "all 0.15s ease" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {isSelected && <Check size={14} style={{ color: "var(--primary)" }} />}
                  <code>{cleanId}</code>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="muted" style={{ fontSize: "11px" }}>In ${pricing.input} · Out ${pricing.output}</span>
                  <Badge tier={tLabel} />
                </div>
              </div>
            );
          })}
      </section>

      <div className="error-docs">
        <h2>Menangani respons error</h2>
        <div>
          <code>429 · rate_limit_exceeded</code>
          <p>Terlalu banyak permintaan dalam 60 detik. Cek header <strong>Retry-After</strong> sebelum mencoba lagi.</p>
        </div>
        <div>
          <code>401 / 402 · invalid_key / balance_exhausted</code>
          <p>API Key salah atau saldo token habis. Top up paket di menu Beli Token untuk melanjutkan pemakaian.</p>
        </div>
      </div>

      <EnvExportModal
        isOpen={showEnvModal}
        onClose={() => setShowEnvModal(false)}
        baseUrl={baseUrl}
        activeKey={activeKey}
        selectedModel={selectedDocModel}
        onCopy={onCopy}
      />
    </>
  );
}

export default DocsTab;
