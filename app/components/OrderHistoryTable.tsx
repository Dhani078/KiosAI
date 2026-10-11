"use client";

import { Check } from "lucide-react";
import { Badge, TableRow } from "./ui";

export function OrderHistoryTable({ orders }: { orders: any[] }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Riwayat pembelian</h2>
        <span>Semua transaksi dari database TiDB</span>
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
                      <Badge tier={(o.package_tier || "bronze").toUpperCase()} />
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
