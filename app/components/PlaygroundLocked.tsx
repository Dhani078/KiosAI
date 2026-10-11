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
      <h2>Model ini belum terbuka.</h2>
      <p>
        403 · tier_restricted — Upgrade ke tier {requiredTier.toUpperCase()} untuk membuka {model}.
      </p>
      <Button kind="primary" onClick={onNavigatePackages}>
        Upgrade ke {requiredTier.toUpperCase()} <ArrowRight size={16} />
      </Button>
    </div>
  );
}
export default PlaygroundLocked;
