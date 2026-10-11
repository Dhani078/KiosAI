"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useKiosData } from "./hooks/useKiosData";
import { PAGE_HEADINGS } from "./components/constants";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import Toast from "./components/Toast";
import KeysTab from "./components/KeysTab";
import PackagesTab from "./components/PackagesTab";
import PlaygroundTab from "./components/PlaygroundTab";
import AnalyticsTab from "./components/AnalyticsTab";
import DocsTab from "./components/DocsTab";
import PaymentModal from "./components/PaymentModal";
import KeyModal from "./components/KeyModal";
import AuthModal from "./components/AuthModal";

export default function Home() {
  const [page, setPage] = useState("Beli Token");
  const [modal, setModal] = useState<"payment" | "create_key" | "revoke_key" | "auth" | null>(null);
  const [selectedPkgIndex, setSelectedPkgIndex] = useState(1);
  const [revokeKeyTarget, setRevokeKeyTarget] = useState<any>(null);
  const [toast, setToast] = useState("");

  const data = useKiosData();
  const user = data.currentUser || {
    id: "usr_kiosai_demo",
    full_name: "Demo User",
    email: "demo@kiosai.id",
    tier: "gold",
    balance_tokens: 1000000,
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast("Berhasil disalin ke clipboard");
    } catch {
      setToast("Gagal menyalin text");
    }
  };

  const heading = PAGE_HEADINGS[page] || PAGE_HEADINGS["Beli Token"];

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Langsung ke konten</a>
      <Sidebar
        page={page}
        setPage={setPage}
        user={user}
        onOpenAuth={() => setModal("auth")}
      />

      <div className="main-shell">
        <Header page={page} user={user} onOpenAuth={() => setModal("auth")} />
        <main id="main-content" tabIndex={-1}>
          <div className="page-heading">
            <div>
              <div className="eyebrow">{heading.eyebrow}</div>
              <h1>{heading.title}</h1>
              <p>{heading.desc}</p>
            </div>
            <div className="heading-note">
              <ShieldCheck size={16} /> Tanpa langganan. Tanpa komitmen.
            </div>
          </div>

          {page === "Beli Token" && (
            <PackagesTab
              balance={user.balance_tokens}
              activeTier={user.tier}
              onSelectPackage={(idx) => {
                setSelectedPkgIndex(idx);
                setModal("payment");
              }}
              onNavigateStatistik={() => setPage("Statistik")}
              onNavigateDocs={() => setPage("Dokumentasi")}
            />
          )}

          {page === "API Keys" && (
            <KeysTab
              keys={data.keys}
              loadingKeys={data.loading}
              onOpenCreateKey={() => setModal("create_key")}
              onOpenRevokeKey={(k) => {
                setRevokeKeyTarget(k);
                setModal("revoke_key");
              }}
              onCopy={copy}
              onNavigateDocs={() => setPage("Dokumentasi")}
            />
          )}

          {page === "Playground" && (
            <PlaygroundTab
              models={data.availableModels}
              userTier={user.tier}
              balance={user.balance_tokens}
              activeKey={data.keys[0]?.key_prefix ? `${data.keys[0].key_prefix}live` : ""}
              onNavigatePackages={() => setPage("Beli Token")}
              onRefreshUserData={data.fetchUserData}
            />
          )}

          {page === "Statistik" && (
            <AnalyticsTab
              balance={user.balance_tokens}
              analytics={data.analytics}
              orders={data.orders}
              onNavigatePackages={() => setPage("Beli Token")}
            />
          )}

          {page === "Dokumentasi" && (
            <DocsTab
              models={data.availableModels}
              activeKey={data.keys[0]?.key_prefix ? `${data.keys[0].key_prefix}...` : ""}
              onCopy={copy}
            />
          )}

          <footer>
            <span>© 2026 KiosAI. Dibangun untuk ide Anda.</span>
            <div>
              <span className="status-dot" /> Live TiDB Serverless
            </div>
          </footer>
        </main>
      </div>

      <BottomNav page={page} setPage={setPage} />

      {modal === "payment" && (
        <PaymentModal
          selectedPkgIndex={selectedPkgIndex}
          userId={user.id}
          userBalance={user.balance_tokens}
          onClose={() => setModal(null)}
          onPaymentSuccess={(newBal) => {
            data.fetchUserData();
            data.fetchOrders();
            setToast("Pembayaran berhasil! Token telah ditambahkan ke database.");
          }}
          onNavigateKeys={() => {
            setModal(null);
            setPage("API Keys");
          }}
          onNavigateStatistik={() => {
            setModal(null);
            setPage("Statistik");
          }}
        />
      )}

      {(modal === "create_key" || modal === "revoke_key") && (
        <KeyModal
          mode={modal === "create_key" ? "create" : "revoke"}
          keyToRevoke={revokeKeyTarget}
          userId={user.id}
          onClose={() => {
            setModal(null);
            setRevokeKeyTarget(null);
          }}
          onKeyCreated={() => {
            data.fetchKeys();
            setToast("API key baru berhasil dibuat di database TiDB.");
          }}
          onKeyRevoked={() => {
            data.fetchKeys();
            setToast("API key berhasil dinonaktifkan di TiDB.");
          }}
          onCopy={copy}
        />
      )}

      {modal === "auth" && (
        <AuthModal
          onClose={() => setModal(null)}
          onAuthSuccess={(u) => {
            data.setCurrentUser(u);
            data.refreshAll();
            setToast(`Selamat datang, ${u.full_name || u.name}!`);
          }}
        />
      )}

      <Toast toast={toast} setToast={setToast} />
    </div>
  );
}
