"use client";

import { KiosProvider } from "./hooks/KiosContext";
import { useKiosData } from "./hooks/useKiosData";
import { useKiosActions } from "./hooks/useKiosActions";
import { Header } from "./components/Header";
import { Nav } from "./components/Nav";
import { KeysTab } from "./components/KeysTab";
import { PackagesTab } from "./components/PackagesTab";
import { PlaygroundTab } from "./components/PlaygroundTab";
import { AnalyticsTab } from "./components/AnalyticsTab";
import { DocsTab } from "./components/DocsTab";
import { AuthModal } from "./components/AuthModal";

export default function Home() {
  const data = useKiosData();
  const actions = useKiosActions(data);
  return (
    <KiosProvider value={{ ...data, ...actions }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Header />
        <Nav />
        {data.activeTab === "keys" && <KeysTab />}
        {data.activeTab === "packages" && <PackagesTab />}
        {data.activeTab === "playground" && <PlaygroundTab />}
        {data.activeTab === "analytics" && <AnalyticsTab />}
        {data.activeTab === "docs" && <DocsTab />}
        {data.showAuthModal && <AuthModal />}
      </div>
    </KiosProvider>
  );
}
