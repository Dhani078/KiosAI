"use client";

import { Activity } from "lucide-react";
import { TableRow } from "./ui";

export function RecentLogsTable({ logs }: { logs: any[] }) {
  return (
    <section className="panel" style={{ marginTop: "24px" }}>
      <div className="panel-heading">
        <h2>Log Permintaan Terakhir</h2>
        <span>20 riwayat request API dari database TiDB</span>
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
                      <strong>{log.model}</strong>
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
