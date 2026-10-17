export function generateInvoiceHtml(order: {
  id: string;
  created_at?: string;
  package_tier?: string;
  amount_idr?: number;
  tokens_purchased?: number;
  status?: string;
}): string {
  const dateStr = order.created_at
    ? new Date(order.created_at).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

  const amount = Number(order.amount_idr || 0);
  const tokens = Number(order.tokens_purchased || 0);
  const tierName = (order.package_tier || "free").toUpperCase();

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Bukti Pembayaran - ${order.id}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111; max-width: 600px; margin: auto; }
    .header { border-bottom: 2px solid #F28C38; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
    .logo { font-size: 24px; font-weight: 800; color: #F28C38; letter-spacing: -0.5px; }
    .receipt-title { font-size: 14px; color: #666; }
    .meta { margin-bottom: 24px; font-size: 13px; color: #555; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { text-align: left; padding: 8px 0; border-bottom: 1px solid #ddd; font-size: 12px; color: #666; }
    td { padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; }
    .total { font-size: 18px; font-weight: 700; color: #111; text-align: right; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; background: #e6f4ea; color: #137333; }
    .footer { font-size: 11px; color: #888; text-align: center; margin-top: 40px; border-top: 1px solid #eee; padding-top: 16px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">TokoAI</div>
      <div class="receipt-title">Gateway API & Pasar Token AI Indonesia</div>
    </div>
    <div class="badge">LUNAS / PAID</div>
  </div>
  <div class="meta">
    <div><strong>No. Referensi:</strong> ${order.id}</div>
    <div><strong>Waktu Transaksi:</strong> ${dateStr}</div>
    <div><strong>Metode Pembayaran:</strong> QRIS Instant Settlement</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>DESKRIPSI ITEM</th>
        <th style="text-align: right;">JUMLAH TOKEN</th>
        <th style="text-align: right;">SUBTOTAL</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Paket Langganan TokoAI <strong>${tierName}</strong></td>
        <td style="text-align: right; font-family: monospace;">${tokens.toLocaleString("id-ID")}</td>
        <td style="text-align: right;">Rp ${amount.toLocaleString("id-ID")}</td>
      </tr>
    </tbody>
  </table>
  <div class="total">Total Bayar: Rp ${amount.toLocaleString("id-ID")}</div>
  <div class="footer">
    Dokumen ini adalah bukti pembayaran digital yang sah dari platform TokoAI (tokoai.my.id).
  </div>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;
}
