"use client";

import { useState } from "react";
import { X, Sparkles, Send, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Button, Input } from "./ui";

export function QuickTestModal({
  modelId,
  displayName,
  activeKey,
  onClose,
  onNavigatePlayground,
}: {
  modelId: string;
  displayName: string;
  activeKey: string;
  onClose: () => void;
  onNavigatePlayground?: (modelId: string) => void;
}) {
  const [prompt, setPrompt] = useState("Halo! Berikan perkenalan singkat tentang kemampuanmu dalam 2 kalimat.");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  const handleTest = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResponse("");
    setLatencyMs(null);

    const start = Date.now();
    try {
      let keyToUse = activeKey && !activeKey.endsWith("...") ? activeKey : "";
      if (!keyToUse) {
        const stored = typeof window !== "undefined"
          ? (sessionStorage.getItem("kios_last_raw_key") || sessionStorage.getItem("kios_playground_key"))
          : null;
        if (stored && !stored.endsWith("...")) {
          keyToUse = stored;
        } else {
          try {
            const userRes = await fetch("/api/user");
            if (userRes.ok) {
              const uData = await userRes.json();
              if (uData.playgroundKey) {
                keyToUse = uData.playgroundKey;
                if (typeof window !== "undefined") sessionStorage.setItem("kios_playground_key", uData.playgroundKey);
              }
            }
          } catch {}
        }
      }

      const res = await fetch("/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(keyToUse ? { Authorization: `Bearer ${keyToUse}` } : {}),
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: "user", content: prompt.trim() }],
          max_tokens: 300,
        }),
      });

      const data = await res.json();
      setLatencyMs(Date.now() - start);

      if (!res.ok) {
        throw new Error(data.error?.message || data.error || `HTTP ${res.status}`);
      }

      const text = data.choices?.[0]?.message?.content || "(Tidak ada respon)";
      setResponse(text);
    } catch (err: any) {
      setError(err.message || "Gagal memproses pengujian");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section role="dialog" aria-modal="true" className="modal" style={{ maxWidth: "600px", display: "flex", flexDirection: "column", gap: "14px" }} onClick={(e) => e.stopPropagation()}>
        <button aria-label="Tutup" className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div>
          <span className="eyebrow">UJI CEPAT MODEL</span>
          <h2 style={{ margin: "4px 0 2px", fontSize: "18px" }}>Tes {displayName}</h2>
          <code style={{ fontSize: "11px", color: "var(--text-muted)" }}>{modelId}</code>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <Input
            id="quick-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleTest(); } }}
            placeholder="Tulis prompt uji..."
            style={{ flex: 1 }}
          />
          <Button kind="primary" onClick={handleTest} loading={loading} style={{ padding: "0 14px", height: "38px" }}>
            <Send size={14} /> Kirim
          </Button>
        </div>

        {error && (
          <div style={{ padding: "10px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid var(--error)", borderRadius: "var(--radius-input)", color: "var(--error)", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {response && (
          <div style={{ padding: "12px", background: "var(--canvas)", border: "1px solid var(--border)", borderRadius: "var(--radius-input)", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--text-muted)" }}>
              <span style={{ color: "var(--success)", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                <CheckCircle2 size={12} /> Berhasil
              </span>
              {latencyMs !== null && <span>Latensi: {latencyMs}ms</span>}
            </div>
            <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.5", whiteSpace: "pre-wrap", color: "var(--foreground)" }}>
              {response}
            </p>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px", paddingTop: "8px", borderTop: "1px solid var(--border)" }}>
          {onNavigatePlayground ? (
            <button
              type="button"
              onClick={() => { onClose(); onNavigatePlayground(modelId); }}
              style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", padding: 0 }}
            >
              Buka di Playground Penuh <ArrowRight size={13} />
            </button>
          ) : <span />}
          <Button kind="secondary" onClick={onClose} style={{ height: "32px", fontSize: "12px" }}>
            Tutup
          </Button>
        </div>
      </section>
    </div>
  );
}

export default QuickTestModal;
