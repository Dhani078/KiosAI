import { useKios } from "../hooks/KiosContext";

export function AuthModal() {
  const { setShowAuthModal, authMode, setAuthMode, authEmail, setAuthEmail, authPassword, setAuthPassword, authName, setAuthName, authError, setAuthError, handleAuthSubmit } = useKios();
  return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#161619] border border-white/[0.07] rounded-2xl max-w-sm w-full p-6 space-y-4">
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
                    className="w-full bg-[#0D0D0F] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4F7FE8]"
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
                  className="w-full bg-[#0D0D0F] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4F7FE8]"
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
                  className="w-full bg-[#0D0D0F] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4F7FE8]"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#3D68C9] hover:bg-[#4F7FE8] text-white font-semibold rounded-xl text-sm transition-colors"
              >
                {authMode === "login" ? "Masuk" : "Daftar & Dapatkan 100k Token"}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-white/[0.07]">
              <button
                onClick={() => {
                  setAuthMode(authMode === "login" ? "register" : "login");
                  setAuthError("");
                }}
                className="text-xs text-[#4F7FE8] hover:underline"
              >
                {authMode === "login" ? "Belum punya akun? Daftar gratis" : "Sudah punya akun? Masuk"}
              </button>
            </div>
          </div>
        </div>
  );
}
