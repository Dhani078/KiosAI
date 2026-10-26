"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const uid = localStorage.getItem("kiosai_user_id");
      if (!uid) {
        router.replace("/?login=1");
        return;
      }
      try {
        const res = await fetch(`/api/user?id=${uid}`);
        if (!res.ok) {
          localStorage.removeItem("kiosai_user_id");
          localStorage.removeItem("kiosai_is_admin");
          router.replace("/?login=1");
          return;
        }
        if (mounted) setReady(true);
      } catch {
        if (mounted) setReady(true);
      }
    };

    check();

    // Re-check on tab focus / bfcache restore (covers logout in another tab)
    const recheck = () => {
      if (!localStorage.getItem("kiosai_user_id")) {
        setReady(false);
        router.replace("/?login=1");
      }
    };
    window.addEventListener("focus", recheck);
    window.addEventListener("pageshow", recheck);
    return () => {
      mounted = false;
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