"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
  language: string;
  code: string;
}

function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ margin: "10px 0", borderRadius: "var(--radius-input)", overflow: "hidden", border: "1px solid var(--border)", background: "var(--surface)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 10px", background: "var(--canvas)", borderBottom: "1px solid var(--border)", fontSize: "11px", color: "var(--text-muted)" }}>
        <span style={{ textTransform: "uppercase", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{language || "CODE"}</span>
        <button onClick={handleCopy} style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", color: "var(--text)", cursor: "pointer", fontSize: "11px", padding: "2px 6px" }}>
          {copied ? <Check size={12} style={{ color: "var(--success)" }} /> : <Copy size={12} />}
          <span>{copied ? "Tersalin" : "Salin"}</span>
        </button>
      </div>
      <pre style={{ margin: 0, padding: "10px 12px", overflowX: "auto", fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text)", lineHeight: 1.5 }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function MarkdownMessage({ content }: { content: string }) {
  if (!content) return null;

  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div style={{ lineHeight: 1.6 }}>
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const firstLineBreak = part.indexOf("\n");
          if (firstLineBreak !== -1) {
            const lang = part.slice(3, firstLineBreak).trim();
            const code = part.slice(firstLineBreak + 1, -3);
            return <CodeBlock key={index} language={lang} code={code} />;
          }
          return <CodeBlock key={index} language="" code={part.slice(3, -3)} />;
        }
        return <p key={index} style={{ margin: "4px 0", whiteSpace: "pre-wrap" }}>{part}</p>;
      })}
    </div>
  );
}

export default MarkdownMessage;
