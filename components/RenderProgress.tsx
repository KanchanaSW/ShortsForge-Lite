"use client";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export type PipelineStep =
  | "script"
  | "voice"
  | "visuals"
  | "timeline"
  | "encode"
  | "ready";

const STEP_LABELS: Record<PipelineStep, string> = {
  script: "Generating Script",
  voice: "Generating Voiceovers",
  visuals: "Fetching Media",
  timeline: "Building Timeline",
  encode: "Rendering Video",
  ready: "Ready",
};

const STEP_ORDER: PipelineStep[] = [
  "script",
  "voice",
  "visuals",
  "timeline",
  "encode",
  "ready",
];

interface RenderProgressProps {
  progress: number;
  currentStep: PipelineStep;
  statusLabel?: string;
  onCancel: () => void;
  longRenderWarning?: boolean;
}

export function RenderProgress({
  progress,
  currentStep,
  statusLabel = "Rendering video...",
  onCancel,
  longRenderWarning,
}: RenderProgressProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-6">
      <div className="space-y-3">
        {STEP_ORDER.map((step, index) => {
          const isActive = step === currentStep;
          const isDone = index < currentIndex;
          return (
            <div
              key={step}
              className={`flex items-center gap-3 text-sm ${
                isActive
                  ? "font-medium text-foreground"
                  : isDone
                    ? "text-muted-foreground"
                    : "text-muted-foreground/50"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                  isDone
                    ? "bg-primary/20 text-primary"
                    : isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? "✓" : index + 1}
              </span>
              <span>{STEP_LABELS[step]}</span>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{statusLabel}</span>
          <span className="text-muted-foreground">{progress}%</span>
        </div>
        <Progress value={progress} />
      </div>

      {longRenderWarning && (
        <p className="text-xs text-amber-400">
          Long-form videos may take 15–30+ minutes to render in your browser.
          Keep this tab open.
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Keep this tab open while rendering.
      </p>
      <Button type="button" variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}
