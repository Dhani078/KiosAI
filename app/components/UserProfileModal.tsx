"use client";

import { useState } from "react";
import { X, Copy, Check, Bell, LogOut, Zap, Github, ShieldCheck, Sparkles, Send } from "lucide-react";
import { Button } from "./ui";

export function UserProfileModal({
  user,
  onClose,
  onLogout,
  onNavigatePackages,
  onCopy,
}: {
  user: any;
  onClose: () => void;
  onLogout: () => void;
  onNavigatePackages?: () => void;
  onCopy?: (text: string) => void;
}) {
  const [webhookUrl, setWebhookUrl] = useState(user?.alert_webhook_url || "");
  const [savingAlert, setSavingAlert] = useState(false);
  const [alertSaved, setAlertSaved] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const handleSaveAlert = async () => {
    if (!user?.id) return;
    setSavingAlert(true);
    try {
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, alertWebhookUrl: webhookUrl.trim() }),
      });
      setAlertSaved(true);
      setTimeout(() => setAlertSaved(false), 2000);
    } catch {} finally {
      setSavingAlert(false);
    }
  };

  const handleTestAlert = async () => {
    if (!webhookUrl.trim()) return;
    setTestSent(true);
    try {
      await fetch(webhookUrl.trim(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "🔔 [TokoAI Test] Webhook alert saldo Anda terhubung dengan sukses!" }),
      }).catch(() => {});
      setTimeout(() => setTestSent(false), 2500);
    } catch {
      setTestSent(false);
    }
  };

  const handleCopyId = () => {
    if (!user?.id) return;
    navigator.clipboard?.writeText(user.id);
    onCopy?.(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const isPro = String(user?.tier || "").toLowerCase() === "pro";
  const provider = user?.oauth_provider || (user?.email?.includes("google") ? "google" : "email");
  const initials = (user?.full_name || user?.email || "U").slice(0, 2).toUpperCase();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section role="dialog" aria-modal="true" className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px", padding: "24px" }}>
        <button aria-label="Tutup" className="modal-close" onClick={onClose}><X size={20} /></button>

        {/* Profile Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
          <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "rgba(242, 140, 56, 0.12)", border: "2px solid var(--primary)", overflow: "hidden", display: "grid", placeItems: "center", fontSize: "18px", fontWeight: 700, color: "var(--primary)", flexShrink: 0, boxShadow: "0 0 16px rgba(242, 140, 56, 0.25)" }}>
            {user?.avatar_url ? <img src={user.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.full_name || "Pengguna TokoAI"}</h2>
              <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "999px", background: isPro ? "rgba(242, 140, 56, 0.15)" : "var(--border)", color: isPro ? "var(--primary)" : "var(--text-muted)", fontWeight: 700, border: `1px solid ${isPro ? "rgba(242, 140, 56, 0.4)" : "var(--border)"}` }}>
                {isPro ? "PRO" : "FREE"}
              </span>
            </div>
            <p className="muted" style={{ margin: "3px 0 0", fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email}</p>
          </div>
        </div>

        {/* Connection pill */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "999px", background: "var(--surface)", border: "1px solid var(--border)", fontSize: "11px", color: "var(--text-muted)", marginBottom: "16px" }}>
          {provider === "google" && <svg width="12" height="12" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/><path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"/><path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"/></svg>}
          {provider === "github" && <Github size={12} />}
          <span>Terhubung via {provider === "google" ? "Google Account" : provider === "github" ? "GitHub" : "Email & Password"}</span>
          <ShieldCheck size={12} style={{ color: "var(--success)" }} />
        </div>

        {/* Dual Wallet Display */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
          <div style={{ padding: "12px 14px", background: "rgba(242, 140, 56, 0.05)", border: "1px solid rgba(242, 140, 56, 0.25)", borderRadius: "var(--radius-input)" }}>
            <span style={{ fontSize: "10px", color: "var(--primary)", letterSpacing: "0.5px", fontWeight: 600, display: "block" }}>SALDO AKTIF</span>
            <strong style={{ fontSize: "18px", color: "var(--primary)", display: "block", marginTop: "4px", fontFamily: "JetBrains Mono" }}>
              {Number(user?.balance_tokens ?? 0).toLocaleString("id-ID")}
            </strong>
            <small style={{ fontSize: "11px", color: "var(--text-muted)" }}>Token tersedia</small>
          </div>

          <div style={{ padding: "12px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-input)" }}>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.5px", fontWeight: 600, display: "block" }}>BRANKAS BONUS</span>
            <strong style={{ fontSize: "18px", color: "var(--text)", display: "block", marginTop: "4px", fontFamily: "JetBrains Mono" }}>
              {Number(user?.locked_bonus_tokens ?? 0).toLocaleString("id-ID")}
            </strong>
            <small style={{ fontSize: "11px", color: "var(--text-muted)" }}>Cair saat top-up</small>
          </div>
        </div>

        {/* User ID Container */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--canvas)", border: "1px solid var(--border)", borderRadius: "var(--radius-input)", marginBottom: "14px" }}>
          <code style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "JetBrains Mono" }}>ID: {user?.id}</code>
          <Button kind="ghost" onClick={handleCopyId} style={{ height: "24px", padding: "0 8px", fontSize: "11px" }}>
            {copiedId ? <Check size={12} /> : <Copy size={12} />} {copiedId ? "Disalin" : "Salin"}
          </Button>
        </div>

        {/* Webhook Alert Section */}
        <div style={{ marginBottom: "18px", textAlign: "left" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
              <Bell size={12} /> Webhook Alert Saldo (&lt; 50k token)
            </label>
            {webhookUrl.trim() && (
              <button type="button" onClick={handleTestAlert} style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "10px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "3px", padding: 0 }}>
                <Send size={10} /> {testSent ? "Terkirim!" : "Test Ping"}
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <input
              type="url"
              placeholder="https://discord.com/api/webhooks/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              style={{ flex: 1, padding: "6px 10px", fontSize: "12px", background: "var(--canvas)", border: "1px solid var(--border)", borderRadius: "var(--radius-input)", color: "var(--text)" }}
            />
            <Button kind="secondary" onClick={handleSaveAlert} loading={savingAlert} style={{ height: "32px", fontSize: "11px", padding: "0 10px" }}>
              {alertSaved ? "Tersimpan" : "Simpan"}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          {onNavigatePackages && (
            <Button kind="primary" onClick={() => { onClose(); onNavigatePackages(); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <Zap size={15} /> Top Up Token
            </Button>
          )}
          <Button className="danger" onClick={onLogout} style={{ flex: onNavigatePackages ? 1 : 2, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <LogOut size={15} /> Keluar
          </Button>
        </div>
      </section>
    </div>
  );
}

export default UserProfileModal;
