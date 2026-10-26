"use client";

import { LockKeyhole, ArrowRight } from "lucide-react";
import { Button } from "./ui";

export function PlaygroundLocked({
  model,
  requiredTier: _requiredTier,
  onNavigatePackages,
}: {
  model: string;
  requiredTier: string;
  onNavigatePackages: () => void;
}) {
  return (
    <div className="empty-state">
      <LockKeyhole size={32} />
      <h2>Model ini khusus Pro Tier.</h2>
      <p>
        403 · tier_restricted: Free tier membuka model DeepSeek & OpenCode Free. Beli salah satu paket Pro untuk membuka {model} dan seluruh model AI lainnya.
      </p>
      <Button kind="primary" onClick={onNavigatePackages}>
        Beli Paket Pro <ArrowRight size={16} />
      </Button>
    </div>
  );
}
export default PlaygroundLocked;
