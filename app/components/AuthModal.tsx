"use client";

import { useState } from "react";
import { X, ArrowRight, LogOut, Bell } from "lucide-react";
import Logo from "./Logo";
import { Button, Input } from "./ui";

export function AuthModal({
  currentUser,
  onClose,
  onAuthSuccess,
  onLogout,
}: {
  currentUser?: any;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
  onLogout?: () => void;
}) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(currentUser?.alert_webhook_url || "");
  const [savingAlert, setSavingAlert] = useState(false);
  const [alertSaved, setAlertSaved] = useState(false);

  const isCustomUser = currentUser && currentUser.id !== "usr_kiosai_demo";

  const handleLogout = () => {
    localStorage.removeItem("kiosai_user_id");
    try { localStorage.removeItem("kiosai_is_admin"); } catch {}
    if (onLogout) onLogout();
    window.location.href = "/";
  };

  const handleSaveAlert = async () => {
    if (!currentUser?.id) return;
    setSavingAlert(true);
    try {
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, alertWebhookUrl: webhookUrl.trim() }),
      });
      setAlertSaved(true);
      setTimeout(() => setAlertSaved(false), 2000);
    } catch {} finally {
      setSavingAlert(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = tab === "login" ? { identifier: email, password } : { email, password, fullName: name };
      const res = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal autentikasi");
      if (data.user) {
        localStorage.setItem("kiosai_user_id", data.user.id);
        const adm = Boolean(data.user.username === "adminfordhani" || data.user.email === "adminfordhani@kiosai.id");
        try { localStorage.setItem("kiosai_is_admin", adm ? "1" : "0"); } catch {}
        onAuthSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section role="dialog" aria-modal="true" className="modal" onClick={(e) => e.stopPropagation()}>
        <button aria-label="Tutup" className="modal-close" onClick={onClose}><X size={20} /></button>

        {isCustomUser ? (
          <div>
            <Logo />
            <h2>Akun Anda</h2>
            <p>Masuk sebagai <strong>{currentUser.email}</strong>{currentUser.username ? ` (@${currentUser.username})` : ""}.</p>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-input)", margin: "14px 0" }}>
              <span className="muted" style={{ fontSize: "12px" }}>Tier: <strong style={{ color: "var(--primary)" }}>{(currentUser.tier || "FREE").toUpperCase()}</strong></span>
              <span className="muted" style={{ fontSize: "12px" }}>Saldo: <strong style={{ color: "var(--text)" }}>{(currentUser.balance_tokens ?? 0).toLocaleString("id-ID")} token</strong></span>
            </div>
            <div style={{ marginTop: "12px", textAlign: "left" }}>
              <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                <Bell size={12} /> Webhook Alert Saldo (&lt; 50k token)
              </label>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="url"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  style={{ flex: 1, padding: "6px 10px", fontSize: "12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-input)", color: "var(--text)" }}
                />
                <Button kind="secondary" onClick={handleSaveAlert} loading={savingAlert} style={{ height: "32px", fontSize: "11px", padding: "0 10px" }}>
                  {alertSaved ? "Tersimpan" : "Simpan"}
                </Button>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <Button kind="secondary" onClick={onClose} style={{ flex: 1 }}>Tutup</Button>
              <Button className="danger" onClick={handleLogout} style={{ flex: 1 }}><LogOut size={16} /> Keluar</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <Logo />
            <h2>{tab === "login" ? "Selamat datang kembali." : "Daftar akun KiosAI."}</h2>
            <p>{tab === "login" ? "Masuk untuk mengelola saldo token dan API key Anda." : "Daftar sekarang dan dapatkan bonus 2.500.000 token!"}</p>
            <div style={{ display: "flex", gap: "8px", margin: "16px 0 20px" }}>
              <button type="button" className={`button ${tab === "login" ? "primary" : "ghost"}`} style={{ flex: 1, height: "36px" }} onClick={() => { setTab("login"); setError(null); }}>Masuk</button>
              <button type="button" className={`button ${tab === "register" ? "primary" : "ghost"}`} style={{ flex: 1, height: "36px" }} onClick={() => { setTab("register"); setError(null); }}>Daftar Baru</button>
            </div>
            {tab === "register" && (
              <>
                <label htmlFor="auth-name">Nama Lengkap</label>
                <Input id="auth-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Anda" />
              </>
            )}
            <label htmlFor="auth-email">{tab === "login" ? "Email atau Username" : "Email"}</label>
            <Input id="auth-email" type={tab === "login" ? "text" : "email"} required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" autoComplete={tab === "login" ? "username" : "email"} />
            <label htmlFor="auth-password">Password</label>
            <Input id="auth-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan password" autoComplete={tab === "login" ? "current-password" : "new-password"} />
            {error && <p className="field-error" role="alert">{error}</p>}
            <Button kind="primary" type="submit" loading={loading} style={{ width: "100%", marginTop: "20px" }}>
              {tab === "login" ? "Masuk ke Akun" : "Daftar (250K Instan + 2.25M Bonus)"} <ArrowRight size={16} />
            </Button>
            <small className="modal-note">Akun langsung tersimpan di database cloud. Bonus token instan untuk pendaftaran baru.</small>
          </form>
        )}
      </section>
    </div>
  );
}

export default AuthModal;
