"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "./ui";
import AnalyticsCards from "./AnalyticsCards";
import ModelUsageBreakdown from "./ModelUsageBreakdown";
import RecentLogsTable from "./RecentLogsTable";
import OrderHistoryTable from "./OrderHistoryTable";

export function AnalyticsTab({
  balance,
  lockedBonus = 0,
  analytics,
  orders,
  isAdmin = false,
  onNavigatePackages,
}: {
  balance: number;
  lockedBonus?: number;
  analytics: any;
  orders: any[];
  isAdmin?: boolean;
  onNavigatePackages: () => void;
}) {
  const summary = analytics?.summary || {
    totalRequests: 0,
    totalTokens: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    avgLatencyMs: 0,
    minLatencyMs: 0,
    maxLatencyMs: 0,
    successRate: 100,
  };
  const perModel: any[] = analytics?.perModel || [];
  const recentLogs: any[] = analytics?.recentLogs || [];
  const totalTokens = summary.totalTokens || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <AnalyticsCards
        balance={balance}
        lockedBonus={lockedBonus}
        summary={summary}
        isAdmin={isAdmin}
        onNavigatePackages={onNavigatePackages}
      />

      {balance < 20000 && (
        <div className="warning-banner" role="alert" style={{ margin: 0 }}>
          <AlertTriangle size={18} />
          <span>Saldo di bawah 20.000 token. Isi ulang agar API dan aplikasi Anda tetap berjalan lancar tanpa terputus.</span>
          <Button onClick={onNavigatePackages}>
            Isi Saldo <ArrowRight size={14} />
          </Button>
        </div>
      )}

      <ModelUsageBreakdown perModel={perModel} totalTokens={totalTokens} isAdmin={isAdmin} />

      <RecentLogsTable logs={recentLogs} isAdmin={isAdmin} />

      <OrderHistoryTable orders={orders} isAdmin={isAdmin} />
    </div>
  );
}

export default AnalyticsTab;
