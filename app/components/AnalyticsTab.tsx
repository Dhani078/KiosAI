import { Coins, Zap, Activity, Layers } from "lucide-react";
import { useKios } from "../hooks/KiosContext";

export function AnalyticsTab() {
  const { analytics } = useKios();
  return (
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
  );
}
