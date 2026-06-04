"use client";

import { useMemo } from "react";
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
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChapterSection } from "@/components/ChapterSection";
import { createEmptyChapter, flattenScenes } from "@/lib/projectUtils";
import { getTimelineDurationSeconds, buildTimeline } from "@/lib/timelineEngine";
import { getRawTotalDurationSeconds, getTotalDurationSeconds } from "@/lib/videoUtils";
import type { Project } from "@/lib/types";

interface ScriptEditorProps {
  project: Project;
  onChange: (project: Project) => void;
}

export function ScriptEditor({ project, onChange }: ScriptEditorProps) {
  const flatScenes = useMemo(() => flattenScenes(project), [project]);
  const timeline = useMemo(() => buildTimeline(project), [project]);
  const totalDuration =
    project.mode === "short"
      ? getTotalDurationSeconds(flatScenes)
      : Math.round(getTimelineDurationSeconds(timeline));

  const chapterSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleChapterDragEnd = (event: DragEndEvent) => {
    if (project.mode === "short") return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = project.chapters.findIndex((c) => c.id === active.id);
    const newIndex = project.chapters.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const chapters = [...project.chapters];
    const [moved] = chapters.splice(oldIndex, 1);
    chapters.splice(newIndex, 0, moved);
    onChange({ ...project, chapters });
  };

  const addChapter = () => {
    onChange({
      ...project,
      chapters: [...project.chapters, createEmptyChapter()],
    });
  };

  const isShort = project.mode === "short";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Title
        </label>
        <Input
          value={project.title}
          onChange={(e) => onChange({ ...project, title: e.target.value })}
          placeholder="Video title"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">
            {isShort ? "Script" : "Chapters"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {project.chapters.length} chapter{project.chapters.length !== 1 ? "s" : ""} ·{" "}
            {flatScenes.length} scene{flatScenes.length !== 1 ? "s" : ""} · ~{totalDuration}s
            {isShort &&
              getRawTotalDurationSeconds(flatScenes) > totalDuration &&
              " (scaled to 60s max for Shorts)"}
          </p>
        </div>
        {!isShort && (
          <Button type="button" variant="secondary" size="sm" onClick={addChapter}>
            <Plus className="h-4 w-4" />
            Add Chapter
          </Button>
        )}
      </div>

      {isShort ? (
        project.chapters.map((chapter, chapterIndex) => (
          <ChapterSection
            key={chapter.id}
            chapter={chapter}
            chapterIndex={chapterIndex}
            project={project}
            onChange={onChange}
            canRemoveChapter={false}
            canAddChapter={false}
          />
        ))
      ) : (
        <DndContext
          sensors={chapterSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleChapterDragEnd}
        >
          <SortableContext
            items={project.chapters.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-6">
              {project.chapters.map((chapter, chapterIndex) => (
                <ChapterSection
                  key={chapter.id}
                  chapter={chapter}
                  chapterIndex={chapterIndex}
                  project={project}
                  onChange={onChange}
                  canRemoveChapter={project.chapters.length > 1}
                  canAddChapter
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
