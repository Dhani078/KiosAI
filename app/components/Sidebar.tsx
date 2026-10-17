"use client";

import {
  KeyRound,
  CreditCard,
  MessageSquare,
  BarChart3,
  BookOpen,
  Terminal,
  ArrowUpRight,
  HelpCircle,
  LogOut,
  ChevronDown,
  Sparkles,
  Cpu,
} from "lucide-react";
import Link from "next/link";
import Logo from "./Logo";

export interface NavItem {
  name: string;
  short: string;
  icon: any;
}

export const navigation: NavItem[] = [
  { name: "API Keys", short: "Keys", icon: KeyRound },
  { name: "Beli Token", short: "Beli", icon: CreditCard },
  { name: "Model", short: "Model", icon: Cpu },
  { name: "Playground", short: "Playground", icon: MessageSquare },
  { name: "Statistik", short: "Statistik", icon: BarChart3 },
  { name: "Dokumentasi", short: "Docs", icon: BookOpen },
];

export function Sidebar({
  page,
  setPage,
  user,
  onOpenAuth,
}: {
  page: string;
  setPage: (p: string) => void;
  user: any;
  onOpenAuth: () => void;
}) {
  const userName = user?.full_name || user?.name || "Demo User";
  const userEmail = user?.email || "demo@kiosai.id";
  const initials = userName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="sidebar">
      <Logo />
      <div
        className="workspace"
        onClick={onOpenAuth}
        style={{ cursor: "pointer" }}
        role="button"
        tabIndex={0}
        aria-label="Profil Akun"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onOpenAuth(); }}
      >
        <div className="workspace-avatar" style={{ overflow: "hidden" }}>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={userName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            initials[0] || "K"
          )}
        </div>
        <div>
          <strong>{userName}</strong>
          <small>{userEmail}</small>
        </div>
        <ChevronDown size={15} />
      </div>
      <div className="nav-label">WORKSPACE</div>
      <nav aria-label="Navigasi workspace">
        {navigation.map((n) => (
          <button
            key={n.name}
            aria-label={n.name}
            aria-current={page === n.name ? "page" : undefined}
            className={`nav-item ${page === n.name ? "active" : ""}`}
            onClick={() => setPage(n.name)}
          >
            <n.icon size={19} />
            <span>{n.name}</span>
            {n.name === "Beli Token" && <span className="nav-new">TOP UP</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="help-box">
          <div className="help-title">
            <Terminal size={18} />
            Dibuat untuk developer.
          </div>
          <p>Satu API. Banyak kemungkinan.</p>
          <button onClick={() => setPage("Dokumentasi")}>
            Mulai integrasi <ArrowUpRight size={15} />
          </button>
        </div>
        <Link
          href="/"
          className="support-link"
          style={{ textDecoration: "none" }}
        >
          <Sparkles size={17} />
          Beranda Publik
          <ArrowUpRight size={14} />
        </Link>
        <button
          className="support-link"
          onClick={() => setPage("Dokumentasi")}
        >
          <HelpCircle size={18} />
          Pusat bantuan
          <ArrowUpRight size={14} />
        </button>
        <button className="profile" onClick={onOpenAuth}>
          <div className="avatar">{initials}</div>
          <div>
            <strong>{userName}</strong>
            <small>{userEmail}</small>
          </div>
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
export default Sidebar;
