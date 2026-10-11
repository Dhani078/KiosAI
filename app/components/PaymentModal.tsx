"use client";

import { useState, useEffect } from "react";
import { X, Clock3, CheckCheck, ArrowRight, LoaderCircle } from "lucide-react";
import { Badge, Button } from "./ui";
import { PACKAGES } from "./PackagesTab";

export function PaymentModal({
  selectedPkgIndex,
  userId,
  userBalance,
  onClose,
  onPaymentSuccess,
  onNavigateKeys,
  onNavigateStatistik,
}: {
  selectedPkgIndex: number;
  userId: string;
  userBalance: number;
  onClose: () => void;
  onPaymentSuccess: (newBalance: number) => void;
  onNavigateKeys: () => void;
  onNavigateStatistik: () => void;
}) {
  const pkg = PACKAGES[selectedPkgIndex] || PACKAGES[0];
  const [orderId, setOrderId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(899);
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);
  const [tokensGranted, setTokensGranted] = useState(0);

  // 1. Create real order in TiDB
  useEffect(() => {
    let active = true;
    async function createRealOrder() {
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, tier: pkg.tierKey }),
        });
        const data = await res.json();
        if (active && data.orderId) {
          setOrderId(data.orderId);
          setTokensGranted(data.tokensPurchased || 0);
        }
      } catch (e) {
        console.error("Order creation failed", e);
      }
    }
    createRealOrder();
    return () => {
      active = false;
    };
  }, [userId, pkg.tierKey]);

  // 2. Countdown timer
  useEffect(() => {
    if (paid || countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [paid, countdown]);

  // 3. Confirm real payment in TiDB
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
        onPaymentSuccess(userBalance + (data.tokensAdded || tokensGranted));
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
      <section
        role="dialog"
        aria-modal="true"
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button aria-label="Tutup" className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        {paid ? (
          <div className="payment-success">
            <div className="payment-success-icon">
              <CheckCheck size={32} />
            </div>
            <span className="eyebrow">PAYMENT / BERHASIL</span>
            <h2>Token sudah masuk ke akun Anda.</h2>
            <p>
              <strong>{tokensGranted.toLocaleString("id-ID")} token</strong> telah berhasil ditambahkan ke database TiDB.
            </p>
            <div className="success-summary">
              <span>Saldo sekarang</span>
              <code>{(userBalance + tokensGranted).toLocaleString("id-ID")} token</code>
            </div>
            <div className="success-summary">
              <span>Tier aktif</span>
              <Badge tier={pkg.name} />
            </div>
            <Button kind="primary" onClick={onNavigateKeys}>
              Lanjut ke API Keys <ArrowRight size={16} />
            </Button>
            <Button kind="ghost" onClick={onNavigateStatistik}>
              Lihat riwayat transaksi
            </Button>
          </div>
        ) : (
          <>
            <span className="eyebrow">CHECKOUT / QRIS</span>
            <h2>Scan. Bayar. Mulai.</h2>
            <p>Gunakan e-wallet atau mobile banking QRIS apa saja.</p>

            <div className="payment-summary">
              <Badge tier={pkg.name} />
              <strong>Rp {pkg.price}</strong>
            </div>

            <div className="qr-wrap">
              <div className="qris-word">
                QRIS <span>PEMBAYARAN INSTAN</span>
              </div>
              <svg viewBox="0 0 210 210" aria-label="QRIS Code">
                {Array.from({ length: 29 * 29 }, (_, i) => {
                  const x = i % 29;
                  const y = Math.floor(i / 29);
                  const finder = (a: number, b: number) =>
                    x >= a && x < a + 7 && y >= b && y < b + 7
                      ? x === a || x === a + 6 || y === b || y === b + 6 ||
                        (x >= a + 2 && x <= a + 4 && y >= b + 2 && y <= b + 4)
                      : null;
                  const f = finder(0, 0) ?? finder(22, 0) ?? finder(0, 22);
                  return (f ?? (x * 13 + y * 7 + x * y) % 5 < 2) ? (
                    <rect key={i} x={x * 7 + 3} y={y * 7 + 3} width="7" height="7" />
                  ) : null;
                })}
              </svg>
              <small>ORDER ID: {orderId ? orderId.slice(0, 18) : "Membuat order..."}</small>
            </div>

            <div className="countdown">
              <Clock3 size={16} />
              Selesaikan dalam{" "}
              <code>
                {Math.floor(countdown / 60).toString().padStart(2, "0")}:
                {(countdown % 60).toString().padStart(2, "0")}
              </code>
            </div>

            <Button
              kind="primary"
              loading={loading}
              disabled={!orderId || countdown <= 0}
              onClick={handleConfirmPay}
            >
              Saya sudah bayar <CheckCheck size={17} />
            </Button>
            <small className="modal-note">
              Simulasi pembayaran langsung mengupdate status order dan saldo token di database TiDB.
            </small>
          </>
        )}
      </section>
    </div>
  );
}
export default PaymentModal;
