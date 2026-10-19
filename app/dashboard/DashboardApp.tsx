"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useKiosData } from "../hooks/useKiosData";
import { PAGE_HEADINGS } from "../components/constants";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import Toast from "../components/Toast";
import KeysTab from "../components/KeysTab";
import PackagesTab from "../components/PackagesTab";
import ModelsTab from "../components/ModelsTab";
import PlaygroundTab from "../components/PlaygroundTab";
import AnalyticsTab from "../components/AnalyticsTab";
import DocsTab from "../components/DocsTab";
import PaymentModal from "../components/PaymentModal";
import KeyModal from "../components/KeyModal";
import AuthModal from "../components/AuthModal";

export default function Dashboard() {
  const router = useRouter();
  const [page, setPage] = useState("Beli Token");
  const [modal, setModal] = useState<"payment" | "create_key" | "revoke_key" | "auth" | null>(null);
  const [selectedPkgIndex, setSelectedPkgIndex] = useState(1);
  const [revokeKeyTarget, setRevokeKeyTarget] = useState<any>(null);
  const [toast, setToast] = useState("");

  const data = useKiosData();
  const user = data.currentUser;
  const isAdmin = Boolean(user && (user.username === "adminfordhani" || user.email === "adminfordhani@kiosai.id"));

  const copy = async (t: string) => {
    try { await navigator.clipboard.writeText(t); setToast("Berhasil disalin ke clipboard"); }
    catch { setToast("Gagal menyalin text"); }
  };

  const heading = PAGE_HEADINGS[page] || PAGE_HEADINGS["Beli Token"];

  if (!user) {
    return (
      <div className="app-shell">
        <main id="main-content" style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
          <div className="skeleton-table" role="status" aria-live="polite">
            <div className="skeleton-row" /><div className="skeleton-row" /><div className="skeleton-row" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Langsung ke konten</a>
      <Sidebar page={page} setPage={setPage} user={user} onOpenAuth={() => setModal("auth")} />

      <div className="main-shell">
        <Header page={page} user={user} onOpenAuth={() => setModal("auth")} />
        <main id="main-content" tabIndex={-1}>
          {user.balance_tokens < 50000 && (
            <div className="warning-banner" role="alert" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>⚠️ Saldo token menipis ({user.balance_tokens.toLocaleString("id-ID")} token). Isi ulang agar API bot & aplikasi Anda tidak terputus.</span>
              <button className="button primary" style={{ height: "28px", fontSize: "11px", padding: "0 10px" }} onClick={() => setPage("Beli Token")}>Isi Ulang</button>
            </div>
          )}
          <div className="page-heading">
            <div>
              <div className="eyebrow">{heading.eyebrow}</div>
              <h1>{heading.title}</h1>
              <p>{page === "Statistik" && isAdmin ? "Semua riwayat penggunaan token dan transaksi tersimpan di database TiDB." : heading.desc}</p>
            </div>
            <div className="heading-note">
              <ShieldCheck size={16} /> Tanpa langganan. Tanpa komitmen.
            </div>
          </div>

          {page === "Beli Token" && (
            <PackagesTab
              balance={user.balance_tokens}
              activeTier={user.tier}
              isAdmin={isAdmin}
              onSelectPackage={(idx) => { setSelectedPkgIndex(idx); setModal("payment"); }}
              onNavigateStatistik={() => setPage("Statistik")}
              onNavigateDocs={() => setPage("Dokumentasi")}
            />
          )}

          {page === "API Keys" && (
            <KeysTab
              keys={data.keys}
              loadingKeys={data.loading}
              onOpenCreateKey={() => setModal("create_key")}
              onOpenRevokeKey={(k) => { setRevokeKeyTarget(k); setModal("revoke_key"); }}
              onCopy={copy}
              onNavigateDocs={() => setPage("Dokumentasi")}
            />
          )}

          {page === "Model" && (
            <ModelsTab
              models={data.availableModels}
              userTier={user.tier}
              activeKey={data.playgroundKey}
              isAdmin={isAdmin}
              onNavigatePlayground={(mId) => {
                if (mId && typeof window !== "undefined") sessionStorage.setItem("kios_selected_model", mId);
                setPage("Playground");
              }}
              onNavigatePackages={() => setPage("Beli Token")} onCopy={copy}
            />
          )}

          {page === "Playground" && (
            <PlaygroundTab
              models={data.availableModels}
              userTier={user.tier}
              balance={user.balance_tokens}
              activeKey={data.playgroundKey}
              isAdmin={isAdmin}
              onNavigatePackages={() => setPage("Beli Token")}
              onRefreshUserData={() => { data.fetchUserData(); data.fetchAnalytics(); }}
            />
          )}

          {page === "Statistik" && (
            <AnalyticsTab
              balance={user.balance_tokens}
              lockedBonus={user.locked_bonus_tokens || 0}
              analytics={data.analytics}
              orders={data.orders}
              isAdmin={isAdmin}
              onNavigatePackages={() => setPage("Beli Token")}
            />
          )}

          {page === "Dokumentasi" && (
            <DocsTab
              models={data.availableModels}
              activeKey={data.keys[0]?.key_prefix ? `${data.keys[0].key_prefix}...` : ""}
              isAdmin={isAdmin}
              onCopy={copy}
            />
          )}

          <footer>
            <span>© 2026 TokoAI. Dibangun untuk ide Anda.</span>
            <div><span className="status-dot" /> Live {isAdmin ? "TiDB" : "Cloud"} Serverless</div>
          </footer>
        </main>
      </div>

      <BottomNav page={page} setPage={setPage} />

          {modal === "payment" && (
            <PaymentModal
              selectedPkgIndex={selectedPkgIndex}
              userId={user.id}
              userBalance={user.balance_tokens}
              isAdmin={isAdmin}
              onClose={() => setModal(null)}
              onPaymentSuccess={() => { data.fetchUserData(); data.fetchOrders(); setToast("Pembayaran berhasil! Token telah ditambahkan ke database."); }}
              onNavigateKeys={() => { setModal(null); setPage("API Keys"); }}
              onNavigateStatistik={() => { setModal(null); setPage("Statistik"); }}
            />
          )}

          {(modal === "create_key" || modal === "revoke_key") && (
            <KeyModal
              mode={modal === "create_key" ? "create" : "revoke"}
              keyToRevoke={revokeKeyTarget}
              userId={user.id}
              isAdmin={isAdmin}
              onClose={() => { setModal(null); setRevokeKeyTarget(null); }}
              onKeyCreated={() => { data.fetchKeys(); setToast("API key berhasil dibuat."); }}
              onKeyRevoked={() => { data.fetchKeys(); setToast("API key berhasil dinonaktifkan."); }}
              onCopy={copy}
            />
          )}

      {modal === "auth" && (
        <AuthModal
          currentUser={data.currentUser}
          onClose={() => setModal(null)}
          onNavigatePackages={() => { setModal(null); setPage("Beli Token"); }}
          onCopy={copy}
          onAuthSuccess={(u) => {
            data.setCurrentUser(u); data.refreshAll(); setModal(null);
            setToast(`Selamat datang, ${u.full_name || u.name}!`);
          }}
          onLogout={() => { data.setCurrentUser(null); router.replace("/"); }}
        />
      )}

      <Toast toast={toast} setToast={setToast} />
    </div>
  );
}
