"use client";

import { CheckCheck, ArrowRight, Printer } from "lucide-react";
import { Badge, Button } from "./ui";

export function PaymentSuccess({
  tokensGranted,
  userBalance,
  isAdmin = false,
  tierKey,
  isFree,
  onNavigateKeys,
  onNavigateStatistik,
  onPrintReceipt,
}: {
  tokensGranted: number;
  userBalance: number;
  isAdmin?: boolean;
  tierKey: string;
  isFree: boolean;
  onNavigateKeys: () => void;
  onNavigateStatistik: () => void;
  onPrintReceipt: () => void;
}) {
  return (
    <div className="payment-success">
      <div className="payment-success-icon"><CheckCheck size={32} /></div>
      <span className="eyebrow">PAYMENT / BERHASIL</span>
      <h2>Token sudah masuk ke akun Anda.</h2>
      <p><strong>{tokensGranted.toLocaleString("id-ID")} token</strong> berhasil ditambahkan{isAdmin ? " ke TiDB" : ""}.</p>
      <div className="success-summary">
        <span>Saldo sekarang</span>
        <code>{(Number(userBalance) + Number(tokensGranted)).toLocaleString("id-ID")} token</code>
      </div>
      <div className="success-summary">
        <span>Tier aktif</span>
        <Badge tier={tierKey === "free" ? "FREE" : "PRO"} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
        <Button kind="primary" onClick={onNavigateKeys}>Lanjut ke API Keys <ArrowRight size={16} /></Button>
        {!isFree && (
          <Button kind="secondary" onClick={onPrintReceipt} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <Printer size={15} /> Cetak Faktur / Kwitansi Resmi
          </Button>
        )}
        <Button kind="ghost" onClick={onNavigateStatistik}>Lihat riwayat transaksi</Button>
      </div>
    </div>
  );
}

export default PaymentSuccess;
