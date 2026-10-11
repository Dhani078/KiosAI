"use client";

import { navigation } from "./Sidebar";

export function BottomNav({
  page,
  setPage,
}: {
  page: string;
  setPage: (p: string) => void;
}) {
  return (
    <nav className="bottom-nav" aria-label="Navigasi utama mobile">
      {navigation.map((n) => (
        <button
          key={n.name}
          onClick={() => setPage(n.name)}
          className={page === n.name ? "active" : ""}
          aria-current={page === n.name ? "page" : undefined}
        >
          <n.icon size={20} />
          <span>{n.short}</span>
        </button>
      ))}
    </nav>
  );
}
export default BottomNav;
