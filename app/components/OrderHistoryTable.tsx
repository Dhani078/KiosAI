"use client";

import { Check, Download, Receipt } from "lucide-react";
import { Badge, TableRow } from "./ui";
import { exportToCsv } from "@/lib/export-csv";

export function OrderHistoryTable({ orders }: { orders: any[] }) {
  const list = orders || [];
  const paidOrders = list.filter((o) => o.status === "paid");
  const totalPaidIdr = paidOrders.reduce((sum, o) => sum + Number(o.amount_idr || 0), 0);
  const totalTokensBought = paidOrders.reduce((sum, o) => sum + Number(o.tokens_purchased || 0), 0);

  const handleExport = () => {
    const headers = ["Order ID", "Tanggal", "Paket Tier", "Total IDR", "Tokens", "Status"];
    const rows = list.map((o) => [
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
    <section className="panel" style={{ marginTop: "24px", padding: "20px 24px" }}>
      <div className="panel-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <div>
          <h2>Riwayat Pembelian & Faktur</h2>
          <span>Rekam jejak transaksi QRIS resmi dari database TiDB</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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

      {paidOrders.length > 0 && (
        <div style={{ display: "flex", gap: "16px", padding: "10px 14px", background: "var(--canvas)", borderRadius: "var(--radius-input)", border: "1px solid var(--border)", marginBottom: "14px", fontSize: "12px", alignItems: "center" }}>
          <Receipt size={15} style={{ color: "var(--primary)" }} />
          <span>Total Investasi: <strong style={{ color: "var(--text)" }}>Rp {totalPaidIdr.toLocaleString("id-ID")}</strong></span>
          <span style={{ color: "var(--border)" }}>|</span>
          <span>Total Token Masuk: <strong style={{ color: "var(--primary)", fontFamily: "JetBrains Mono" }}>{totalTokensBought.toLocaleString("id-ID")} token</strong></span>
        </div>
      )}

      <div className="table-scroll" tabIndex={0} role="region" aria-label="Riwayat pembelian">
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
            {list.length ? (
              list.map((o) => {
                const dateStr = o.created_at
                  ? new Date(o.created_at).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "Hari ini";

                return (
                  <TableRow key={o.id}>
                    <td><code>{o.id.slice(0, 16)}...</code></td>
                    <td className="muted">{dateStr}</td>
                    <td><Badge tier={(o.package_tier || "free").toUpperCase()} /></td>
                    <td>Rp {Number(o.amount_idr || 0).toLocaleString("id-ID")}</td>
                    <td><code>{Number(o.tokens_purchased || 0).toLocaleString("id-ID")}</code></td>
                    <td>
                      <span className="success-tag" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Check size={12} /> {o.status === "paid" ? "Berhasil" : o.status}
                      </span>
                    </td>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px 0" }}>
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
