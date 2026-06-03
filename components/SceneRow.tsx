"use client";

import { memo } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Scene } from "@/lib/types";

interface SceneRowProps {
  index: number;
  scene: Scene;
  canRemove: boolean;
  onTextChange: (index: number, text: string) => void;
  onDurationChange: (index: number, duration: number) => void;
  onRemove: (index: number) => void;
}

export const SceneRow = memo(function SceneRow({
  index,
  scene,
  canRemove,
  onTextChange,
  onDurationChange,
  onRemove,
}: SceneRowProps) {
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-background/50 p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
        {index + 1}
      </div>
      <div className="flex flex-1 flex-col gap-3">
        <Textarea
          value={scene.text}
          onChange={(e) => onTextChange(index, e.target.value)}
          placeholder="Scene text..."
          rows={2}
        />
        <div className="flex items-center gap-3">
          <label className="text-xs text-muted-foreground">Duration (s)</label>
          <Input
            type="number"
            min={1}
            max={15}
            value={scene.duration}
            onChange={(e) =>
              onDurationChange(index, Number(e.target.value) || 1)
            }
            className="w-20"
          />
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={!canRemove}
        onClick={() => onRemove(index)}
        aria-label={`Remove scene ${index + 1}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
});
