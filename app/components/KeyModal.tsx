"use client";

import { useState } from "react";
import { X, Copy, Plus, Check } from "lucide-react";
import { Button, Input } from "./ui";

export function KeyModal({
  mode,
  keyToRevoke,
  userId,
  onClose,
  onKeyCreated,
  onKeyRevoked,
  onCopy,
}: {
  mode: "create" | "revoke";
  keyToRevoke?: any;
  userId: string;
  onClose: () => void;
  onKeyCreated: () => void;
  onKeyRevoked: () => void;
  onCopy: (t: string) => void;
}) {
  const [keyName, setKeyName] = useState("");
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
        body: JSON.stringify({ userId, name: keyName.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.apiKey) {
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
      const res = await fetch(`/api/keys/${keyToRevoke.id}`, {
        method: "DELETE",
      });
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
      <section
        role="dialog"
        aria-modal="true"
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button aria-label="Tutup" className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        {mode === "revoke" ? (
          <div>
            <span className="eyebrow">API KEYS / REVOKE</span>
            <h2>Cabut kunci ini?</h2>
            <p>
              Akses untuk <strong>{keyToRevoke?.name || "API Key"}</strong> akan dinonaktifkan secara permanen di TiDB.
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
            <p>Beri nama agar kunci Anda mudah dikenali di aplikasi Anda.</p>
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
            <Button
              kind="primary"
              type="submit"
              loading={loading}
              disabled={!keyName.trim()}
              style={{ marginTop: "16px", width: "100%" }}
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
