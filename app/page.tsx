"use client";

import { useState, useEffect } from "react";
import { 
  Key, 
  Coins, 
  Send, 
  Copy, 
  Check, 
  ShieldCheck, 
  Trash2, 
  Sparkles, 
  Code2, 
  RefreshCw,
  Terminal,
  Zap,
  Bot,
  BarChart3,
  User,
  LogOut,
  Activity,
  Layers
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"keys" | "packages" | "playground" | "analytics" | "docs">("keys");
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; full_name: string; balance_tokens: number; tier: string } | null>(null);
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");

  // New Key Form State
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(60);
  const [newKeyAllowedModels, setNewKeyAllowedModels] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // QRIS Order State
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [payingOrder, setPayingOrder] = useState(false);

  // Playground State
  const [playgroundKey, setPlaygroundKey] = useState("");
  const [playgroundModel, setPlaygroundModel] = useState("ag/gemini-3.8-flash-high");
  const [playgroundPrompt, setPlaygroundPrompt] = useState("Halo KiosAI, ceritakan secara singkat apa kelebihanmu!");
  const [playgroundResponse, setPlaygroundResponse] = useState("");
  const [playgroundLoading, setPlaygroundLoading] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState<{
    summary: { totalRequests: number; totalTokens: number; avgLatencyMs: number };
    perModel: any[];
    recentLogs: any[];
  } | null>(null);

  // Load saved user from localStorage or fallback to demo
  const getActiveUserId = () => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kiosai_user_id");
      if (saved) return saved;
    }
    return "usr_kiosai_demo";
  };

  const fetchUserData = async () => {
    try {
      const uid = getActiveUserId();
      const res = await fetch(`/api/user?id=${uid}`);
      const data = await res.json();
      if (data.user) setCurrentUser(data.user);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchKeys = async () => {
    try {
      const uid = getActiveUserId();
      const res = await fetch(`/api/keys?userId=${uid}`);
      const data = await res.json();
      if (data.keys) {
        setKeys(data.keys);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const uid = getActiveUserId();
      const res = await fetch(`/api/analytics?userId=${uid}`);
      const data = await res.json();
      setAnalytics(data);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([fetchUserData(), fetchKeys(), fetchAnalytics()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword,
          fullName: authName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Gagal melakukan autentikasi");
        return;
      }
      if (data.user) {
        localStorage.setItem("kiosai_user_id", data.user.id);
        setCurrentUser(data.user);
        setShowAuthModal(false);
        setAuthEmail("");
        setAuthPassword("");
        setAuthName("");
        await refreshAll();
      }
    } catch (e: any) {
      setAuthError(e.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("kiosai_user_id");
    // Switch to demo user
    fetchUserData();
    fetchKeys();
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const models = newKeyAllowedModels.trim() 
        ? newKeyAllowedModels.split(",").map(m => m.trim()).filter(Boolean)
        : null;

      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id || "usr_kiosai_demo",
          name: newKeyName || "My Key",
          rateLimit: newKeyRateLimit,
          allowedModels: models,
        }),
      });

      const data = await res.json();
      if (data.apiKey) {
        setGeneratedKey(data.apiKey);
        setPlaygroundKey(data.apiKey);
        setNewKeyName("");
        setNewKeyAllowedModels("");
        await fetchKeys();
      }
    } catch (e) {
      alert("Gagal membuat key");
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Nonaktifkan API key ini?")) return;
    try {
      await fetch(`/api/keys/${id}`, { method: "DELETE" });
      await fetchKeys();
    } catch (e) {
      alert("Gagal menghapus key");
    }
  };

  const handleBuyPackage = async (tier: "bronze" | "silver" | "gold") => {
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser?.id || "usr_kiosai_demo", tier }),
      });
      const data = await res.json();
      if (data.orderId) {
        setSelectedOrder(data);
      }
    } catch (e) {
      alert("Gagal membuat pesanan");
    }
  };

  const handleSimulatePayment = async () => {
    if (!selectedOrder) return;
    setPayingOrder(true);
    try {
      const res = await fetch("/api/orders/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: selectedOrder.orderId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setSelectedOrder(null);
        await refreshAll();
      }
    } catch (e) {
      alert("Gagal memproses pembayaran");
    } finally {
      setPayingOrder(false);
    }
  };

  const handleRunPlayground = async () => {
    if (!playgroundKey) {
      alert("Masukkan API Key terlebih dahulu.");
      return;
    }

    setPlaygroundLoading(true);
    setPlaygroundResponse("");

    try {
      const res = await fetch("/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${playgroundKey}`,
        },
        body: JSON.stringify({
          model: playgroundModel,
          messages: [{ role: "user", content: playgroundPrompt }],
          stream: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setPlaygroundResponse(`Error [${res.status}]: ${err.error?.message || "Unknown error"}`);
        setPlaygroundLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const parsed = JSON.parse(line.substring(6));
                const content = parsed.choices?.[0]?.delta?.content || "";
                acc += content;
                setPlaygroundResponse(acc);
              } catch {}
            }
          }
        }
      }

      await refreshAll();
    } catch (e: any) {
      setPlaygroundResponse(`Network error: ${e.message}`);
    } finally {
      setPlaygroundLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">KiosAI</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-400 border border-blue-700/50 font-mono">
                TiDB Serverless
              </span>
            </div>
            <p className="text-xs text-slate-400">Gateway API & Pasar Token AI Mandiri</p>
          </div>
        </div>

        {/* User Account & Balance */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 p-2.5 px-4 rounded-xl">
            <Coins className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Saldo Token</div>
              <div className="text-base font-bold text-emerald-400 font-mono">
                {currentUser ? currentUser.balance_tokens.toLocaleString("id-ID") : "..."} <span className="text-xs text-slate-400 font-normal">Token</span>
              </div>
            </div>
            <button 
              onClick={refreshAll}
              className="p-1.5 ml-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Account Profile Button */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 px-3 rounded-xl">
            <User className="h-4 w-4 text-slate-400" />
            <div className="text-xs text-slate-300 max-w-[120px] truncate">
              {currentUser ? currentUser.full_name : "Demo User"}
            </div>
            <button
              onClick={() => {
                setShowAuthModal(true);
                setAuthMode("login");
              }}
              className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors ml-1"
            >
              Ganti Akun
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex gap-2 my-6 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("keys")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "keys"
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Key className="h-4 w-4" /> Kelola API Keys
        </button>
        <button
          onClick={() => setActiveTab("packages")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "packages"
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Coins className="h-4 w-4" /> Beli Token (QRIS)
        </button>
        <button
          onClick={() => setActiveTab("playground")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "playground"
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Bot className="h-4 w-4" /> Live AI Playground
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "analytics"
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <BarChart3 className="h-4 w-4" /> Statistik & Log Penggunaan
        </button>
        <button
          onClick={() => setActiveTab("docs")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "docs"
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Code2 className="h-4 w-4" /> Dokumentasi SDK
        </button>
      </nav>

      {/* TAB 1: API KEYS */}
      {activeTab === "keys" && (
        <div className="space-y-6">
          {generatedKey && (
            <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-600/40 text-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" /> API Key Baru Berhasil Dibuat
                </span>
                <span className="text-xs text-amber-300">Simpan sekarang! Kunci tidak akan ditampilkan lagi.</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-emerald-900/80 font-mono text-sm text-emerald-300">
                <span className="flex-1 select-all">{generatedKey}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedKey);
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold flex items-center gap-1"
                >
                  {copiedKey ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedKey ? "Tersalin" : "Salin"}
                </button>
              </div>
            </div>
          )}

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-400" /> Buat API Key Baru
            </h2>
            <form onSubmit={handleCreateKey} className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nama Kunci</label>
                <input
                  type="text"
                  placeholder="Misal: Cursor IDE"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Rate Limit (req/min)</label>
                <input
                  type="number"
                  value={newKeyRateLimit}
                  onChange={(e) => setNewKeyRateLimit(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Model Diizinkan (opsional)</label>
                <input
                  type="text"
                  placeholder="Kosongkan untuk semua"
                  value={newKeyAllowedModels}
                  onChange={(e) => setNewKeyAllowedModels(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg text-sm transition-colors"
                >
                  Generate Key
                </button>
              </div>
            </form>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white">Daftar Kunci Aktif ({keys.length})</h2>
            </div>
            {keys.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Belum ada API key aktif. Buat kunci pertama Anda di atas.
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {keys.map((k) => (
                  <div key={k.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{k.name}</span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {k.key_prefix}...
                        </span>
                        {Boolean(k.is_active) ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">AKTIF</span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-semibold">NONAKTIF</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex flex-wrap gap-4 font-mono">
                        <span>Limit: {k.rate_limit_per_min} req/min</span>
                        <span>Model: {k.allowed_models ? JSON.parse(k.allowed_models).join(", ") : "Semua Model"}</span>
                        <span>Dibuat: {new Date(k.created_at).toLocaleDateString("id-ID")}</span>
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={() => handleDeleteKey(k.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/50 rounded-lg transition-colors"
                        title="Cabut Kunci"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PACKAGES */}
      {activeTab === "packages" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-blue-500/50 transition-all">
              <div>
                <div className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">Paket Bronze</div>
                <div className="text-2xl font-extrabold text-white">Rp 50.000</div>
                <div className="text-sm font-semibold text-emerald-400 mt-1">1.000.000 Token</div>
                <ul className="text-xs text-slate-400 mt-4 space-y-2 border-t border-slate-800 pt-4">
                  <li>• Akses semua model standar</li>
                  <li>• Rate limit 60 req/min</li>
                  <li>• Masa aktif selamanya (no expiry)</li>
                </ul>
              </div>
              <button
                onClick={() => handleBuyPackage("bronze")}
                className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-blue-600 text-white font-medium text-sm transition-colors"
              >
                Beli via QRIS
              </button>
            </div>

            <div className="bg-slate-900/60 border border-blue-500/40 rounded-2xl p-6 flex flex-col justify-between shadow-lg shadow-blue-900/20 relative">
              <span className="absolute -top-3 right-4 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Paling Laris</span>
              <div>
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Paket Silver</div>
                <div className="text-2xl font-extrabold text-white">Rp 150.000</div>
                <div className="text-sm font-semibold text-emerald-400 mt-1">3.500.000 Token (+500k Bonus)</div>
                <ul className="text-xs text-slate-400 mt-4 space-y-2 border-t border-slate-800 pt-4">
                  <li>• Akses Claude, GPT, Gemini</li>
                  <li>• Rate limit 300 req/min</li>
                  <li>• Masa aktif selamanya</li>
                </ul>
              </div>
              <button
                onClick={() => handleBuyPackage("silver")}
                className="mt-6 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors"
              >
                Beli via QRIS
              </button>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-amber-500/50 transition-all">
              <div>
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Paket Gold</div>
                <div className="text-2xl font-extrabold text-white">Rp 400.000</div>
                <div className="text-sm font-semibold text-emerald-400 mt-1">10.000.000 Token (+2M Bonus)</div>
                <ul className="text-xs text-slate-400 mt-4 space-y-2 border-t border-slate-800 pt-4">
                  <li>• Akses unmetered model</li>
                  <li>• Rate limit 1000 req/min</li>
                  <li>• Masa aktif selamanya</li>
                </ul>
              </div>
              <button
                onClick={() => handleBuyPackage("gold")}
                className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-amber-600 text-white font-medium text-sm transition-colors"
              >
                Beli via QRIS
              </button>
            </div>
          </div>

          {selectedOrder && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-center space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">Pembayaran QRIS</span>
                  <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>
                <div className="bg-white p-4 rounded-xl inline-block shadow-inner">
                  <img src={selectedOrder.qrisUrl} alt="QRIS" className="w-48 h-48 mx-auto" />
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-bold text-white">Rp {selectedOrder.amountIdr.toLocaleString("id-ID")}</div>
                  <div className="text-xs text-emerald-400 font-medium">+{selectedOrder.tokensPurchased.toLocaleString("id-ID")} Token</div>
                  <div className="text-[11px] text-slate-400 font-mono">Order: {selectedOrder.orderId}</div>
                </div>
                <div className="pt-2">
                  <button
                    disabled={payingOrder}
                    onClick={handleSimulatePayment}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {payingOrder ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Simulasi Bayar Berhasil
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PLAYGROUND */}
      {activeTab === "playground" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="h-4 w-4 text-blue-400" /> Konfigurasi Permintaan
            </h2>
            <div>
              <label className="text-xs text-slate-400 block mb-1">API Key (kios-...)</label>
              <input
                type="text"
                value={playgroundKey}
                onChange={(e) => setPlaygroundKey(e.target.value)}
                placeholder="Masukkan API Key Anda"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Model Target</label>
              <select
                value={playgroundModel}
                onChange={(e) => setPlaygroundModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
              >
                <option value="ag/gemini-3.8-flash-high">ag/gemini-3.8-flash-high</option>
                <option value="openai/gpt-5">openai/gpt-5</option>
                <option value="claude-3-5-sonnet">claude-3-5-sonnet</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Pesan Prompt</label>
              <textarea
                rows={4}
                value={playgroundPrompt}
                onChange={(e) => setPlaygroundPrompt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
            <button
              disabled={playgroundLoading}
              onClick={handleRunPlayground}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              {playgroundLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Kirim ke KiosAI Proxy
            </button>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Bot className="h-4 w-4 text-emerald-400" /> Hasil Streaming AI
              </h2>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 min-h-[220px] max-h-[350px] overflow-y-auto text-sm text-slate-300 font-sans whitespace-pre-wrap">
                {playgroundResponse || (
                  <span className="text-slate-600 italic">Respons streaming akan muncul di sini...</span>
                )}
              </div>
            </div>
            <div className="text-[11px] text-slate-500 mt-4 border-t border-slate-800/80 pt-2 flex items-center justify-between font-mono">
              <span>Endpoint: /v1/chat/completions</span>
              <span>Rate Limit Protected</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ANALYTICS & LOGS */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 uppercase font-semibold">Total Permintaan</span>
                <Activity className="h-4 w-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                {analytics?.summary.totalRequests || 0}
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 uppercase font-semibold">Token Terpakai</span>
                <Coins className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">
                {(analytics?.summary.totalTokens || 0).toLocaleString("id-ID")}
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 uppercase font-semibold">Rata-rata Latensi</span>
                <Zap className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400 font-mono">
                {analytics?.summary.avgLatencyMs || 0} <span className="text-xs font-normal text-slate-400">ms</span>
              </div>
            </div>
          </div>

          {/* Model Breakdown */}
          {analytics?.perModel && analytics.perModel.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-400" /> Penggunaan Per Model
              </h3>
              <div className="space-y-2">
                {analytics.perModel.map((m: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
                    <span className="font-mono text-sm text-slate-200">{m.model}</span>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="text-slate-400">{m.requests} req</span>
                      <span className="text-emerald-400 font-semibold">{Number(m.tokens).toLocaleString("id-ID")} tokens</span>
                      <span className="text-amber-400">{m.avg_latency} ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Logs Table */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Log Permintaan Terakhir</h3>
            </div>
            {(!analytics?.recentLogs || analytics.recentLogs.length === 0) ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Belum ada aktivitas request API.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Status</th>
                      <th className="p-3">Model</th>
                      <th className="p-3">Total Token</th>
                      <th className="p-3">Latensi</th>
                      <th className="p-3">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {analytics.recentLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-800/20">
                        <td className="p-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            log.status_code === 200 
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : "bg-red-950 text-red-400 border border-red-800"
                          }`}>
                            {log.status_code}
                          </span>
                        </td>
                        <td className="p-3 text-slate-200">{log.model}</td>
                        <td className="p-3 text-emerald-400">{log.total_tokens}</td>
                        <td className="p-3 text-amber-400">{log.latency_ms} ms</td>
                        <td className="p-3 text-slate-400">{new Date(log.created_at).toLocaleTimeString("id-ID")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: SDK DOCS */}
      {activeTab === "docs" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white mb-1">Panduan Integrasi OpenAI SDK</h2>
            <p className="text-xs text-slate-400">
              KiosAI 100% kompatibel dengan OpenAI client di Python, JavaScript/TypeScript, dan cURL.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-slate-300 mb-1">cURL (Terminal):</div>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-blue-300 font-mono overflow-x-auto">
{`curl http://localhost:3000/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer kios-your-api-key" \\
  -d '{
    "model": "ag/gemini-3.8-flash-high",
    "messages": [{"role": "user", "content": "Halo KiosAI"}],
    "stream": true
  }'`}
              </pre>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-300 mb-1">Python (openai package):</div>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-emerald-300 font-mono overflow-x-auto">
{`from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3000/v1",
    api_key="kios-your-api-key"
)

response = client.chat.completions.create(
    model="ag/gemini-3.8-flash-high",
    messages=[{"role": "user", "content": "Halo!"}]
)
print(response.choices[0].message.content)`}
              </pre>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-300 mb-1">Node.js (openai npm):</div>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-amber-300 font-mono overflow-x-auto">
{`import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "http://localhost:3000/v1",
  apiKey: "kios-your-api-key",
});

const completion = await openai.chat.completions.create({
  model: "ag/gemini-3.8-flash-high",
  messages: [{ role: "user", content: "Halo!" }],
});
console.log(completion.choices[0].message.content);`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">
                {authMode === "login" ? "Masuk ke KiosAI" : "Daftar Akun Baru"}
              </span>
              <button onClick={() => setShowAuthModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {authError && (
              <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800/80 text-xs text-red-300">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {authMode === "register" && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Nama Anda"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-slate-400 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="anda@email.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-colors"
              >
                {authMode === "login" ? "Masuk" : "Daftar & Dapatkan 100k Token"}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setAuthMode(authMode === "login" ? "register" : "login");
                  setAuthError("");
                }}
                className="text-xs text-blue-400 hover:underline"
              >
                {authMode === "login" ? "Belum punya akun? Daftar gratis" : "Sudah punya akun? Masuk"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
