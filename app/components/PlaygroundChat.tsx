"use client";

import { Terminal, ArrowUpRight } from "lucide-react";
import { formatModelName } from "@/lib/model-utils";

export interface ChatMessage {
  text: string;
  user: boolean;
  model?: string;
  tokens?: number;
  rateInfo?: string;
  latencyMs?: number;
}

export function PlaygroundChat({
  messages,
  replying,
  chatRef,
  isAdmin = false,
  onPickPrompt,
}: {
  messages: ChatMessage[];
  replying: boolean;
  chatRef: React.RefObject<HTMLDivElement | null>;
  isAdmin?: boolean;
  onPickPrompt: (p: string) => void;
}) {
  const suggestions = [
    "Jelaskan arsitektur reverse proxy AI gateway",
    "Buatkan kode koneksi TiDB Serverless di Next.js",
    "Apa keuntungan sliding window rate limit?",
  ];

  return (
    <div
      className="chat-area"
      ref={chatRef as any}
      role="log"
      aria-label="Percakapan Playground"
      aria-live="polite"
      aria-busy={replying}
    >
      {messages.length === 0 ? (
        <div className="chat-empty">
          <div className="chat-logo">
            <Terminal size={28} />
          </div>
          <h2>Apa yang ingin Anda tanyakan?</h2>
          <p>
            Uji prompt ke model AI nyata melalui gateway KiosAI secara live.
          </p>
          <div className="prompt-suggestions">
            {suggestions.map((p) => (
              <button onClick={() => onPickPrompt(p)} key={p}>
                {p}
                <ArrowUpRight size={14} />
              </button>
            ))}
          </div>
        </div>
      ) : (
        messages.map((m, i) => (
          <div key={i} className={`message ${m.user ? "user" : ""}`}>
            <span className="message-label">
              {m.user ? "ANDA" : (m.model ? formatModelName(m.model, isAdmin).toUpperCase() : "AI")}
            </span>
            <p style={{ whiteSpace: "pre-wrap" }}>{m.text}</p>
            {!m.user && (
              <small>
                {m.tokens ? `${m.tokens} token` : "Live response"}
                {m.rateInfo ? ` · ${m.rateInfo}` : ""}
                {m.latencyMs ? ` · ${m.latencyMs}ms` : ""}
              </small>
            )}
          </div>
        ))
      )}
      {replying && (
        <div className="skeleton-message">
          <span />
          <span />
          <span />
        </div>
      )}
    </div>
  );
}
export default PlaygroundChat;
