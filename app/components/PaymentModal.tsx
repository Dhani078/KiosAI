"use client";

import { useState, useEffect } from "react";
import { X, Gift, CheckCheck } from "lucide-react";
import { Badge, Button } from "./ui";
import { PACKAGES, getPackages } from "./PackagesTab";
import { generateInvoiceHtml } from "@/lib/receipt-generator";
import { PaymentSuccess } from "./PaymentSuccess";
import { PaymentQrContent } from "./PaymentQrContent";

export function PaymentModal({
  selectedPkgIndex,
  userId,
  userBalance,
  isAdmin = false,
  onClose,
  onPaymentSuccess,
  onNavigateKeys,
  onNavigateStatistik,
}: {
  selectedPkgIndex: number;
  userId: string;
  userBalance: number;
  isAdmin?: boolean;
  onClose: () => void;
  onPaymentSuccess: (newBalance: number) => void;
  onNavigateKeys: () => void;
  onNavigateStatistik: () => void;
}) {
  const packages = getPackages(isAdmin);
  const pkg = packages[selectedPkgIndex] || packages[0];
  const isFree = pkg.price === "0" || pkg.tierKey === "free";
  const [orderId, setOrderId] = useState<string | null>(null);
  const [exactAmount, setExactAmount] = useState<number | null>(null);
  const [uniqueCode, setUniqueCode] = useState(0);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [qrisUrl, setQrisUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(899);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [paid, setPaid] = useState(false);
  const [tokensGranted, setTokensGranted] = useState(0);

  useEffect(() => {
    let active = true;
    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, tier: pkg.tierKey }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!active || !d.orderId) return;
        setOrderId(d.orderId);
        setExactAmount(d.amountIdr || null);
        setUniqueCode(d.uniqueCode || 0);
        setTokensGranted(d.tokensPurchased || 0);
        if (d.paymentUrl) setPaymentUrl(d.paymentUrl);
        if (d.qrisUrl) setQrisUrl(d.qrisUrl);
      })
      .catch((e) => console.error("Order creation failed", e));
    return () => { active = false; };
  }, [userId, pkg.tierKey]);

  useEffect(() => {
    if (paid || countdown <= 0 || isFree) return;
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [paid, countdown, isFree]);

  const handleConfirmPay = async () => {
    if (!orderId || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/orders/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPaid(true);
        onPaymentSuccess(Number(userBalance) + Number(data.tokensAdded || tokensGranted));
      } else {
        alert(data.error || "Gagal memproses pembayaran");
      }
    } catch (e: any) {
      alert(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orderId) return;
    setAiLoading(true);
    setAiError("");
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await fetch("/api/orders/verify-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, imageBase64: base64, mimeType: file.type }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setPaid(true);
          onPaymentSuccess(Number(userBalance) + Number(data.tokensAdded || tokensGranted));
        } else {
          setAiError(data.error || "Bukti transfer tidak valid");
        }
        setAiLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setAiError(err.message || "Gagal membaca file gambar");
      setAiLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!orderId) return;
    const html = generateInvoiceHtml({
      id: orderId,
      created_at: new Date().toISOString(),
      package_tier: pkg.tierKey,
      amount_idr: exactAmount || Number(pkg.price.replace(/\D/g, "")) || 0,
      tokens_purchased: tokensGranted,
      status: "paid",
    });
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section role="dialog" aria-modal="true" className="modal" onClick={(e) => e.stopPropagation()}>
        <button aria-label="Tutup" className="modal-close" onClick={onClose}><X size={20} /></button>

        {paid ? (
          <PaymentSuccess
            tokensGranted={tokensGranted}
            userBalance={userBalance}
            isAdmin={isAdmin}
            tierKey={pkg.tierKey}
            isFree={isFree}
            onNavigateKeys={onNavigateKeys}
            onNavigateStatistik={onNavigateStatistik}
            onPrintReceipt={handlePrintReceipt}
          />
        ) : isFree ? (
          <>
            <span className="eyebrow">FREE TIER</span>
            <h2>Klaim Token Gratis Anda</h2>
            <p>Uji coba langsung ke akun Anda tanpa perlu pembayaran.</p>
            <div className="payment-summary"><Badge tier="FREE" /><strong>Gratis (Rp 0)</strong></div>
            <div style={{ textAlign: "center", padding: "20px 16px", background: "var(--canvas)", borderRadius: "var(--radius-card)", border: "1px solid var(--border)", margin: "14px 0" }}>
              <Gift size={32} style={{ color: "var(--primary)", margin: "0 auto 6px" }} />
              <h3 style={{ fontSize: "15px", margin: "0 0 4px" }}>{pkg.tokens} Token Siap Pakai</h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>Akses model Atria Dawn.</p>
            </div>
            <Button kind="primary" loading={loading} disabled={!orderId} onClick={handleConfirmPay}>
              Klaim {pkg.name} <CheckCheck size={17} />
            </Button>
          </>
        ) : (
          <PaymentQrContent
            exactAmount={exactAmount}
            basePrice={pkg.price}
            uniqueCode={uniqueCode}
            orderId={orderId}
            countdown={countdown}
            aiLoading={aiLoading}
            aiError={aiError}
            paymentUrl={paymentUrl}
            qrisUrl={qrisUrl}
            loading={loading}
            onUploadReceipt={handleUploadReceipt}
            onConfirmPay={handleConfirmPay}
          />
        )}
      </section>
    </div>
  );
}

export default PaymentModal;
