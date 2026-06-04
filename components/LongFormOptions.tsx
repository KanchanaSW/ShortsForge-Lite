"use client";

import {
  LONG_CONTENT_STYLES,
  TARGET_DURATIONS,
  type LongContentStyle,
  type TargetDuration,
} from "@/lib/types";

interface LongFormOptionsProps {
  targetDuration: TargetDuration;
  contentStyle: LongContentStyle;
  showTableOfContents: boolean;
  onTargetDurationChange: (value: TargetDuration) => void;
  onContentStyleChange: (value: LongContentStyle) => void;
  onTableOfContentsChange: (value: boolean) => void;
  disabled?: boolean;
}

export function LongFormOptions({
  targetDuration,
  contentStyle,
  showTableOfContents,
  onTargetDurationChange,
  onContentStyleChange,
  onTableOfContentsChange,
  disabled,
}: LongFormOptionsProps) {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Target Duration</label>
        <div className="flex flex-wrap gap-2">
          {TARGET_DURATIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onTargetDurationChange(option.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                targetDuration === option.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Content Style</label>
        <div className="flex flex-wrap gap-2">
          {LONG_CONTENT_STYLES.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onContentStyleChange(option.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                contentStyle === option.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={showTableOfContents}
          onChange={(e) => onTableOfContentsChange(e.target.checked)}
          disabled={disabled}
          className="accent-primary"
        />
        <div>
          <div className="text-sm font-medium">Table of Contents intro</div>
          <div className="text-xs text-muted-foreground">
            Show chapter list at the start of the video
          </div>
        </div>
      </label>
    </div>
  );
}
