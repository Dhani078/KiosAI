"use client";

import { useState } from "react";
import { Clock3, CheckCheck, Camera, Copy, Check } from "lucide-react";
import { Badge, Button } from "./ui";

export function PaymentQrContent({
  exactAmount,
  basePrice,
  uniqueCode,
  orderId,
  countdown,
  aiLoading,
  aiError,
  paymentUrl,
  qrisUrl,
  loading,
  onUploadReceipt,
  onConfirmPay,
}: {
  exactAmount: number | null;
  basePrice: string;
  uniqueCode: number;
  orderId: string | null;
  countdown: number;
  aiLoading: boolean;
  aiError: string;
  paymentUrl: string | null;
  qrisUrl?: string | null;
  loading: boolean;
  onUploadReceipt: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onConfirmPay: () => void;
}) {
  const [copiedAmount, setCopiedAmount] = useState(false);
  const displayAmount = exactAmount || Number(basePrice.replace(/\D/g, "")) || 0;

  const handleCopyAmount = () => {
    navigator.clipboard?.writeText(String(displayAmount));
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  return (
    <>
      <span className="eyebrow">CHECKOUT / DOKU</span>
      <h2>Bayar. Verifikasi. Mulai.</h2>
      <p style={{ margin: "4px 0 12px", fontSize: "12px", color: "var(--text-muted)" }}>
        Klik tombol di bawah untuk membuka halaman pembayaran DOKU resmi.
      </p>

      <div className="payment-summary" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Badge tier="PRO" />
        <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: "8px" }}>
          <div>
            <strong style={{ color: "var(--primary)", fontSize: "16px", fontFamily: "JetBrains Mono" }}>
              Rp {displayAmount.toLocaleString("id-ID")}
            </strong>
            {uniqueCode > 0 && (
              <small style={{ display: "block", fontSize: "10px", color: "var(--text-muted)" }}>
                Termasuk kode unik +{uniqueCode}
              </small>
            )}
          </div>
          <button
            type="button"
            onClick={handleCopyAmount}
            title="Salin nominal pembayaran"
            style={{ padding: "4px 8px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "11px", color: "var(--text)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
          >
            {copiedAmount ? <Check size={12} style={{ color: "var(--success)" }} /> : <Copy size={12} />}
            {copiedAmount ? "Disalin" : "Salin"}
          </button>
        </div>
      </div>

      <div className="qr-wrap">
        <div className="qris-word">DOKU <span>PEMBAYARAN AMAN</span></div>
        {paymentUrl ? (
          <div style={{ width: "240px", padding: "16px", margin: "12px auto", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "12px" }}>
              Pembayaran diproses melalui DOKU (Payment Gateway resmi).
            </p>
            <a href={paymentUrl} target="_blank" rel="noreferrer" className="button primary" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", textDecoration: "none", width: "100%" }}>
              Bayar via DOKU Checkout &rarr;
            </a>
          </div>
        ) : (
          <div style={{ width: "240px", height: "160px", display: "grid", placeItems: "center", color: "var(--text-muted)", fontSize: "12px", margin: "12px auto", border: "1px dashed var(--border)", borderRadius: "10px" }}>
            <span>Menyiapkan halaman pembayaran...</span>
          </div>
        )}
        <small>MERCHANT: BRN-0225-1792293648186 · ORDER: {orderId ? orderId.slice(0, 16) : "Membuat order..."}</small>
      </div>

      <div className="countdown">
        <Clock3 size={16} /> Selesaikan dalam <code>{Math.floor(countdown / 60).toString().padStart(2, "0")}:{(countdown % 60).toString().padStart(2, "0")}</code>
      </div>

      <Button kind="secondary" loading={loading} disabled={!orderId || countdown <= 0} onClick={onConfirmPay}>
        Cek Status Pembayaran <CheckCheck size={17} />
      </Button>
    </>
  );
}

export default PaymentQrContent;
