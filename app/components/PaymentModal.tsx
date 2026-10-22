"use client";

import { useState, useEffect } from "react";
import { X, Gift, CheckCheck } from "lucide-react";
import { Badge, Button } from "./ui";
import { PACKAGES, getPackages } from "./PackagesTab";
import { generateInvoiceHtml } from "@/lib/receipt-generator";
import { PaymentSuccess } from "./PaymentSuccess";

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
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);
  const [tokensGranted, setTokensGranted] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
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
        setTokensGranted(d.tokensPurchased || 0);
        if (d.paymentUrl) {
          // Auto-redirect ke DOKU checkout setelah 2 detik
          setTimeout(() => {
            if (active) {
              window.location.href = d.paymentUrl;
            }
          }, 2000);
        }
      })
      .catch((e) => console.error("Order creation failed", e))
      .finally(() => setLoading(false));
    return () => { active = false; };
  }, [userId, pkg.tierKey]);

  useEffect(() => {
    if (paid || isFree) return;
    // Removed countdown logic - not needed for DOKU redirect
  }, [paid, isFree]);

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
        console.error("Payment not confirmed:", data.error);
      }
    } catch (e: any) {
      console.error("Payment check failed:", e.message);
    } finally {
      setLoading(false);
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
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ width: "60px", height: "60px", margin: "0 auto 16px", border: "3px solid var(--primary)", borderTop: "3px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <h3 style={{ fontSize: "18px", margin: "0 0 8px", color: "var(--text)" }}>Membuka Halaman Pembayaran</h3>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 16px" }}>
              Anda akan diarahkan ke DOKU Payment Gateway dalam beberapa saat...
            </p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", background: "var(--surface)", borderRadius: "8px", border: "1px solid var(--border)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <rect width="24" height="24" rx="4" fill="#E31E24"/>
                <path d="M7 12h10M12 7v10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Powered by DOKU</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default PaymentModal;
