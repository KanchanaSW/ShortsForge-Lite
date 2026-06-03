"use client";

import { memo } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MOOD_LABELS,
  SCENE_MOODS,
  type Scene,
  type SceneAudioStatus,
  type SceneMood,
} from "@/lib/types";

function audioStatusLabel(status: SceneAudioStatus | undefined): string {
  switch (status) {
    case "ready":
      return "Audio ready";
    case "generating":
      return "Generating audio…";
    case "error":
      return "Audio failed";
    case "missing":
      return "No audio";
    default:
      return "No voiceover yet";
  }
}

function audioStatusIcon(status: SceneAudioStatus | undefined): string {
  switch (status) {
    case "ready":
      return "✔";
    case "generating":
      return "⏳";
    case "error":
      return "✕";
    default:
      return "○";
  }
}

const ACCENT_PRESETS = [
  "#E30B5C",
  "#FF6B35",
  "#7B2CBF",
  "#00B4D8",
  "#FFD60A",
  "#2D6A4F",
];

interface SceneRowProps {
  index: number;
  scene: Scene;
  canRemove: boolean;
  onTextChange: (index: number, text: string) => void;
  onDurationChange: (index: number, duration: number) => void;
  onMoodChange: (index: number, mood: SceneMood) => void;
  onVisualQueryChange: (index: number, visualQuery: string) => void;
  onAccentColorChange: (index: number, accentColor: string) => void;
  onRemove: (index: number) => void;
}

export const SceneRow = memo(function SceneRow({
  index,
  scene,
  canRemove,
  onTextChange,
  onDurationChange,
  onMoodChange,
  onVisualQueryChange,
  onAccentColorChange,
  onRemove,
}: SceneRowProps) {
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-background/50 p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
        {index + 1}
      </div>
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-center gap-2">
          <div
            className="h-8 w-8 shrink-0 rounded-md border border-border"
            style={{
              background: `linear-gradient(135deg, ${scene.accentColor}, ${scene.accentColor}88)`,
            }}
            title={`${MOOD_LABELS[scene.mood]} mood`}
          />
          <span className="text-xs font-medium text-muted-foreground">
            {MOOD_LABELS[scene.mood]}
          </span>
        </div>
        <Textarea
          value={scene.text}
          onChange={(e) => onTextChange(index, e.target.value)}
          placeholder="Scene text..."
          rows={2}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Mood</label>
            <select
              value={scene.mood}
              onChange={(e) =>
                onMoodChange(index, e.target.value as SceneMood)
              }
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              {SCENE_MOODS.map((mood) => (
                <option key={mood} value={mood}>
                  {MOOD_LABELS[mood]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Visual search
            </label>
            <Input
              value={scene.visualQuery}
              onChange={(e) => onVisualQueryChange(index, e.target.value)}
              placeholder="e.g. night city rain"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Accent color</label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="color"
              value={scene.accentColor}
              onChange={(e) => onAccentColorChange(index, e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent"
              aria-label="Accent color"
            />
            {ACCENT_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onAccentColorChange(index, color)}
                className="h-7 w-7 rounded-full border border-border transition-transform hover:scale-110"
                style={{ backgroundColor: color }}
                aria-label={`Use accent ${color}`}
              />
            ))}
          </div>
        </div>
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
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">
            {audioStatusIcon(scene.audioStatus)} Scene {index + 1}:{" "}
            {audioStatusLabel(scene.audioStatus)}
          </span>
          {(scene.audioUrl ?? scene.audioPath) && scene.audioStatus === "ready" && (
            <audio
              controls
              preload="metadata"
              src={scene.audioUrl ?? scene.audioPath}
              className="h-8 w-full max-w-md"
            />
          )}
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
