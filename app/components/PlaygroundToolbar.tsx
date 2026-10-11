"use client";

import { Plus } from "lucide-react";
import { Badge, Button } from "./ui";

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
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name || m.id} [{(m.required_tier || "bronze").toUpperCase()}]
              {!m.accessible ? " — terkunci" : ""}
            </option>
          ))}
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
