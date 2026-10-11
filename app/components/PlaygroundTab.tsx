"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, AlertTriangle, Send } from "lucide-react";
import { Badge, Button } from "./ui";
import PlaygroundChat, { ChatMessage } from "./PlaygroundChat";
import PlaygroundLocked from "./PlaygroundLocked";

export function PlaygroundTab({
  models,
  userTier,
  balance,
  activeKey,
  onNavigatePackages,
  onRefreshUserData,
}: {
  models: any[];
  userTier: string;
  balance: number;
  activeKey: string;
  onNavigatePackages: () => void;
  onRefreshUserData: () => void;
}) {
  const [selectedModel, setSelectedModel] = useState("tokenharbor/deepseek-v4.1-flash:free");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replying, setReplying] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const currentModelObj = models.find((m) => m.id === selectedModel);
  const requiredTier = currentModelObj?.required_tier || "bronze";
  const tierWeight = { bronze: 0, silver: 1, gold: 2 };
  const userTierRank = tierWeight[userTier?.toLowerCase() as keyof typeof tierWeight] ?? 0;
  const reqTierRank = tierWeight[requiredTier?.toLowerCase() as keyof typeof tierWeight] ?? 0;
  const isLocked = reqTierRank > userTierRank;
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
      const apiKeyToUse = activeKey || storedKey || "kios-d085fc5f9fbfe35ff534433b531edfb0";
      const res = await fetch("/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKeyToUse}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: "user", content: userText }],
          stream: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || `HTTP ${res.status}`);
      }

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
      <div className="playground-toolbar">
        <div>
          <label htmlFor="model">MODEL</label>
          <select
            id="model"
            value={selectedModel}
            onChange={(e) => {
              setMessages([]);
              setErrorBanner(null);
              setSelectedModel(e.target.value);
            }}
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name || m.id} [{(m.required_tier || "bronze").toUpperCase()}]
                {!m.accessible ? " — terkunci" : ""}
              </option>
            ))}
          </select>
        </div>
        <Badge tier={requiredTier.toUpperCase()} />
        <Button kind="ghost" onClick={() => setMessages([])}>
          Chat baru <Plus size={16} />
        </Button>
      </div>

      <div className="playground-context">
        <span>Koneksi Live TiDB & 9Router</span>
        <code>
          Saldo {balance.toLocaleString("id-ID")} token · {multiplier.toFixed(1)}×
        </code>
      </div>

      {isLocked ? (
        <PlaygroundLocked
          model={selectedModel}
          requiredTier={requiredTier}
          onNavigatePackages={onNavigatePackages}
        />
      ) : (
        <>
          {errorBanner && (
            <div role="alert" className="warning-banner rate-banner">
              <AlertTriangle size={18} />
              <div>
                <strong>Peringatan Gateway</strong>
                <p>{errorBanner}</p>
              </div>
            </div>
          )}
          <PlaygroundChat
            messages={messages}
            replying={replying}
            chatRef={chatRef}
            onPickPrompt={(p) => setPrompt(p)}
          />
          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <textarea
              aria-label="Prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Tulis pesan Anda untuk model AI..."
              maxLength={4000}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <Button
              type="submit"
              kind="primary"
              aria-label="Kirim pesan"
              loading={replying}
              disabled={!prompt.trim() || replying}
            >
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
