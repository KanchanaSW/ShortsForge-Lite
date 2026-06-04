"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Sparkles, Video } from "lucide-react";
import { LongFormOptions } from "@/components/LongFormOptions";
import { ScriptEditor } from "@/components/ScriptEditor";
import { VideoFormatSelector } from "@/components/VideoFormatSelector";
import { VoiceoverStatus } from "@/components/VoiceoverStatus";
import {
  RenderProgress,
  type PipelineStep,
} from "@/components/RenderProgress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { allScenesHaveAudio, flattenScenes, getSceneCount } from "@/lib/projectUtils";
import { prefetchProjectStockVideos } from "@/lib/prefetchStockVideos";
import { generateAllProjectAudio } from "@/lib/tts/generateAllSceneAudio";
import { RenderError, renderProject } from "@/lib/renderVideo";
import {
  clearProject,
  loadMode,
  loadProject,
  loadTopic,
  saveMode,
  saveProject,
  saveRenderMeta,
  saveTopic,
  saveVideoBlobUrl,
} from "@/lib/storage";
import { buildTimeline, getTimelineDurationSeconds } from "@/lib/timelineEngine";
import {
  SCRIPT_STYLES,
  type LongContentStyle,
  type Project,
  type ScriptStyle,
  type TargetDuration,
  type VideoMode,
} from "@/lib/types";
import { getModeLabel, getResolutionLabel } from "@/lib/videoConfig";
import { getVideoFilename } from "@/lib/videoUtils";

type PagePhase = "input" | "editor" | "rendering";

const VOICE_WEIGHT = 0.25;
const VISUALS_WEIGHT = 0.15;
const TIMELINE_WEIGHT = 0.05;
const ENCODE_WEIGHT = 0.55;

export default function CreatePage() {
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);

  const [phase, setPhase] = useState<PagePhase>("input");
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState<VideoMode>("short");
  const [style, setStyle] = useState<ScriptStyle>("motivational");
  const [targetDuration, setTargetDuration] = useState<TargetDuration>(5);
  const [contentStyle, setContentStyle] = useState<LongContentStyle>("educational");
  const [showTableOfContents, setShowTableOfContents] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [renderWarning, setRenderWarning] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [pipelineStep, setPipelineStep] = useState<PipelineStep>("voice");
  const [pipelineDetail, setPipelineDetail] = useState("");

  useEffect(() => {
    const savedTopic = loadTopic();
    const savedProject = loadProject();
    const savedMode = loadMode();
    if (savedTopic) setTopic(savedTopic);
    setMode(savedMode);
    if (savedProject) {
      setProject(savedProject);
      setMode(savedProject.mode);
      if (savedProject.targetDuration) setTargetDuration(savedProject.targetDuration);
      if (savedProject.contentStyle) setContentStyle(savedProject.contentStyle);
      if (savedProject.showTableOfContents !== undefined) {
        setShowTableOfContents(savedProject.showTableOfContents);
      }
      setPhase("editor");
    }
  }, []);

  const handleProjectChange = useCallback((updated: Project) => {
    setProject(updated);
    saveProject(updated);
  }, []);

  const handleModeChange = (newMode: VideoMode) => {
    setMode(newMode);
    saveMode(newMode);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setGenerateError("Please enter a topic.");
      return;
    }

    setGenerateError(null);
    setIsGenerating(true);
    saveTopic(topic.trim());

    try {
      const body =
        mode === "short"
          ? { topic: topic.trim(), mode: "short" as const, style }
          : {
              topic: topic.trim(),
              mode: "long" as const,
              targetDuration,
              contentStyle,
              showTableOfContents,
            };

      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as Project | { error: string };

      if (!response.ok) {
        setGenerateError("error" in data ? data.error : "Generation failed.");
        return;
      }

      const generated = data as Project;
      setProject(generated);
      saveProject(generated);
      setPhase("editor");
    } catch {
      setGenerateError("Script generation failed. Check your connection and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!project) return;

    const timeline = buildTimeline(project);
    const durationMinutes = getTimelineDurationSeconds(timeline) / 60;
    const isLongRender = durationMinutes >= 15;

    if (isLongRender) {
      setRenderWarning(
        `This video is ~${Math.round(durationMinutes)} minutes. Rendering may take 15–30+ minutes in your browser.`
      );
    } else {
      setRenderWarning(null);
    }

    setRenderError(null);
    setRenderProgress(0);
    setPipelineStep("voice");
    setPipelineDetail("");
    setPhase("rendering");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let workingProject = project;

      const ttsStatus = await fetch("/api/tts/status").then((r) =>
        r.json()
      ) as { available: boolean };

      if (ttsStatus.available) {
        if (!allScenesHaveAudio(workingProject)) {
          setPipelineStep("voice");
          workingProject = await generateAllProjectAudio(
            workingProject,
            ({ done, total, chapterIndex, chapterTotal, sceneIndex, sceneTotal }) => {
              const pct =
                total === 0 ? 0 : Math.round((done / total) * VOICE_WEIGHT * 100);
              setRenderProgress(pct);
              if (chapterTotal && chapterIndex && sceneTotal && sceneIndex) {
                setPipelineDetail(
                  `Chapter ${chapterIndex} / ${chapterTotal} · Scene ${sceneIndex} / ${sceneTotal}`
                );
              } else {
                setPipelineDetail(
                  total === 0
                    ? ""
                    : `Generating voice ${Math.min(done + 1, total)}/${total}...`
                );
              }
            },
            controller.signal
          );

          setProject(workingProject);
          saveProject(workingProject);

          const voiceFailures = flattenScenes(workingProject).filter(
            (s) => s.audioStatus === "error"
          ).length;
          if (voiceFailures > 0) {
            setRenderWarning(
              (prev) =>
                prev
                  ? `${prev} ${voiceFailures} scene(s) could not generate voice.`
                  : `${voiceFailures} scene(s) could not generate voice — continuing with partial or silent audio.`
            );
          }
        } else {
          setRenderProgress(Math.round(VOICE_WEIGHT * 100));
        }
      }

      if (controller.signal.aborted) return;

      setPipelineStep("visuals");
      setPipelineDetail("Fetching stock footage...");
      workingProject = await prefetchProjectStockVideos(
        workingProject,
        (done, total) => {
          const base = VOICE_WEIGHT * 100;
          const span = VISUALS_WEIGHT * 100;
          if (total === 0) {
            setRenderProgress(Math.round(base + span));
            return;
          }
          setRenderProgress(Math.round(base + (done / total) * span));
        },
        controller.signal
      );

      if (controller.signal.aborted) return;

      setPipelineStep("timeline");
      setPipelineDetail("Calculating timeline...");
      buildTimeline(workingProject);
      setRenderProgress(
        Math.round((VOICE_WEIGHT + VISUALS_WEIGHT + TIMELINE_WEIGHT) * 100)
      );

      if (controller.signal.aborted) return;

      setPipelineStep("encode");
      setPipelineDetail("Encoding MP4...");
      const encodeBase = (VOICE_WEIGHT + VISUALS_WEIGHT + TIMELINE_WEIGHT) * 100;

      const { blob, usedSilentFallback } = await renderProject(
        workingProject,
        (pct) => {
          setRenderProgress(
            Math.round(encodeBase + (pct / 100) * ENCODE_WEIGHT * 100)
          );
        },
        controller.signal
      );

      if (usedSilentFallback) {
        setRenderWarning(
          (prev) =>
            prev
              ? `${prev} Audio could not be muxed into the final MP4.`
              : "Audio could not be included in this render. The video was saved without voiceover."
        );
      }

      setPipelineStep("ready");
      setRenderProgress(100);

      const blobUrl = URL.createObjectURL(blob);
      const filename = getVideoFilename(workingProject);
      saveVideoBlobUrl(blobUrl, filename);

      const finalTimeline = buildTimeline(workingProject);
      saveRenderMeta({
        mode: workingProject.mode,
        resolution: getResolutionLabel(workingProject.mode),
        durationSeconds: Math.round(getTimelineDurationSeconds(finalTimeline)),
        chapterCount: workingProject.chapters.length,
        sceneCount: getSceneCount(workingProject),
      });

      router.push("/preview");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setPhase("editor");
        return;
      }
      const message =
        error instanceof RenderError
          ? error.message
          : "Video generation failed. Try reducing scene count or text length.";
      setRenderError(message);
      setPhase("editor");
    } finally {
      abortRef.current = null;
    }
  };

  const handleCancelRender = () => {
    abortRef.current?.abort();
    setPhase("editor");
    setRenderProgress(0);
    setPipelineStep("voice");
    setPipelineDetail("");
  };

  const handleReset = () => {
    abortRef.current?.abort();
    clearProject();
    setTopic("");
    setMode("short");
    setStyle("motivational");
    setTargetDuration(5);
    setContentStyle("educational");
    setShowTableOfContents(false);
    setProject(null);
    setPhase("input");
    setGenerateError(null);
    setRenderError(null);
    setRenderWarning(null);
    setRenderProgress(0);
    setPipelineStep("voice");
    setPipelineDetail("");
    setIsGenerating(false);
  };

  const hasProject = Boolean(project || topic.trim());

  const pipelineLabel =
    pipelineDetail ||
    (pipelineStep === "voice"
      ? "Generating voiceover..."
      : pipelineStep === "visuals"
        ? "Fetching visuals..."
        : pipelineStep === "timeline"
          ? "Building timeline..."
          : pipelineStep === "encode"
            ? "Rendering video..."
            : "Ready");

  const estimatedMinutes = project
    ? getTimelineDurationSeconds(buildTimeline(project)) / 60
    : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <header className="space-y-2 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          ShortsForge Lite
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Create AI Videos
        </h1>
        <p className="text-muted-foreground">
          Generate YouTube Shorts or long-form videos from a topic.
        </p>
      </header>

      {(phase === "input" || !project) && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1 — Topic</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Topic</label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Why sleep is your superpower"
                disabled={isGenerating}
              />
            </div>

            <VideoFormatSelector
              mode={mode}
              onChange={handleModeChange}
              disabled={isGenerating}
            />

            {mode === "short" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Style (optional)</label>
                <div className="flex flex-wrap gap-2">
                  {SCRIPT_STYLES.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={style === option.value ? "default" : "secondary"}
                      size="sm"
                      onClick={() => setStyle(option.value)}
                      disabled={isGenerating}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
                {style === "storytelling" && (
                  <p className="text-xs text-muted-foreground">
                    Denser narrative, still under 60 seconds.
                  </p>
                )}
              </div>
            ) : (
              <LongFormOptions
                targetDuration={targetDuration}
                contentStyle={contentStyle}
                showTableOfContents={showTableOfContents}
                onTargetDurationChange={setTargetDuration}
                onContentStyleChange={setContentStyle}
                onTableOfContentsChange={setShowTableOfContents}
                disabled={isGenerating}
              />
            )}

            {generateError && (
              <p className="text-sm text-red-400">{generateError}</p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                size="lg"
                className="flex-1"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? "Generating Script..." : "Generate Script"}
              </Button>
              {hasProject && (
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="sm:w-auto"
                  onClick={handleReset}
                  disabled={isGenerating}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {project && phase !== "rendering" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <CardTitle>Step 2 — Edit &amp; Create</CardTitle>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-muted px-2 py-1">
                {getModeLabel(project.mode)}
              </span>
              <span className="rounded-full bg-muted px-2 py-1">
                {getResolutionLabel(project.mode)}
              </span>
              <span className="rounded-full bg-muted px-2 py-1">
                ~{Math.round(estimatedMinutes * 10) / 10} min
              </span>
            </div>

            <ScriptEditor project={project} onChange={handleProjectChange} />

            <VoiceoverStatus project={project} />

            {renderWarning && (
              <p className="text-sm text-amber-400">{renderWarning}</p>
            )}

            {renderError && (
              <p className="text-sm text-red-400">{renderError}</p>
            )}

            <Button
              type="button"
              size="lg"
              className="w-full"
              onClick={handleGenerateVideo}
            >
              <Video className="h-4 w-4" />
              Generate Video
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Generates voiceover, fetches visuals, and renders your MP4.
            </p>
          </CardContent>
        </Card>
      )}

      {phase === "rendering" && (
        <RenderProgress
          progress={renderProgress}
          currentStep={pipelineStep}
          statusLabel={pipelineLabel}
          onCancel={handleCancelRender}
          longRenderWarning={estimatedMinutes >= 15}
        />
      )}
    </div>
  );
}
