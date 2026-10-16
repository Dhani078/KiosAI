"use client";

import { useState } from "react";
import { X, Copy, Plus, Check } from "lucide-react";
import { Button, Input } from "./ui";

export function KeyModal({
  mode,
  keyToRevoke,
  userId,
  isAdmin = false,
  onClose,
  onKeyCreated,
  onKeyRevoked,
  onCopy,
}: {
  mode: "create" | "revoke";
  keyToRevoke?: any;
  userId: string;
  isAdmin?: boolean;
  onClose: () => void;
  onKeyCreated: () => void;
  onKeyRevoked: () => void;
  onCopy: (t: string) => void;
}) {
  const [keyName, setKeyName] = useState("");
  const [rateLimit, setRateLimit] = useState(60);
  const [maxSpendTokens, setMaxSpendTokens] = useState(0);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, name: keyName.trim(), rateLimit, maxSpendTokens }),
      });
      const data = await res.json();
      if (res.ok && data.apiKey) {
        sessionStorage.setItem("kios_last_raw_key", data.apiKey);
        setCreatedSecret(data.apiKey);
        onKeyCreated();
      } else {
        alert(data.error || "Gagal membuat key");
      }
    } catch (e: any) {
      alert(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeKey = async () => {
    if (!keyToRevoke?.id || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/keys/${keyToRevoke.id}`, { method: "DELETE" });
      if (res.ok) {
        onKeyRevoked();
        onClose();
      } else {
        alert("Gagal mencabut API key");
      }
    } catch (e: any) {
      alert(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section role="dialog" aria-modal="true" className="modal" onClick={(e) => e.stopPropagation()}>
        <button aria-label="Tutup" className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        {mode === "revoke" ? (
          <div>
            <span className="eyebrow">API KEYS / REVOKE</span>
            <h2>Cabut kunci ini?</h2>
            <p>
              Akses untuk <strong>{keyToRevoke?.name || "API Key"}</strong> akan dinonaktifkan secara permanen{isAdmin ? " di TiDB" : ""}.
            </p>
            <div className="modal-actions">
              <Button onClick={onClose}>Batal</Button>
              <Button className="danger" loading={loading} onClick={handleRevokeKey}>
                Ya, cabut kunci
              </Button>
            </div>
          </div>
        ) : createdSecret ? (
          <div>
            <span className="eyebrow">API KEYS / CREATED</span>
            <h2>API Key berhasil dibuat.</h2>
            <p>
              Salin kunci ini sekarang. Demi keamanan, kunci tidak akan ditampilkan lagi secara lengkap.
            </p>
            <div className="new-key-secret">
              <code>{createdSecret}</code>
            </div>
            <Button kind="primary" onClick={() => onCopy(createdSecret)}>
              <Copy size={16} /> Salin API key
            </Button>
            <Button kind="ghost" onClick={onClose} style={{ marginTop: "12px", width: "100%" }}>
              Selesai <Check size={16} />
            </Button>
          </div>
        ) : (
          <form onSubmit={handleCreateKey}>
            <span className="eyebrow">API KEYS</span>
            <h2>Buat kunci baru</h2>
            <p>Beri nama dan tentukan batas limit permintaan per menit.</p>
            <label htmlFor="key-name">Nama API key</label>
            <Input
              autoFocus
              required
              id="key-name"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="Contoh: Production App / Bot Telegram"
              maxLength={60}
            />
            <label htmlFor="key-limit" style={{ marginTop: "12px" }}>Batas Rate Limit</label>
            <select
              id="key-limit"
              value={rateLimit}
              onChange={(e) => setRateLimit(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "var(--radius-input)",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                fontSize: "13px",
                marginTop: "4px",
              }}
            >
              <option value={30}>30 req / menit (Testing)</option>
              <option value={60}>60 req / menit (Standar)</option>
              <option value={120}>120 req / menit (Production Tinggi)</option>
            </select>
            <label htmlFor="key-spend-cap" style={{ marginTop: "12px" }}>Batas Kuota Token (Spend Cap)</label>
            <select
              id="key-spend-cap"
              value={maxSpendTokens}
              onChange={(e) => setMaxSpendTokens(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "var(--radius-input)",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                fontSize: "13px",
                marginTop: "4px",
              }}
            >
              <option value={0}>Tanpa Batas (Mengikuti Saldo Akun)</option>
              <option value={500000}>500.000 Token (Uji Coba / Dev)</option>
              <option value={2000000}>2.000.000 Token (Bot Ringan)</option>
              <option value={10000000}>10.000.000 Token (Aplikasi Terbatas)</option>
            </select>
            <Button
              kind="primary"
              type="submit"
              loading={loading}
              disabled={!keyName.trim()}
              style={{ marginTop: "20px", width: "100%" }}
            >
              Buat API key <Plus size={16} />
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}
export default KeyModal;
