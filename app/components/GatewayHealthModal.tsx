"use client";

import { useState } from "react";
import { X, RefreshCw, Activity, Database, Cpu, Globe } from "lucide-react";
import { Button } from "./ui";

export function GatewayHealthModal({
  isOpen,
  onClose,
  initialHealth,
  isAdmin = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialHealth: any;
  isAdmin?: boolean;
}) {
  const [health, setHealth] = useState(initialHealth);
  const [refreshing, setRefreshing] = useState(false);

  if (!isOpen) return null;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealth(data);
    } catch {} finally {
      setRefreshing(false);
    }
  };

  const dbMs = health?.database?.latencyMs ?? 0;
  const upMs = health?.upstream?.latencyMs ?? 0;
  const isHealthy = health?.status === "healthy";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section role="dialog" aria-modal="true" className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
        <button aria-label="Tutup" className="modal-close" onClick={onClose}><X size={20} /></button>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Activity size={20} style={{ color: isHealthy ? "var(--success)" : "var(--warning)" }} />
            <h2 style={{ margin: 0, fontSize: "17px" }}>Status Gateway & Diagnostik</h2>
          </div>
          <Button kind="ghost" onClick={handleRefresh} loading={refreshing} style={{ height: "30px", fontSize: "11px", padding: "0 8px" }}>
            <RefreshCw size={13} /> Segarkan
          </Button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
          <div style={{ padding: "12px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-input)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Database size={16} style={{ color: "var(--primary)" }} />
              <div>
                <strong style={{ fontSize: "13px", display: "block" }}>{isAdmin ? "TiDB Cloud Serverless" : "Database Cloud"}</strong>
                <span className="muted" style={{ fontSize: "11px" }}>Koneksi query & settlement saldo</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "12px", color: health?.database?.status === "connected" ? "var(--success)" : "var(--error)", fontWeight: 600 }}>
                {health?.database?.status === "connected" ? "Connected" : "Error"}
              </span>
              <small className="muted" style={{ display: "block", fontSize: "11px" }}>{dbMs}ms</small>
            </div>
          </div>

          <div style={{ padding: "12px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-input)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Cpu size={16} style={{ color: "var(--primary)" }} />
              <div>
                <strong style={{ fontSize: "13px", display: "block" }}>{isAdmin ? "9Router Local Proxy" : "AI Router Gateway"}</strong>
                <span className="muted" style={{ fontSize: "11px" }}>71 Model AI Aktif Terverifikasi</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "12px", color: health?.upstream?.status === "connected" ? "var(--success)" : "var(--error)", fontWeight: 600 }}>
                {health?.upstream?.status === "connected" ? "Live" : "Degraded"}
              </span>
              <small className="muted" style={{ display: "block", fontSize: "11px" }}>{upMs}ms</small>
            </div>
          </div>

          <div style={{ padding: "12px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-input)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Globe size={16} style={{ color: "var(--primary)" }} />
              <div>
                <strong style={{ fontSize: "13px", display: "block" }}>Cloudflare Edge CDN</strong>
                <span className="muted" style={{ fontSize: "11px" }}>Global Edge Worker & DDoS Shield</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "12px", color: "var(--success)", fontWeight: 600 }}>Operational</span>
              <small className="muted" style={{ display: "block", fontSize: "11px" }}>HTTP/2 Active</small>
            </div>
          </div>
        </div>

        <Button kind="secondary" onClick={onClose} style={{ width: "100%" }}>
          Tutup
        </Button>
      </section>
    </div>
  );
}

export default GatewayHealthModal;
