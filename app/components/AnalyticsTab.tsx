"use client";

import { AlertTriangle, Plus, ArrowRight } from "lucide-react";
import { Button } from "./ui";
import OrderHistoryTable from "./OrderHistoryTable";
import RecentLogsTable from "./RecentLogsTable";

export function AnalyticsTab({
  balance,
  analytics,
  orders,
  onNavigatePackages,
}: {
  balance: number;
  analytics: any;
  orders: any[];
  onNavigatePackages: () => void;
}) {
  const summary = analytics?.summary || { totalRequests: 0, totalTokens: 0, avgLatencyMs: 0 };
  const perModel: any[] = analytics?.perModel || [];
  const recentLogs: any[] = analytics?.recentLogs || [];
  const totalTokensUsed = summary.totalTokens || 0;

  return (
    <>
      <div className="stats-grid">
        <section className="panel stat-card">
          <span className="small-label">Saldo token</span>
          <div className="stat-number">{balance.toLocaleString("id-ID")}</div>
          <span className="muted">token tersedia</span>
          <Button kind="primary" onClick={onNavigatePackages}>
            Isi token <Plus size={16} />
          </Button>
        </section>

        <section className="panel stat-card">
          <span className="small-label">Pemakaian akun</span>
          <div className="stat-number">{totalTokensUsed.toLocaleString("id-ID")}</div>
          <span className="muted">token terpakai di TiDB</span>
          <div className="stat-bottom">
            <span className="status-dot" />
            Rata-rata latensi: {summary.avgLatencyMs || 0}ms
          </div>
        </section>

        <section className="panel stat-card">
          <span className="small-label">Total permintaan</span>
          <div className="stat-number">
            {(summary.totalRequests || 0).toLocaleString("id-ID")}
          </div>
          <span className="muted">request tercatat</span>
          <div className="stat-bottom">Gateway terhubung live</div>
        </section>
      </div>

      {balance < 20000 && (
        <div className="warning-banner" role="alert">
          <AlertTriangle size={18} />
          Saldo di bawah 20.000 token. Isi ulang agar API dan aplikasi Anda tetap berjalan normal.
          <Button onClick={onNavigatePackages}>
            Isi token <ArrowRight size={14} />
          </Button>
        </div>
      )}

      <section className="panel usage-panel">
        <div className="section-heading">
          <h2>Penggunaan per model</h2>
          <span>Log konsumsi dari database TiDB</span>
        </div>
        {perModel.length > 0 ? (
          perModel.map((item) => {
            const pct = totalTokensUsed > 0 ? (item.tokens / totalTokensUsed) * 100 : 0;
            return (
              <div className="usage-row" key={item.model}>
                <div>
                  <span>{item.model}</span>
                  <code>{Number(item.tokens).toLocaleString("id-ID")} token ({item.requests} req)</code>
                </div>
                <div className="bar-track">
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.max(2, Math.min(100, pct))}%`,
                      background: "var(--primary)",
                      borderRadius: "999px",
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <p style={{ color: "var(--text-muted)", fontSize: "12px", padding: "16px 0" }}>
            Belum ada log penggunaan token. Gunakan Playground atau API untuk melihat statistik.
          </p>
        )}
      </section>

      <RecentLogsTable logs={recentLogs} />

      <OrderHistoryTable orders={orders} />
    </>
  );
}
export default AnalyticsTab;
