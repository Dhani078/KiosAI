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
  const cleanModels = models.filter((m) => m.id !== "combomaut");

  return (
    <div className="playground-toolbar">
      <div>
        <label htmlFor="model">MODEL</label>
        <select
          id="model"
          value={selectedModel}
          onChange={(e) => onSelectModel(e.target.value)}
        >
          {cleanModels.map((m) => {
            const displayName = formatModelName(m.name || m.id, isAdmin);
            return (
              <option key={m.id} value={m.id}>
                {displayName} [{(m.required_tier || "bronze").toUpperCase()}]
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
