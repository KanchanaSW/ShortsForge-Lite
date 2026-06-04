"use client";

import { memo } from "react";
import { GripVertical, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MOOD_LABELS,
  SCENE_MOODS,
  type Scene,
  type SceneAudioStatus,
  type SceneMood,
  type VideoMode,
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
  mode: VideoMode;
  canRemove: boolean;
  minDuration: number;
  maxDuration: number;
  onTextChange: (sceneId: string, text: string) => void;
  onDurationChange: (sceneId: string, duration: number) => void;
  onMoodChange: (sceneId: string, mood: SceneMood) => void;
  onVisualQueryChange: (sceneId: string, visualQuery: string) => void;
  onAccentColorChange: (sceneId: string, accentColor: string) => void;
  onRemove: (sceneId: string) => void;
  dragHandle?: boolean;
}

export const SceneRow = memo(function SceneRow({
  index,
  scene,
  mode,
  canRemove,
  minDuration,
  maxDuration,
  onTextChange,
  onDurationChange,
  onMoodChange,
  onVisualQueryChange,
  onAccentColorChange,
  onRemove,
  dragHandle = false,
}: SceneRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: scene.id, disabled: !dragHandle });

  const style = dragHandle
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div
      ref={dragHandle ? setNodeRef : undefined}
      style={style}
      className="flex gap-3 rounded-lg border border-border bg-background/50 p-4"
    >
      {dragHandle && (
        <button
          type="button"
          className="mt-1 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder scene"
        >
          <GripVertical className="h-5 w-5" />
        </button>
      )}
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
          onChange={(e) => onTextChange(scene.id, e.target.value)}
          placeholder="Scene text..."
          rows={mode === "long" ? 3 : 2}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Mood</label>
            <select
              value={scene.mood}
              onChange={(e) =>
                onMoodChange(scene.id, e.target.value as SceneMood)
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
              onChange={(e) => onVisualQueryChange(scene.id, e.target.value)}
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
              onChange={(e) => onAccentColorChange(scene.id, e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent"
              aria-label="Accent color"
            />
            {ACCENT_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onAccentColorChange(scene.id, color)}
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
            min={minDuration}
            max={maxDuration}
            value={scene.duration}
            onChange={(e) =>
              onDurationChange(
                scene.id,
                Math.min(maxDuration, Math.max(minDuration, Number(e.target.value) || minDuration))
              )
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
        onClick={() => onRemove(scene.id)}
        aria-label={`Remove scene ${index + 1}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
});
