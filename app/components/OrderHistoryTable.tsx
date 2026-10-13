"use client";

import { Check, Download } from "lucide-react";
import { Badge, TableRow } from "./ui";
import { exportToCsv } from "@/lib/export-csv";

export function OrderHistoryTable({ orders }: { orders: any[] }) {
  const handleExport = () => {
    const headers = ["Order ID", "Tanggal", "Paket Tier", "Total IDR", "Tokens", "Status"];
    const rows = orders.map((o) => [
      o.id,
      o.created_at ? new Date(o.created_at).toISOString() : "",
      o.package_tier || "free",
      o.amount_idr || 0,
      o.tokens_purchased || 0,
      o.status || "pending",
    ]);
    exportToCsv("kiosai-riwayat-transaksi.csv", headers, rows);
  };

  return (
    <section className="panel">
      <div
        className="panel-heading"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2>Riwayat pembelian</h2>
          <span>Semua transaksi dari database TiDB</span>
        </div>
        {orders.length > 0 && (
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
        aria-label="Riwayat pembelian"
      >
        <table>
          <thead>
            <tr>
              <th>ORDER ID</th>
              <th>TANGGAL</th>
              <th>PAKET</th>
              <th>TOTAL</th>
              <th>TOKEN</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {orders.length ? (
              orders.map((o) => {
                const dateStr = o.created_at
                  ? new Date(o.created_at).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "Hari ini";

                return (
                  <TableRow key={o.id}>
                    <td>
                      <code>{o.id.slice(0, 16)}...</code>
                    </td>
                    <td className="muted">{dateStr}</td>
                    <td>
                      <Badge tier={(o.package_tier || "free").toUpperCase()} />
                    </td>
                    <td>Rp {Number(o.amount_idr || 0).toLocaleString("id-ID")}</td>
                    <td>
                      <code>
                        {Number(o.tokens_purchased || 0).toLocaleString("id-ID")}
                      </code>
                    </td>
                    <td>
                      <span className="success-tag">
                        <Check size={13} />
                        {o.status === "paid" ? "Berhasil" : o.status}
                      </span>
                    </td>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                  Belum ada transaksi pembelian.
                </td>
              </TableRow>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
export default OrderHistoryTable;
