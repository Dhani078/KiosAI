"use client";

import { useState, useRef, useEffect } from "react";
import { AlertTriangle, Send, SlidersHorizontal } from "lucide-react";
import { Button } from "./ui";
import PlaygroundToolbar from "./PlaygroundToolbar";
import PlaygroundChat, { ChatMessage } from "./PlaygroundChat";
import PlaygroundLocked from "./PlaygroundLocked";

export function PlaygroundTab({
  models,
  userTier,
  balance,
  activeKey,
  isAdmin = false,
  onNavigatePackages,
  onRefreshUserData,
}: {
  models: any[];
  userTier: string;
  balance: number;
  activeKey: string;
  isAdmin?: boolean;
  onNavigatePackages: () => void;
  onRefreshUserData: () => void;
}) {
  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window !== "undefined") return sessionStorage.getItem("kios_selected_model") || "tokenharbor/deepseek-v4.1-flash:free";
    return "tokenharbor/deepseek-v4.1-flash:free";
  });
  const [systemPrompt, setSystemPrompt] = useState("");
  const [showSystem, setShowSystem] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(sessionStorage.getItem("kios_playground_messages") || "[]"); } catch { return []; }
  });
  const [replying, setReplying] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try { sessionStorage.setItem("kios_playground_messages", JSON.stringify(messages)); } catch {}
    }
  }, [messages]);

  const currentModelObj = models.find((m) => m.id === selectedModel);
  const requiredTier = currentModelObj?.required_tier || "bronze";
  const isLocked = false;
  const multiplier = requiredTier === "gold" ? 4.0 : requiredTier === "silver" ? 2.0 : 1.0;

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, replying]);

  const send = async () => {
    if (!prompt.trim() || replying || isLocked) return;
    if (balance < 100) {
      setErrorBanner("Saldo tidak cukup. Silakan isi ulang paket token.");
      return;
    }
    const userText = prompt.trim();
    setPrompt("");
    setErrorBanner(null);
    setMessages((prev) => [...prev, { text: userText, user: true }]);
    setReplying(true);

    const startTime = Date.now();
    try {
      const storedKey = typeof window !== "undefined" ? sessionStorage.getItem("kios_last_raw_key") : null;
      const apiKeyToUse = storedKey || activeKey;
      if (!apiKeyToUse) {
        throw new Error("Sesi API key belum siap. Silakan refresh halaman.");
      }
      const payloadMessages = [
        ...(systemPrompt.trim() ? [{ role: "system", content: systemPrompt.trim() }] : []),
        { role: "user", content: userText },
      ];

      const res = await fetch("/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKeyToUse}`,
        },
        body: JSON.stringify({ model: selectedModel, messages: payloadMessages, stream: false }),
      });

      const resText = await res.text();
      let data: any;
      try {
        data = JSON.parse(resText);
      } catch {
        throw new Error(resText.slice(0, 160) || `HTTP ${res.status}`);
      }
      if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);

      const replyContent = data.choices?.[0]?.message?.content || "(Tidak ada balasan)";
      const tokensUsed = data.usage?.total_tokens || 0;

      setMessages((prev) => [
        ...prev,
        {
          text: replyContent,
          user: false,
          model: selectedModel,
          tokens: tokensUsed,
          multiplier,
          latencyMs: Date.now() - startTime,
        },
      ]);
      onRefreshUserData();
    } catch (err: any) {
      setErrorBanner(err.message || "Gagal memanggil model AI.");
    } finally {
      setReplying(false);
    }
  };

  return (
    <section className="panel playground">
      <PlaygroundToolbar
        models={models}
        selectedModel={selectedModel}
        requiredTier={requiredTier}
        isAdmin={isAdmin}
        onSelectModel={(m) => { setMessages([]); setErrorBanner(null); setSelectedModel(m); }}
        onResetChat={() => {
          setMessages([]);
          if (typeof window !== "undefined") sessionStorage.removeItem("kios_playground_messages");
        }}
      />

      <div className="playground-context">
        <span>Koneksi Live TiDB & 9Router</span>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            className="text-link"
            onClick={() => setShowSystem(!showSystem)}
            style={{ fontSize: "11px", gap: "4px" }}
          >
            <SlidersHorizontal size={12} /> {showSystem ? "Tutup System Prompt" : "Atur System Prompt"}
          </button>
          <code>Saldo {balance.toLocaleString("id-ID")} token · {multiplier.toFixed(1)}×</code>
        </div>
      </div>

      {showSystem && (
        <div style={{ padding: "10px 24px", background: "var(--canvas)", borderBottom: "1px solid var(--border)" }}>
          <label htmlFor="sys-prompt" className="small-label" style={{ marginBottom: "4px", display: "block" }}>
            SYSTEM PROMPT (INSTRUKSI SISTEM)
          </label>
          <input
            id="sys-prompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Contoh: Jawab selalu dalam bahasa Indonesia singkat dan to the point."
            style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-input)", background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontSize: "13px" }}
          />
        </div>
      )}

      {isLocked ? (
        <PlaygroundLocked model={selectedModel} requiredTier={requiredTier} onNavigatePackages={onNavigatePackages} />
      ) : (
        <>
          {errorBanner && (
            <div role="alert" className="warning-banner rate-banner">
              <AlertTriangle size={18} />
              <div><strong>Peringatan Gateway</strong><p>{errorBanner}</p></div>
            </div>
          )}
          <PlaygroundChat messages={messages} replying={replying} chatRef={chatRef} isAdmin={isAdmin} onPickPrompt={(p) => setPrompt(p)} />
          <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <textarea
              aria-label="Prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Tulis pesan Anda untuk model AI..."
              maxLength={4000}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <Button type="submit" kind="primary" aria-label="Kirim pesan" loading={replying} disabled={!prompt.trim() || replying}>
              {!replying && <Send size={18} />}
            </Button>
          </form>
          <div className="chat-disclaimer">
            Enter untuk kirim · Shift + Enter untuk baris baru. Token asli terpotong di database TiDB.
          </div>
        </>
      )}
    </section>
  );
}
export default PlaygroundTab;
