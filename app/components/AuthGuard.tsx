"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = () => {
      if (!localStorage.getItem("kiosai_user_id")) {
        router.replace("/?login=1");
        return false;
      }
      return true;
    };

    if (check()) setReady(true);

    // Re-check on tab focus / bfcache restore (covers logout in another tab)
    const recheck = () => { if (!check()) setReady(false); };
    window.addEventListener("focus", recheck);
    window.addEventListener("pageshow", recheck);
    return () => {
      window.removeEventListener("focus", recheck);
      window.removeEventListener("pageshow", recheck);
    };
  }, [router]);

  if (!ready) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "var(--canvas)",
          color: "var(--text-muted)",
          fontSize: "13px",
          letterSpacing: "0.4px",
        }}
      >
        Memeriksa sesi…
      </div>
    );
  }

  return <>{children}</>;
}
export default AuthGuard;