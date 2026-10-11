"use client";

import { Check, X } from "lucide-react";

export function Toast({
  toast,
  setToast,
}: {
  toast: string;
  setToast: (s: string) => void;
}) {
  if (!toast) return null;

  return (
    <div role="status" className="toast">
      <span>
        <Check size={17} />
      </span>
      {toast}
      <button aria-label="Tutup notifikasi" onClick={() => setToast("")}>
        <X size={16} />
      </button>
    </div>
  );
}
export default Toast;
