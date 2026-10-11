import { Check, RefreshCw, Zap } from "lucide-react";
import { useKios } from "../hooks/KiosContext";

export function PackagesTab() {
  const { currentUser, selectedOrder, setSelectedOrder, payingOrder, orders, handleBuyPackage, handleSimulatePayment } = useKios();
  return (
        <div className="space-y-6">
          {currentUser && currentUser.balance_tokens < 20000 && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-600/40 text-amber-200 flex items-center gap-3">
              <Zap className="h-5 w-5 text-amber-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold">Peringatan Kuota:</span> Saldo token Anda tersisa kurang dari 20.000 token ({currentUser.balance_tokens.toLocaleString("id-ID")}). Silakan beli paket tambahan agar request API AI Anda tidak terhenti.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#161619]/60 border border-white/[0.07] rounded-2xl p-6 flex flex-col justify-between hover:border-blue-500/50 transition-all">
              <div>
                <div className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2">Paket Bronze</div>
                <div className="text-2xl font-extrabold text-white">Rp 50.000</div>
                <div className="text-sm font-semibold text-emerald-400 mt-1">1.000.000 Token</div>
                <ul className="text-xs text-slate-400 mt-4 space-y-2 border-t border-white/[0.07] pt-4">
                  <li>• Akses semua model standar</li>
                  <li>• Rate limit 60 req/min</li>
                  <li>• Masa aktif selamanya (no expiry)</li>
                </ul>
              </div>
              <button
                onClick={() => handleBuyPackage("bronze")}
                className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-[#3D68C9] text-white font-medium text-sm transition-colors"
              >
                Beli via QRIS
              </button>
            </div>

            <div className="bg-[#161619]/60 border border-blue-500/40 rounded-2xl p-6 flex flex-col justify-between shadow-lg shadow-blue-900/20 relative">
              <span className="absolute -top-3 right-4 bg-[#3D68C9] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Paling Laris</span>
              <div>
                <div className="text-xs font-bold text-[#4F7FE8] uppercase tracking-wider mb-2">Paket Silver</div>
                <div className="text-2xl font-extrabold text-white">Rp 150.000</div>
                <div className="text-sm font-semibold text-emerald-400 mt-1">3.500.000 Token (+500k Bonus)</div>
                <ul className="text-xs text-slate-400 mt-4 space-y-2 border-t border-white/[0.07] pt-4">
                  <li>• Akses Claude, GPT, Gemini</li>
                  <li>• Rate limit 300 req/min</li>
                  <li>• Masa aktif selamanya</li>
                </ul>
              </div>
              <button
                onClick={() => handleBuyPackage("silver")}
                className="mt-6 w-full py-2.5 rounded-xl bg-[#3D68C9] hover:bg-[#4F7FE8] text-white font-semibold text-sm transition-colors"
              >
                Beli via QRIS
              </button>
            </div>

            <div className="bg-[#161619]/60 border border-white/[0.07] rounded-2xl p-6 flex flex-col justify-between hover:border-amber-500/50 transition-all">
              <div>
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Paket Gold</div>
                <div className="text-2xl font-extrabold text-white">Rp 400.000</div>
                <div className="text-sm font-semibold text-emerald-400 mt-1">10.000.000 Token (+2M Bonus)</div>
                <ul className="text-xs text-slate-400 mt-4 space-y-2 border-t border-white/[0.07] pt-4">
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
              <div className="bg-[#161619] border border-white/[0.07] rounded-2xl max-w-sm w-full p-6 text-center space-y-4">
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

          {/* Riwayat Transaksi */}
          <div className="bg-[#161619]/60 border border-white/[0.07] rounded-xl overflow-hidden mt-8">
            <div className="px-5 py-4 border-b border-white/[0.07] flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Riwayat Transaksi & Invoice ({orders.length})</h3>
            </div>
            {orders.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Belum ada riwayat transaksi pembelian token.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#0D0D0F] text-slate-400 border-b border-white/[0.07]">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Paket</th>
                      <th className="p-3">Total Biaya</th>
                      <th className="p-3">Token Didapat</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-800/20">
                        <td className="p-3 text-slate-400 font-mono text-[11px]">{o.id.substring(0, 18)}...</td>
                        <td className="p-3 text-slate-200 capitalize">{o.package_tier}</td>
                        <td className="p-3 text-white font-semibold">Rp {Number(o.amount_idr).toLocaleString("id-ID")}</td>
                        <td className="p-3 text-emerald-400">+{Number(o.tokens_purchased).toLocaleString("id-ID")}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            o.status === "paid"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : "bg-amber-950 text-amber-400 border border-amber-800"
                          }`}>
                            {o.status === "paid" ? "LUNAS" : "PENDING"}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{new Date(o.created_at).toLocaleDateString("id-ID")}</td>
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
