"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SceneRow } from "@/components/SceneRow";
import type { ShortScript } from "@/lib/types";
import { getTotalDurationSeconds } from "@/lib/videoUtils";

interface ScriptEditorProps {
  script: ShortScript;
  onChange: (script: ShortScript) => void;
}

const MIN_SCENES = 5;
const MAX_SCENES = 12;

export function ScriptEditor({ script, onChange }: ScriptEditorProps) {
  const totalDuration = getTotalDurationSeconds(script.scenes);

  const updateScene = (index: number, patch: Partial<ShortScript["scenes"][0]>) => {
    const scenes = script.scenes.map((scene, i) =>
      i === index ? { ...scene, ...patch } : scene
    );
    onChange({ ...script, scenes });
  };

  const addScene = () => {
    if (script.scenes.length >= MAX_SCENES) return;
    onChange({
      ...script,
      scenes: [...script.scenes, { text: "New scene", duration: 3 }],
    });
  };

  const removeScene = (index: number) => {
    if (script.scenes.length <= MIN_SCENES) return;
    onChange({
      ...script,
      scenes: script.scenes.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Title
        </label>
        <Input
          value={script.title}
          onChange={(e) => onChange({ ...script, title: e.target.value })}
          placeholder="Video title"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Scenes</h3>
          <p className="text-xs text-muted-foreground">
            {script.scenes.length} scenes · {totalDuration}s total
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addScene}
          disabled={script.scenes.length >= MAX_SCENES}
        >
          <Plus className="h-4 w-4" />
          Add Scene
        </Button>
      </div>

      <div className="space-y-3">
        {script.scenes.map((scene, index) => (
          <SceneRow
            key={index}
            index={index}
            scene={scene}
            canRemove={script.scenes.length > MIN_SCENES}
            onTextChange={(i, text) => updateScene(i, { text })}
            onDurationChange={(i, duration) =>
              updateScene(i, { duration: Math.min(15, Math.max(1, duration)) })
            }
            onRemove={removeScene}
          />
        ))}
      </div>
    </div>
  );
}
