"use client";

import { useState, useEffect } from "react";
import { X, Clock3, CheckCheck, ArrowRight, Gift } from "lucide-react";
import { Badge, Button } from "./ui";
import { PACKAGES } from "./PackagesTab";

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
  const pkg = PACKAGES[selectedPkgIndex] || PACKAGES[0];
  const isFree = pkg.price === "0" || pkg.tierKey === "free";
  const [orderId, setOrderId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(899);
  const [loading, setLoading] = useState(false);
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
        if (active && d.orderId) {
          setOrderId(d.orderId);
          setTokensGranted(d.tokensPurchased || 0);
        }
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <section role="dialog" aria-modal="true" className="modal" onClick={(e) => e.stopPropagation()}>
        <button aria-label="Tutup" className="modal-close" onClick={onClose}><X size={20} /></button>

        {paid ? (
          <div className="payment-success">
            <div className="payment-success-icon"><CheckCheck size={32} /></div>
            <span className="eyebrow">PAYMENT / BERHASIL</span>
            <h2>Token sudah masuk ke akun Anda.</h2>
            <p><strong>{tokensGranted.toLocaleString("id-ID")} token</strong> berhasil ditambahkan{isAdmin ? " ke TiDB" : ""}.</p>
            <div className="success-summary"><span>Saldo sekarang</span><code>{(Number(userBalance) + Number(tokensGranted)).toLocaleString("id-ID")} token</code></div>
            <div className="success-summary"><span>Tier aktif</span><Badge tier={pkg.tierKey === "free" ? "FREE" : "PRO"} /></div>
            <Button kind="primary" onClick={onNavigateKeys}>Lanjut ke API Keys <ArrowRight size={16} /></Button>
            <Button kind="ghost" onClick={onNavigateStatistik}>Lihat riwayat transaksi</Button>
          </div>
        ) : isFree ? (
          <>
            <span className="eyebrow">FREE TIER</span>
            <h2>Klaim Token Gratis Anda</h2>
            <p>Uji coba langsung ke akun Anda tanpa perlu pembayaran.</p>
            <div className="payment-summary"><Badge tier={pkg.tierKey === "free" ? "FREE" : "PRO"} /><strong>Gratis (Rp 0)</strong></div>
            <div style={{ textAlign: "center", padding: "24px 16px", background: "var(--canvas)", borderRadius: "var(--radius-card)", border: "1px solid var(--border)", margin: "16px 0" }}>
              <Gift size={34} style={{ color: "var(--primary)", margin: "0 auto 8px" }} />
              <h3 style={{ fontSize: "15px", margin: "0 0 4px" }}>{pkg.tokens} Token Siap Pakai</h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>Akses model Atria Dawn.</p>
            </div>
            <Button kind="primary" loading={loading} disabled={!orderId} onClick={handleConfirmPay}>
              Klaim {pkg.name} <CheckCheck size={17} />
            </Button>
            <small className="modal-note">Token otomatis masuk ke akun Anda di database{isAdmin ? " TiDB" : ""}.</small>
          </>
        ) : (
          <>
            <span className="eyebrow">CHECKOUT / QRIS</span>
            <h2>Scan. Bayar. Mulai.</h2>
            <p>Gunakan e-wallet atau mobile banking QRIS apa saja.</p>
            <div className="payment-summary"><Badge tier="PRO" /><strong>Rp {pkg.price}</strong></div>
            <div className="qr-wrap">
              <div className="qris-word">QRIS <span>PEMBAYARAN INSTAN</span></div>
              <svg viewBox="0 0 210 210" aria-label="QRIS Code">
                {Array.from({ length: 29 * 29 }, (_, i) => {
                  const x = i % 29, y = Math.floor(i / 29);
                  const isCorner = (x < 7 && y < 7) || (x > 21 && y < 7) || (x < 7 && y > 21);
                  return (isCorner || (x * 13 + y * 7 + x * y) % 5 < 2) ? (
                    <rect key={i} x={x * 7 + 3} y={y * 7 + 3} width="7" height="7" />
                  ) : null;
                })}
              </svg>
              <small>ORDER ID: {orderId ? orderId.slice(0, 18) : "Membuat order..."}</small>
            </div>
            <div className="countdown">
              <Clock3 size={16} />
              Selesaikan dalam <code>{Math.floor(countdown / 60).toString().padStart(2, "0")}:{(countdown % 60).toString().padStart(2, "0")}</code>
            </div>
            <Button kind="primary" loading={loading} disabled={!orderId || countdown <= 0} onClick={handleConfirmPay}>
              Saya sudah bayar <CheckCheck size={17} />
            </Button>
            <small className="modal-note">Simulasi pembayaran langsung mengupdate status order dan saldo token di database{isAdmin ? " TiDB" : ""}.</small>
          </>
        )}
      </section>
    </div>
  );
}

export default PaymentModal;
