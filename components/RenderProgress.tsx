"use client";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface RenderProgressProps {
  progress: number;
  onCancel: () => void;
}

export function RenderProgress({ progress, onCancel }: RenderProgressProps) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Rendering video...</span>
          <span className="text-muted-foreground">{progress}%</span>
        </div>
        <Progress value={progress} />
      </div>
      <p className="text-xs text-muted-foreground">
        This may take a minute. Keep this tab open while rendering.
      </p>
      <Button type="button" variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}
