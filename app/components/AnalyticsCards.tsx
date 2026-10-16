"use client";

import { Zap, Activity, CheckCircle2, Clock, Plus } from "lucide-react";
import { Button } from "./ui";

export function AnalyticsCards({
  balance,
  lockedBonus = 0,
  summary,
  isAdmin = false,
  onNavigatePackages,
}: {
  balance: number;
  lockedBonus?: number;
  summary: {
    totalRequests: number;
    totalTokens: number;
    totalPromptTokens: number;
    totalCompletionTokens: number;
    avgLatencyMs: number;
    minLatencyMs: number;
    maxLatencyMs: number;
    successRate: number;
  };
  isAdmin?: boolean;
  onNavigatePackages: () => void;
}) {
  const promptTokens = summary?.totalPromptTokens || 0;
  const completionTokens = summary?.totalCompletionTokens || 0;
  const totalTokens = summary?.totalTokens || 0;
  const requests = summary?.totalRequests || 0;
  const avgLatency = summary?.avgLatencyMs || 0;
  const successRate = summary?.successRate ?? 100;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
      <section className="panel stat-card" style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="small-label">SALDO AKTIF</span>
          <Zap size={15} style={{ color: "var(--primary)" }} />
        </div>
        <div className="stat-number" style={{ fontSize: "28px", fontWeight: 700 }}>
          {balance.toLocaleString("id-ID")}
        </div>
        {lockedBonus > 0 ? (
          <div style={{ fontSize: "11px", color: "var(--primary)", background: "rgba(242, 140, 56, 0.08)", padding: "4px 8px", borderRadius: "4px", border: "1px dashed rgba(242, 140, 56, 0.3)" }}>
            🔒 +{lockedBonus.toLocaleString("id-ID")} di Brankas Bonus
          </div>
        ) : (
          <span className="muted" style={{ fontSize: "11px" }}>token tersedia di {isAdmin ? "TiDB" : "akun"}</span>
        )}
        <div style={{ marginTop: "auto", paddingTop: "8px" }}>
          <Button kind="primary" style={{ width: "100%", height: "32px", fontSize: "12px" }} onClick={onNavigatePackages}>
            Isi Saldo <Plus size={14} />
          </Button>
        </div>
      </section>

      <section className="panel stat-card" style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="small-label">KONSUMSI TOKEN</span>
          <Activity size={15} style={{ color: "var(--primary)" }} />
        </div>
        <div className="stat-number" style={{ fontSize: "28px", fontWeight: 700 }}>
          {totalTokens.toLocaleString("id-ID")}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
          <span>In: {promptTokens.toLocaleString("id-ID")}</span>
          <span>Out: {completionTokens.toLocaleString("id-ID")}</span>
        </div>
        <div className="stat-bottom" style={{ marginTop: "auto", fontSize: "11px" }}>
          Total {requests.toLocaleString("id-ID")} request AI
        </div>
      </section>

      <section className="panel stat-card" style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="small-label">LATENSI RATA-RATA</span>
          <Clock size={15} style={{ color: "var(--primary)" }} />
        </div>
        <div className="stat-number" style={{ fontSize: "28px", fontWeight: 700 }}>
          {avgLatency} <span style={{ fontSize: "16px", fontWeight: 500, color: "var(--text-muted)" }}>ms</span>
        </div>
        <span className="muted" style={{ fontSize: "11px" }}>
          Min: {summary?.minLatencyMs || 0}ms · Max: {summary?.maxLatencyMs || 0}ms
        </span>
        <div className="stat-bottom" style={{ marginTop: "auto", fontSize: "11px" }}>
          Region Tokyo & Singapore
        </div>
      </section>

      <section className="panel stat-card" style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="small-label">RELIABILITAS GATEWAY</span>
          <CheckCircle2 size={15} style={{ color: "var(--success)" }} />
        </div>
        <div className="stat-number" style={{ fontSize: "28px", fontWeight: 700, color: successRate >= 95 ? "var(--success)" : "var(--warning)" }}>
          {successRate}%
        </div>
        <span className="muted" style={{ fontSize: "11px" }}>Tingkat sukses respons HTTP 200</span>
        <div className="stat-bottom" style={{ marginTop: "auto", fontSize: "11px", display: "flex", alignItems: "center", gap: "6px" }}>
          <span className="status-dot" /> Gateway aktif tersambung
        </div>
      </section>
    </div>
  );
}

export default AnalyticsCards;
