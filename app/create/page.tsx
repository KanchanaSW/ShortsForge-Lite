"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Video } from "lucide-react";
import { ScriptEditor } from "@/components/ScriptEditor";
import { RenderProgress } from "@/components/RenderProgress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RenderError, renderShortVideo } from "@/lib/renderVideo";
import {
  loadScript,
  loadTopic,
  saveScript,
  saveTopic,
  saveVideoBlobUrl,
} from "@/lib/storage";
import { SCRIPT_STYLES, type ScriptStyle, type ShortScript } from "@/lib/types";
import { getVideoFilename } from "@/lib/videoUtils";

type PagePhase = "input" | "editor" | "rendering";

export default function CreatePage() {
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);

  const [phase, setPhase] = useState<PagePhase>("input");
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState<ScriptStyle>("motivational");
  const [script, setScript] = useState<ShortScript | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);

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

  const handleRender = async () => {
    if (!script) return;

    setRenderError(null);
    setRenderProgress(0);
    setPhase("rendering");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const blob = await renderShortVideo(
        script,
        setRenderProgress,
        controller.signal
      );

      const blobUrl = URL.createObjectURL(blob);
      const filename = getVideoFilename(script);
      saveVideoBlobUrl(blobUrl, filename);
      router.push("/preview");
    } catch (error) {
      const message =
        error instanceof RenderError
          ? error.message
          : "Video rendering failed. Try reducing scene count or text length.";
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
  };

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
          Enter a topic, generate a script, and render a vertical short video.
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
            </div>

            {generateError && (
              <p className="text-sm text-red-400">{generateError}</p>
            )}

            <Button
              type="button"
              size="lg"
              className="w-full"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating Script..." : "Generate Script"}
            </Button>
          </CardContent>
        </Card>
      )}

      {script && phase !== "rendering" && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2 — Edit Script</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ScriptEditor script={script} onChange={handleScriptChange} />

            {renderError && (
              <p className="text-sm text-red-400">{renderError}</p>
            )}

            <Button
              type="button"
              size="lg"
              className="w-full"
              onClick={handleRender}
            >
              <Video className="h-4 w-4" />
              Render Video
            </Button>
          </CardContent>
        </Card>
      )}

      {phase === "rendering" && (
        <RenderProgress progress={renderProgress} onCancel={handleCancelRender} />
      )}
    </div>
  );
}
