import { Key, Copy, Check, ShieldCheck, Trash2, Sparkles } from "lucide-react";
import { useKios } from "../hooks/KiosContext";

export function KeysTab() {
  const { keys, newKeyName, setNewKeyName, newKeyRateLimit, setNewKeyRateLimit, newKeyAllowedModels, setNewKeyAllowedModels, generatedKey, copiedKey, setCopiedKey, handleCreateKey, handleDeleteKey } = useKios();
  return (
        <div className="space-y-6">
          {generatedKey && (
            <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-600/40 text-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" /> API Key Baru Berhasil Dibuat
                </span>
                <span className="text-xs text-amber-300">Simpan sekarang! Kunci tidak akan ditampilkan lagi.</span>
              </div>
              <div className="flex items-center gap-2 bg-[#0D0D0F] p-2.5 rounded-lg border border-emerald-900/80 font-mono text-sm text-emerald-300">
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

          <div className="bg-[#161619]/60 border border-white/[0.07] rounded-xl p-5">
            <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#4F7FE8]" /> Buat API Key Baru
            </h2>
            <form onSubmit={handleCreateKey} className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nama Kunci</label>
                <input
                  type="text"
                  placeholder="Misal: Cursor IDE"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full bg-[#0D0D0F] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4F7FE8]"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Rate Limit (req/min)</label>
                <input
                  type="number"
                  value={newKeyRateLimit}
                  onChange={(e) => setNewKeyRateLimit(Number(e.target.value))}
                  className="w-full bg-[#0D0D0F] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4F7FE8]"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Model Diizinkan (opsional)</label>
                <input
                  type="text"
                  placeholder="Kosongkan untuk semua"
                  value={newKeyAllowedModels}
                  onChange={(e) => setNewKeyAllowedModels(e.target.value)}
                  className="w-full bg-[#0D0D0F] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4F7FE8]"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-[#3D68C9] hover:bg-[#4F7FE8] text-white font-medium py-2 rounded-lg text-sm transition-colors"
                >
                  Generate Key
                </button>
              </div>
            </form>
          </div>

          <div className="bg-[#161619]/60 border border-white/[0.07] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.07]">
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
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/[0.12]">
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
  );
}
