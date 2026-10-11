"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthModal from "@/app/components/AuthModal";

export function LandingAuthWatcher() {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const authed = useRef(false);

  useEffect(() => {
    if (params.get("login") === "1") setOpen(true);
  }, [params]);

  if (!open) return null;

  const close = () => {
    setOpen(false);
    if (!authed.current) router.replace("/");
  };

  return (
    <AuthModal
      onClose={close}
      onAuthSuccess={(u) => {
        authed.current = true;
        localStorage.setItem("kiosai_user_id", u.id);
        window.location.assign("/dashboard");
      }}
    />
  );
}
export default LandingAuthWatcher;