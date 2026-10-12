"use client";

import { LockKeyhole, ArrowRight } from "lucide-react";
import { Button } from "./ui";

export function PlaygroundLocked({
  model,
  requiredTier,
  onNavigatePackages,
}: {
  model: string;
  requiredTier: string;
  onNavigatePackages: () => void;
}) {
  return (
    <div className="empty-state">
      <LockKeyhole size={32} />
      <h2>Model ini belum terbuka untuk Free Plan.</h2>
      <p>
        403 · tier_restricted — Paket Free Bansos hanya mendukung Atria Dawn dan DeepSeek Flash. Beli paket token untuk membuka {model} dan seluruh model AI lainnya.
      </p>
      <Button kind="primary" onClick={onNavigatePackages}>
        Beli Paket Token <ArrowRight size={16} />
      </Button>
    </div>
  );
}
export default PlaygroundLocked;
