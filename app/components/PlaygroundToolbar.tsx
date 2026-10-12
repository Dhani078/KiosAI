"use client";

import { Plus } from "lucide-react";
import { Badge, Button } from "./ui";
import { formatModelName } from "@/lib/model-utils";

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
      const aP = a.id.toLowerCase().includes("atria") ? 2 : a.id.toLowerCase().includes("tokenharbor/deepseek-v4.1-flash") ? 1 : 0;
      const bP = b.id.toLowerCase().includes("atria") ? 2 : b.id.toLowerCase().includes("tokenharbor/deepseek-v4.1-flash") ? 1 : 0;
      return bP - aP;
    });

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
            const lockIcon = m.accessible === false ? " 🔒" : "";
            return (
              <option key={m.id} value={m.id}>
                {displayName} [{(m.required_tier || "bronze").toUpperCase()}]{lockIcon}
              </option>
            );
          })}
        </select>
      </div>
      <Badge tier={requiredTier.toUpperCase()} />
      <Button kind="ghost" onClick={onResetChat}>
        Chat baru <Plus size={16} />
      </Button>
    </div>
  );
}

export default PlaygroundToolbar;
