"use client";

import { ChevronRight } from "lucide-react";
import Logo from "./Logo";

export function Header({
  page,
  user,
  onOpenAuth,
}: {
  page: string;
  user: any;
  onOpenAuth: () => void;
}) {
  const userName = user?.full_name || user?.name || "Demo User";
  const initials = userName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="topbar">
      <div className="breadcrumb">
        Workspace <ChevronRight size={14} />
        <span>{page}</span>
      </div>
      <div className="mobile-brand">
        <Logo />
      </div>
      <div className="topbar-right">
        <span className="status-dot" title="Gateway Online" />
        <span className="demo-indicator" style={{ cursor: "default" }}>
          Live Gateway
        </span>
        <span className="top-divider" />
        <button
          className="small-avatar"
          aria-label="Profil Akun"
          onClick={onOpenAuth}
        >
          {initials}
        </button>
      </div>
    </header>
  );
}
export default Header;
