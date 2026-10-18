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
      <span className="eyebrow">CHECKOUT / QRIS</span>
      <h2>Scan. Bayar. Mulai.</h2>
      <p style={{ margin: "4px 0 12px", fontSize: "12px", color: "var(--text-muted)" }}>
        Scan dengan aplikasi perbankan atau e-wallet apa saja (BCA, Mandiri, BRI, DANA, GoPay, OVO, ShopeePay).
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
        <div className="qris-word">QRIS <span>PEMBAYARAN INSTAN</span></div>
        {qrisUrl ? (
          <img
            src={qrisUrl}
            alt="QRIS Dhani"
            style={{ width: "210px", height: "210px", objectFit: "contain", background: "#ffffff", padding: "8px", borderRadius: "10px", margin: "6px auto", display: "block" }}
          />
        ) : (
          <svg viewBox="0 0 210 210" aria-label="QRIS Code">
            {Array.from({ length: 29 * 29 }, (_, i) => {
              const x = i % 29, y = Math.floor(i / 29);
              const isCorner = (x < 7 && y < 7) || (x > 21 && y < 7) || (x < 7 && y > 21);
              return (isCorner || (x * 13 + y * 7 + x * y) % 5 < 2) ? (
                <rect key={i} x={x * 7 + 3} y={y * 7 + 3} width="7" height="7" />
              ) : null;
            })}
          </svg>
        )}
        <small>MERCHANT: DHANI (DANA) · ORDER: {orderId ? orderId.slice(0, 16) : "Membuat order..."}</small>
      </div>

      <div className="countdown">
        <Clock3 size={16} /> Selesaikan dalam <code>{Math.floor(countdown / 60).toString().padStart(2, "0")}:{(countdown % 60).toString().padStart(2, "0")}</code>
      </div>

      {/* AI Receipt Upload Card */}
      <div style={{ margin: "8px 0", padding: "12px", background: "var(--canvas)", border: "1px dashed var(--primary)", borderRadius: "var(--radius-input)", textAlign: "center" }}>
        <label style={{ cursor: aiLoading ? "wait" : "pointer", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--primary)", fontWeight: 600 }}>
          <Camera size={15} /> {aiLoading ? "AI Sedang Memeriksa Struk..." : "Unggah Bukti Struk (AI Auto-Verify)"}
          <input type="file" accept="image/*" disabled={aiLoading || !orderId} onChange={onUploadReceipt} style={{ display: "none" }} />
        </label>
        <p style={{ margin: "4px 0 0", fontSize: "11px", color: "var(--text-muted)" }}>
          Foto struk transfer Anda. AI memverifikasi nominal & status dalam 1-2 detik.
        </p>
        {aiError && <p style={{ color: "var(--danger, #ef4444)", fontSize: "11px", margin: "6px 0 0" }}>{aiError}</p>}
      </div>

      {paymentUrl && (
        <a href={paymentUrl} target="_blank" rel="noreferrer" className="button primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "8px", textDecoration: "none" }}>
          Bayar via DOKU Checkout &rarr;
        </a>
      )}

      <Button kind={paymentUrl ? "secondary" : "primary"} loading={loading} disabled={!orderId || countdown <= 0} onClick={onConfirmPay}>
        Saya sudah bayar <CheckCheck size={17} />
      </Button>
    </>
  );
}

export default PaymentQrContent;
