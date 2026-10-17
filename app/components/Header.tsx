"use client";

import { useEffect, useState } from "react";
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
  const [health, setHealth] = useState<{
    status: string;
    database: { status: string; latencyMs: number };
    upstream: { status: string; latencyMs: number };
  } | null>(null);

  useEffect(() => {
    let active = true;
    async function checkHealth() {
      try {
        const res = await fetch("/api/health");
        const data = await res.json();
        if (active) setHealth(data);
      } catch {
        if (active) setHealth({ status: "unhealthy", database: { status: "err", latencyMs: 0 }, upstream: { status: "err", latencyMs: 0 } });
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const userName = user?.full_name || user?.name || "Demo User";
  const initials = userName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isAdmin = Boolean(user && (user.username === "adminfordhani" || user.email === "adminfordhani@kiosai.id"));
  const isOnline = health?.status === "healthy";
  const healthTooltip = health
    ? `${isAdmin ? "TiDB" : "Database"}: ${health.database.status} (${health.database.latencyMs}ms) | ${isAdmin ? "9Router" : "Gateway"}: ${health.upstream.status} (${health.upstream.latencyMs}ms)`
    : "Memeriksa status gateway...";

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
        <span
          className="status-dot"
          style={{
            backgroundColor: isOnline ? "var(--success)" : health?.status === "degraded" ? "var(--warning)" : "var(--error)",
          }}
          title={healthTooltip}
        />
        <span
          className="demo-indicator"
          style={{ cursor: "default" }}
          title={healthTooltip}
        >
          {isOnline ? "Live Gateway" : health?.status === "degraded" ? "Degraded" : "Connecting"}
        </span>
        <span className="top-divider" />
        <button
          className="small-avatar"
          aria-label="Profil Akun"
          onClick={onOpenAuth}
          style={{ overflow: "hidden", padding: 0 }}
        >
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            initials
          )}
        </button>
      </div>
    </header>
  );
}
export default Header;
