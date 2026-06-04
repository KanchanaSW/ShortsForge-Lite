"use client";

import type { VideoMode } from "@/lib/types";

interface VideoFormatSelectorProps {
  mode: VideoMode;
  onChange: (mode: VideoMode) => void;
  disabled?: boolean;
}

export function VideoFormatSelector({
  mode,
  onChange,
  disabled,
}: VideoFormatSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Video Format</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
          <input
            type="radio"
            name="videoFormat"
            value="short"
            checked={mode === "short"}
            onChange={() => onChange("short")}
            disabled={disabled}
            className="accent-primary"
          />
          <div>
            <div className="text-sm font-medium">YouTube Short</div>
            <div className="text-xs text-muted-foreground">
              Vertical 1080×1920 · 30–60 seconds
            </div>
          </div>
        </label>
        <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
          <input
            type="radio"
            name="videoFormat"
            value="long"
            checked={mode === "long"}
            onChange={() => onChange("long")}
            disabled={disabled}
            className="accent-primary"
          />
          <div>
            <div className="text-sm font-medium">Long-form Video</div>
            <div className="text-xs text-muted-foreground">
              Landscape 1920×1080 · 3–20 minutes
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}
