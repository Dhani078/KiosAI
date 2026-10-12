"use client";

import { Activity, Download } from "lucide-react";
import { TableRow, Button } from "./ui";
import { formatModelName } from "@/lib/model-utils";
import { exportToCsv } from "@/lib/export-csv";

export function RecentLogsTable({ logs }: { logs: any[] }) {
  const handleExport = () => {
    const headers = ["ID", "Waktu", "Model", "Prompt Tokens", "Completion Tokens", "Total Tokens", "Latency ms", "Status"];
    const rows = logs.map((l) => [
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
    <section className="panel" style={{ marginTop: "24px" }}>
      <div
        className="panel-heading"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <div>
          <h2>Log Permintaan Terakhir</h2>
          <span>20 riwayat request API dari database TiDB</span>
        </div>
        {logs && logs.length > 0 && (
          <button
            className="text-link"
            onClick={handleExport}
            style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <Download size={14} /> Ekspor CSV
          </button>
        )}
      </div>
      <div
        className="table-scroll"
        tabIndex={0}
        role="region"
        aria-label="Log riwayat penggunaan API"
      >
        <table>
          <thead>
            <tr>
              <th>WAKTU</th>
              <th>MODEL</th>
              <th>PROMPT</th>
              <th>COMPLETION</th>
              <th>TOTAL</th>
              <th>LATENSI</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {logs && logs.length > 0 ? (
              logs.map((log) => {
                const dateStr = log.created_at
                  ? new Date(log.created_at).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "-";

                const isSuccess = log.status_code === 200;

                return (
                  <TableRow key={log.id}>
                    <td className="muted">
                      <code>{dateStr}</code>
                    </td>
                    <td>
                      <strong>{formatModelName(log.model)}</strong>
                    </td>
                    <td className="muted">{log.prompt_tokens ?? 0}</td>
                    <td className="muted">{log.completion_tokens ?? 0}</td>
                    <td>
                      <code>{log.total_tokens ?? 0} token</code>
                    </td>
                    <td className="muted">{log.latency_ms ?? 0}ms</td>
                    <td>
                      <span
                        className={isSuccess ? "success-tag" : "popular"}
                        style={{
                          fontSize: "11px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        {log.status_code || 200}
                      </span>
                    </td>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <td
                  colSpan={7}
                  style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px 0" }}
                >
                  <Activity size={20} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                  Belum ada log request API yang tercatat.
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
