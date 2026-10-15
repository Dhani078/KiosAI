"use client";

import { useState } from "react";
import { Activity, Download, Search } from "lucide-react";
import { TableRow } from "./ui";
import { formatModelName } from "@/lib/model-utils";
import { exportToCsv } from "@/lib/export-csv";

export function RecentLogsTable({ logs }: { logs: any[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "200" | "error">("all");

  const list = logs || [];

  const filtered = list.filter((l) => {
    const model = (l.model || "").toLowerCase();
    const clean = formatModelName(l.model || "").toLowerCase();
    const matchesQuery = !search || model.includes(search.toLowerCase()) || clean.includes(search.toLowerCase());
    const is200 = Number(l.status_code) === 200;
    const matchesStatus =
      statusFilter === "all" ? true : statusFilter === "200" ? is200 : !is200;
    return matchesQuery && matchesStatus;
  });

  const handleExport = () => {
    const headers = ["ID", "Waktu", "Model", "Prompt Tokens", "Completion Tokens", "Total Tokens", "Latency ms", "Status"];
    const rows = filtered.map((l) => [
      l.id,
      l.created_at ? new Date(l.created_at).toISOString() : "",
      l.model,
      l.prompt_tokens ?? 0,
      l.completion_tokens ?? 0,
      l.total_tokens ?? 0,
      l.latency_ms ?? 0,
      l.status_code ?? 200,
    ]);
    exportToCsv("kiosai-log-permintaan.csv", headers, rows);
  };

  return (
    <section className="panel" style={{ marginTop: "24px", padding: "20px 24px" }}>
      <div className="panel-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <div>
          <h2>Log Permintaan Real-Time</h2>
          <span>50 riwayat aktivitas inferensi live dari database TiDB</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {list.length > 0 && (
            <button
              className="text-link"
              onClick={handleExport}
              style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              <Download size={13} /> Ekspor CSV
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", marginBottom: "14px" }}>
        <div style={{ position: "relative", minWidth: "220px", flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Saring log berdasarkan model..."
            style={{
              width: "100%",
              padding: "6px 10px 6px 30px",
              borderRadius: "var(--radius-input)",
              background: "var(--canvas)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              fontSize: "12px",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {(["all", "200", "error"] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={`button ${statusFilter === s ? "primary" : "ghost"}`}
              style={{ height: "28px", padding: "0 10px", fontSize: "11px" }}
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? `Semua (${list.length})` : s === "200" ? "Sukses 200" : "Error"}
            </button>
          ))}
        </div>
      </div>

      <div className="table-scroll" tabIndex={0} role="region" aria-label="Log riwayat penggunaan API">
        <table>
          <thead>
            <tr>
              <th>WAKTU</th>
              <th>MODEL</th>
              <th>IN</th>
              <th>OUT</th>
              <th>TOTAL</th>
              <th>LATENSI</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((log) => {
                const dateStr = log.created_at
                  ? new Date(log.created_at).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "-";
                const isSuccess = Number(log.status_code) === 200;

                return (
                  <TableRow key={log.id}>
                    <td className="muted"><code>{dateStr}</code></td>
                    <td><strong>{formatModelName(log.model)}</strong></td>
                    <td className="muted">{(log.prompt_tokens ?? 0).toLocaleString("id-ID")}</td>
                    <td className="muted">{(log.completion_tokens ?? 0).toLocaleString("id-ID")}</td>
                    <td><code style={{ color: "var(--primary)" }}>{(log.total_tokens ?? 0).toLocaleString("id-ID")}</code></td>
                    <td className="muted">{log.latency_ms ?? 0}ms</td>
                    <td>
                      <span
                        className={isSuccess ? "success-tag" : "popular"}
                        style={{ fontSize: "11px", padding: "2px 6px", borderRadius: "4px" }}
                      >
                        {log.status_code || 200}
                      </span>
                    </td>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px 0" }}>
                  <Activity size={18} style={{ margin: "0 auto 6px", opacity: 0.5 }} />
                  {list.length === 0 ? "Belum ada log request API yang tercatat." : "Tidak ada log yang cocok dengan filter."}
                </td>
              </TableRow>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default RecentLogsTable;
