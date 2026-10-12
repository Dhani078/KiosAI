"use client";

import { Plus } from "lucide-react";
import { Badge, Button } from "./ui";
import { formatModelName } from "@/lib/model-utils";

export function PlaygroundToolbar({
  models,
  selectedModel,
  requiredTier,
  onSelectModel,
  onResetChat,
}: {
  models: any[];
  selectedModel: string;
  requiredTier: string;
  onSelectModel: (m: string) => void;
  onResetChat: () => void;
}) {
  return (
    <div className="playground-toolbar">
      <div>
        <label htmlFor="model">MODEL</label>
        <select
          id="model"
          value={selectedModel}
          onChange={(e) => onSelectModel(e.target.value)}
        >
          {models.map((m) => {
            const displayName = formatModelName(m.name || m.id);
            return (
              <option key={m.id} value={m.id}>
                {displayName} [{(m.required_tier || "bronze").toUpperCase()}]
                {!m.accessible ? " — terkunci" : ""}
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
