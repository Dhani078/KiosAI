"use client";

import { useState } from "react";
import { X, Copy, Check, Download, Terminal } from "lucide-react";
import { Button } from "./ui";

export function EnvExportModal({
  isOpen,
  onClose,
  baseUrl,
  activeKey,
  selectedModel = "tokenharbor/deepseek-v4.1-flash:free",
  onCopy,
}: {
  isOpen: boolean;
  onClose: () => void;
  baseUrl: string;
  activeKey: string;
  selectedModel?: string;
  onCopy?: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const displayKey = activeKey || "kios-YOUR_API_KEY";

  if (!isOpen) return null;

  const envContent = `# TokoAI Production Environment Config
OPENAI_BASE_URL="${baseUrl}"
OPENAI_API_KEY="${displayKey}"
AI_MODEL="${selectedModel}"

# Cline & Roo Code Custom Provider Config
# Provider: OpenAI Compatible
# Base URL: ${baseUrl}
# API Key : ${displayKey}
# Model ID: ${selectedModel}
`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(envContent);
    onCopy?.(envContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([envContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = ".env.local";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section role="dialog" aria-modal="true" className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
        <button aria-label="Tutup" className="modal-close" onClick={onClose}><X size={20} /></button>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <Terminal size={22} style={{ color: "var(--primary)" }} />
          <h2 style={{ margin: 0 }}>Ekspor Konfigurasi .env</h2>
        </div>
        <p className="muted" style={{ fontSize: "13px", margin: "0 0 16px" }}>
          Gunakan file konfigurasi ini langsung di VS Code, Cursor, Cline, Next.js, atau skrip Python lokal Anda.
        </p>

        <pre style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-input)", padding: "12px", fontSize: "12px", fontFamily: "var(--font-mono)", overflowX: "auto", margin: "0 0 16px", color: "var(--text)" }}>
          <code>{envContent}</code>
        </pre>

        <div style={{ display: "flex", gap: "10px" }}>
          <Button kind="primary" onClick={handleDownload} style={{ flex: 1 }}>
            <Download size={15} /> Unduh .env.local
          </Button>
          <Button kind="secondary" onClick={handleCopy} style={{ flex: 1 }}>
            {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Tersalin!" : "Salin Teks"}
          </Button>
        </div>
      </section>
    </div>
  );
}

export default EnvExportModal;
