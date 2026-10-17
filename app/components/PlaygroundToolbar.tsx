"use client";

import { Plus } from "lucide-react";
import { Badge, Button } from "./ui";
import { formatModelName } from "@/lib/model-utils";
import { getModelPricing } from "@/lib/model-pricing";

export function PlaygroundToolbar({
  models,
  selectedModel,
  requiredTier,
  isAdmin = false,
  onSelectModel,
  onResetChat,
}: {
  models: any[];
  selectedModel: string;
  requiredTier: string;
  isAdmin?: boolean;
  onSelectModel: (m: string) => void;
  onResetChat: () => void;
}) {
  const sortedModels = [...models]
    .filter((m) => m.id !== "combomaut")
    .sort((a, b) => {
      const aAcc = a.accessible !== false ? 1 : 0;
      const bAcc = b.accessible !== false ? 1 : 0;
      if (aAcc !== bAcc) return bAcc - aAcc;
      const aFree = (a.required_tier === "free" || a.id.startsWith("oc/") || a.id.includes("atria")) ? 1 : 0;
      const bFree = (b.required_tier === "free" || b.id.startsWith("oc/") || b.id.includes("atria")) ? 1 : 0;
      if (aFree !== bFree) return bFree - aFree;
      return a.id.localeCompare(b.id);
    });

  const displayTier = (requiredTier === "free" ? "FREE" : "PRO");

  return (
    <div className="playground-toolbar">
      <div>
        <label htmlFor="model">MODEL</label>
        <select
          id="model"
          value={selectedModel}
          onChange={(e) => onSelectModel(e.target.value)}
        >
          {sortedModels.map((m) => {
            const displayName = formatModelName(m.name || m.id, isAdmin);
            const pricing = getModelPricing(m.id);
            const lockIcon = m.accessible === false ? " 🔒" : "";
            const tLabel = (m.required_tier === "free" ? "FREE" : "PRO");
            return (
              <option key={m.id} value={m.id}>
                {displayName} [{tLabel} · In ${pricing.input} / Out ${pricing.output}]{lockIcon}
              </option>
            );
          })}
        </select>
      </div>
      <Badge tier={displayTier} />
      <Button kind="ghost" onClick={onResetChat}>
        Chat baru <Plus size={16} />
      </Button>
    </div>
  );
}

export default PlaygroundToolbar;
