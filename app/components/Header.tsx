import { Coins, RefreshCw, Zap, User } from "lucide-react";
import { useKios } from "../hooks/KiosContext";

export function Header() {
  const { currentUser, loading, setShowAuthModal, setAuthMode, refreshAll } = useKios();
  return (
      <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-white/[0.07] gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#3D68C9] flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">KiosAI</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/60 text-[#4F7FE8] border border-blue-700/50 font-mono">
                TiDB Serverless
              </span>
            </div>
            <p className="text-xs text-slate-400">Gateway API & Pasar Token AI Mandiri</p>
          </div>
        </div>

        {/* User Account & Balance */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-[#161619]/80 border border-white/[0.07] p-2.5 px-4 rounded-xl">
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
          <div className="flex items-center gap-2 bg-[#161619] border border-white/[0.07] p-2 px-3 rounded-xl">
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
  );
}
