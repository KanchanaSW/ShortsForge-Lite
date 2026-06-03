"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Sparkles, Video } from "lucide-react";
import { ScriptEditor } from "@/components/ScriptEditor";
import { VoiceoverStatus } from "@/components/VoiceoverStatus";
import { RenderProgress } from "@/components/RenderProgress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prefetchStockVideos } from "@/lib/prefetchStockVideos";
import { generateAllSceneAudio } from "@/lib/tts/generateAllSceneAudio";
import { RenderError, renderShortVideo } from "@/lib/renderVideo";
import {
  clearProject,
  loadScript,
  loadTopic,
  saveScript,
  saveTopic,
  saveVideoBlobUrl,
} from "@/lib/storage";
import { SCRIPT_STYLES, type ScriptStyle, type ShortScript } from "@/lib/types";
import { getVideoFilename } from "@/lib/videoUtils";

type PagePhase = "input" | "editor" | "rendering";
type PipelineStage = "voice" | "visuals" | "encode";

const VOICE_WEIGHT = 0.3;
const VISUALS_WEIGHT = 0.2;
const ENCODE_WEIGHT = 0.5;

export default function CreatePage() {
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);

  const [phase, setPhase] = useState<PagePhase>("input");
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState<ScriptStyle>("motivational");
  const [script, setScript] = useState<ShortScript | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [renderWarning, setRenderWarning] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>("voice");
  const [pipelineDetail, setPipelineDetail] = useState("");

  useEffect(() => {
    const savedTopic = loadTopic();
    const savedScript = loadScript();
    if (savedTopic) setTopic(savedTopic);
    if (savedScript) {
      setScript(savedScript);
      setPhase("editor");
    }
  }, []);

  const handleScriptChange = useCallback((updated: ShortScript) => {
    setScript(updated);
    saveScript(updated);
  }, []);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setGenerateError("Please enter a topic.");
      return;
    }

    setGenerateError(null);
    setIsGenerating(true);
    saveTopic(topic.trim());

    try {
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), style }),
      });

      const data = (await response.json()) as ShortScript | { error: string };

      if (!response.ok) {
        setGenerateError("error" in data ? data.error : "Generation failed.");
        return;
      }

      const generated = data as ShortScript;
      setScript(generated);
      saveScript(generated);
      setPhase("editor");
    } catch {
      setGenerateError("Script generation failed. Check your connection and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!script) return;

    setRenderError(null);
    setRenderWarning(null);
    setRenderProgress(0);
    setPipelineStage("voice");
    setPipelineDetail("");
    setPhase("rendering");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let workingScript = script;

      const ttsStatus = await fetch("/api/tts/status").then((r) =>
        r.json()
      ) as { available: boolean };

      if (ttsStatus.available) {
        const allVoiceReady = workingScript.scenes.every(
          (s) =>
            !s.text.trim() ||
            (s.audioStatus === "ready" && Boolean(s.audioPath))
        );

        if (!allVoiceReady) {
          setPipelineStage("voice");
          const scenesWithAudio = await generateAllSceneAudio(
          workingScript.scenes,
          ({ done, total }) => {
            const pct =
              total === 0 ? 0 : Math.round((done / total) * VOICE_WEIGHT * 100);
            setRenderProgress(pct);
            setPipelineDetail(
              total === 0
                ? ""
                : `Generating voice ${Math.min(done + 1, total)}/${total}...`
            );
          },
          controller.signal
        );

          workingScript = { ...workingScript, scenes: scenesWithAudio };
          setScript(workingScript);
          saveScript(workingScript);

          const voiceFailures = scenesWithAudio.filter(
            (s) => s.audioStatus === "error"
          ).length;
          if (voiceFailures > 0) {
            setRenderWarning(
              `${voiceFailures} scene(s) could not generate voice — continuing with partial or silent audio.`
            );
          }
        } else {
          setRenderProgress(Math.round(VOICE_WEIGHT * 100));
        }
      }

      if (controller.signal.aborted) return;

      setPipelineStage("visuals");
      setPipelineDetail("");
      const scenesWithVisuals = await prefetchStockVideos(
        workingScript.scenes,
        (done, total) => {
          const base = VOICE_WEIGHT * 100;
          const span = VISUALS_WEIGHT * 100;
          if (total === 0) {
            setRenderProgress(Math.round(base + span));
            return;
          }
          setRenderProgress(
            Math.round(base + (done / total) * span)
          );
        },
        controller.signal
      );

      if (controller.signal.aborted) return;

      setPipelineStage("encode");
      setPipelineDetail("");
      setRenderProgress(Math.round(VOICE_WEIGHT * 100 + VISUALS_WEIGHT * 100));

      const encodeBase = (VOICE_WEIGHT + VISUALS_WEIGHT) * 100;
      const { blob, usedSilentFallback } = await renderShortVideo(
        { ...workingScript, scenes: scenesWithVisuals },
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

      const blobUrl = URL.createObjectURL(blob);
      const filename = getVideoFilename(workingScript);
      saveVideoBlobUrl(blobUrl, filename);
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
    setPipelineStage("voice");
    setPipelineDetail("");
  };

  const handleReset = () => {
    abortRef.current?.abort();
    clearProject();
    setTopic("");
    setStyle("motivational");
    setScript(null);
    setPhase("input");
    setGenerateError(null);
    setRenderError(null);
    setRenderWarning(null);
    setRenderProgress(0);
    setPipelineStage("voice");
    setPipelineDetail("");
    setIsGenerating(false);
  };

  const hasProject = Boolean(script || topic.trim());

  const pipelineLabel =
    pipelineStage === "voice"
      ? pipelineDetail || "Generating voiceover..."
      : pipelineStage === "visuals"
        ? "Fetching visuals..."
        : "Rendering video...";

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <header className="space-y-2 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          ShortsForge Lite
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Create YouTube Shorts
        </h1>
        <p className="text-muted-foreground">
          Enter a topic, generate a script, and create your short in one click.
        </p>
      </header>

      {(phase === "input" || !script) && (
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

      {script && phase !== "rendering" && (
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
            <ScriptEditor script={script} onChange={handleScriptChange} />

            <VoiceoverStatus script={script} />

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
          statusLabel={pipelineLabel}
          onCancel={handleCancelRender}
        />
      )}
    </div>
  );
}
