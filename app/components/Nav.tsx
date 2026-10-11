import { Key, Coins, Code2, Bot, BarChart3 } from "lucide-react";
import { useKios } from "../hooks/KiosContext";

export function Nav() {
  const { activeTab, setActiveTab } = useKios();
  return (
      <nav className="flex gap-2 my-6 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("keys")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "keys"
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Key className="h-4 w-4" /> Kelola API Keys
        </button>
        <button
          onClick={() => setActiveTab("packages")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "packages"
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Coins className="h-4 w-4" /> Beli Token (QRIS)
        </button>
        <button
          onClick={() => setActiveTab("playground")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "playground"
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Bot className="h-4 w-4" /> Live AI Playground
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "analytics"
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <BarChart3 className="h-4 w-4" /> Statistik & Log Penggunaan
        </button>
        <button
          onClick={() => setActiveTab("docs")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "docs"
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Code2 className="h-4 w-4" /> Dokumentasi SDK
        </button>
      </nav>
  );
}
