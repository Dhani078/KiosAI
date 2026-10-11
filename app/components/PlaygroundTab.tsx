import { Key, Send, RefreshCw, Terminal, Bot } from "lucide-react";
import { useKios } from "../hooks/KiosContext";

export function PlaygroundTab() {
  const { playgroundKey, setPlaygroundKey, playgroundModel, setPlaygroundModel, playgroundPrompt, setPlaygroundPrompt, playgroundResponse, playgroundLoading, availableModels, handleRunPlayground } = useKios();
  return (
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
                {availableModels.length > 0 ? (
                  availableModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.id} [{m.required_tier.toUpperCase()}]
                    </option>
                  ))
                ) : (
                  <>
                    <option value="ag/gemini-3.8-flash-high">ag/gemini-3.8-flash-high [BRONZE]</option>
                    <option value="kr/claude-sonnet-4.5">kr/claude-sonnet-4.5 [SILVER]</option>
                    <option value="combomaut">combomaut [GOLD]</option>
                  </>
                )}
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
  );
}
