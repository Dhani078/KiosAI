"use client";

import { useState, useEffect } from "react";
import { X, Gift, CheckCheck, ExternalLink, Loader2 } from "lucide-react";
import { Badge, Button } from "./ui";
import { getPackages } from "./PackagesTab";
import { generateInvoiceHtml } from "@/lib/receipt-generator";
import { PaymentSuccess } from "./PaymentSuccess";

interface ModalProps {
  selectedPkgIndex: number;
  userId: string;
  userBalance: number;
  isAdmin?: boolean;
  onClose: () => void;
  onPaymentSuccess: (b: number) => void;
  onNavigateKeys: () => void;
  onNavigateStatistik: () => void;
}

export function PaymentModal(props: ModalProps) {
  const { selectedPkgIndex, userId, userBalance, isAdmin, onClose, onPaymentSuccess } = props;
  const pkg = getPackages(isAdmin)[selectedPkgIndex] || getPackages(isAdmin)[0];
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
        if (d.paymentUrl) setPaymentUrl(d.paymentUrl);
      })
      .catch((e) => console.error("Order init error", e))
      .finally(() => setLoading(false));
    return () => { active = false; };
  }, [userId, pkg.tierKey]);

  useEffect(() => {
    if (!orderId || paid || isFree) return;
    const t = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders?orderId=${encodeURIComponent(orderId)}`);
        const data = await res.json();
        if (data.status === "paid" || data.order?.status === "paid") {
          setPaid(true);
          onPaymentSuccess(Number(userBalance) + Number(data.order?.tokens_purchased || tokensGranted));
        }
      } catch (err) {
        console.error("Poll err", err);
      }
    }, 2500);
    return () => clearInterval(t);
  }, [orderId, paid, isFree, userBalance, tokensGranted, onPaymentSuccess]);

  useEffect(() => {
    const handleMsg = (e: MessageEvent) => {
      if (["https://checkout.doku.com", "https://jokul.doku.com"].includes(e.origin) && e.data?.func === "closeJokul") onClose();
    };
    window.addEventListener("message", handleMsg);
    return () => window.removeEventListener("message", handleMsg);
  }, [onClose]);

  const handleConfirmFree = async () => {
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
      }
    } catch (e: any) {
      console.error("Free err", e.message);
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

  const iframeSrc = paymentUrl
    ? (paymentUrl.includes("?") ? `${paymentUrl}&view=iframe` : `${paymentUrl}?view=iframe`)
    : "";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section role="dialog" aria-modal="true" className="modal" style={{ maxWidth: isFree ? "480px" : "560px", width: "95%", padding: "20px" }} onClick={(e) => e.stopPropagation()}>
        <button aria-label="Tutup" className="modal-close" onClick={onClose}><X size={20} /></button>
        {paid ? (
          <PaymentSuccess tokensGranted={tokensGranted} userBalance={userBalance} isAdmin={isAdmin} tierKey={pkg.tierKey} isFree={isFree} onNavigateKeys={props.onNavigateKeys} onNavigateStatistik={props.onNavigateStatistik} onPrintReceipt={handlePrintReceipt} />
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
            <Button kind="primary" loading={loading} disabled={!orderId} onClick={handleConfirmFree}>
              Klaim {pkg.name} <CheckCheck size={17} />
            </Button>
          </>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <span className="eyebrow" style={{ display: "block", marginBottom: "2px" }}>CHECKOUT / QRIS DOKU</span>
                <h2 style={{ fontSize: "18px", margin: 0 }}>{pkg.name} · Rp {Number(pkg.price.replace(/\D/g, "")).toLocaleString("id-ID")}</h2>
              </div>
              <Badge tier="PRO" />
            </div>
            {loading || !paymentUrl ? (
              <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--canvas)", borderRadius: "10px", border: "1px solid var(--border)" }}>
                <Loader2 size={32} className="spin" style={{ color: "var(--primary)", margin: "0 auto 12px" }} />
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>Menyiapkan QRIS DOKU...</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <iframe src={iframeSrc} style={{ width: "100%", height: "480px", border: "1px solid var(--border)", borderRadius: "10px", background: "#ffffff" }} title="DOKU QRIS Checkout" />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "var(--text-muted)" }}>
                  <span>Scan via BCA, Mandiri, BRI, GoPay, DANA, OVO</span>
                  <a href={paymentUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", display: "inline-flex", alignItems: "center", gap: "4px", textDecoration: "underline" }}>
                    Buka Tab Penuh <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default PaymentModal;
