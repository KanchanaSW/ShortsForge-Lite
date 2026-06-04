"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ChevronDown, ChevronRight, GripVertical, Plus, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SceneRow } from "@/components/SceneRow";
import { createEmptyScene } from "@/lib/projectUtils";
import { getVideoConfig } from "@/lib/videoConfig";
import type { Chapter, Project, Scene, SceneMood } from "@/lib/types";

interface ChapterSectionProps {
  chapter: Chapter;
  chapterIndex: number;
  project: Project;
  onChange: (project: Project) => void;
  canRemoveChapter: boolean;
  canAddChapter: boolean;
}

function SortableChapterHeader({
  chapter,
  chapterIndex,
  collapsed,
  onToggle,
  onTitleChange,
  onRemove,
  canRemove,
}: {
  chapter: Chapter;
  chapterIndex: number;
  collapsed: boolean;
  onToggle: () => void;
  onTitleChange: (title: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2"
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder chapter"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={onToggle}
        className="text-muted-foreground hover:text-foreground"
        aria-label={collapsed ? "Expand chapter" : "Collapse chapter"}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      <span className="text-xs font-semibold text-primary">
        Ch. {chapterIndex + 1}
      </span>
      <Input
        value={chapter.title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="h-8 flex-1 border-0 bg-transparent px-2 font-medium shadow-none focus-visible:ring-0"
        placeholder="Chapter title"
      />
      <span className="text-xs text-muted-foreground">
        {chapter.scenes.length} scene{chapter.scenes.length !== 1 ? "s" : ""}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={!canRemove}
        onClick={onRemove}
        aria-label="Remove chapter"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function ChapterSection({
  chapter,
  chapterIndex,
  project,
  onChange,
  canRemoveChapter,
}: ChapterSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const config = getVideoConfig(project.mode, project.targetDuration);
  const isShort = project.mode === "short";

  const updateChapter = (updatedChapter: Chapter) => {
    onChange({
      ...project,
      chapters: project.chapters.map((c) =>
        c.id === chapter.id ? updatedChapter : c
      ),
    });
  };

  const updateScene = (sceneId: string, patch: Partial<Scene>) => {
    updateChapter({
      ...chapter,
      scenes: chapter.scenes.map((s) =>
        s.id === sceneId ? { ...s, ...patch } : s
      ),
    });
  };

  const addScene = () => {
    if (chapter.scenes.length >= config.maxScenesPerChapter) return;
    updateChapter({
      ...chapter,
      scenes: [...chapter.scenes, createEmptyScene()],
    });
  };

  const removeScene = (sceneId: string) => {
    if (chapter.scenes.length <= config.minScenesPerChapter) return;
    updateChapter({
      ...chapter,
      scenes: chapter.scenes.filter((s) => s.id !== sceneId),
    });
  };

  const handleSceneDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = chapter.scenes.findIndex((s) => s.id === active.id);
    const newIndex = chapter.scenes.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const scenes = [...chapter.scenes];
    const [moved] = scenes.splice(oldIndex, 1);
    scenes.splice(newIndex, 0, moved);
    updateChapter({ ...chapter, scenes });
  };

  const sceneSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <div className="space-y-3">
      {!isShort && (
        <SortableChapterHeader
          chapter={chapter}
          chapterIndex={chapterIndex}
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          onTitleChange={(title) => updateChapter({ ...chapter, title })}
          onRemove={() => {
            onChange({
              ...project,
              chapters: project.chapters.filter((c) => c.id !== chapter.id),
            });
          }}
          canRemove={canRemoveChapter}
        />
      )}

      {(!collapsed || isShort) && (
        <>
          <div className="flex items-center justify-between">
            {isShort ? (
              <div>
                <h3 className="text-sm font-medium">Scenes</h3>
                <p className="text-xs text-muted-foreground">
                  {chapter.scenes.length} scenes
                </p>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Scenes</span>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addScene}
              disabled={chapter.scenes.length >= config.maxScenesPerChapter}
            >
              <Plus className="h-4 w-4" />
              Add Scene
            </Button>
          </div>

          <DndContext
            sensors={sceneSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleSceneDragEnd}
          >
            <SortableContext
              items={chapter.scenes.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {chapter.scenes.map((scene, sceneIndex) => (
                  <SceneRow
                    key={scene.id}
                    index={sceneIndex}
                    scene={scene}
                    mode={project.mode}
                    canRemove={chapter.scenes.length > config.minScenesPerChapter}
                    minDuration={config.minSceneDuration}
                    maxDuration={config.maxSceneDuration}
                    dragHandle={!isShort || chapter.scenes.length > 1}
                    onTextChange={(sceneId, text) =>
                      updateScene(sceneId, {
                        text,
                        audioPath: undefined,
                        audioUrl: undefined,
                        audioStatus: undefined,
                      })
                    }
                    onDurationChange={(sceneId, duration) =>
                      updateScene(sceneId, { duration })
                    }
                    onMoodChange={(sceneId, mood) =>
                      updateScene(sceneId, { mood: mood as SceneMood })
                    }
                    onVisualQueryChange={(sceneId, visualQuery) =>
                      updateScene(sceneId, { visualQuery, videoUrl: undefined })
                    }
                    onAccentColorChange={(sceneId, accentColor) =>
                      updateScene(sceneId, { accentColor })
                    }
                    onRemove={removeScene}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}
    </div>
  );
}
