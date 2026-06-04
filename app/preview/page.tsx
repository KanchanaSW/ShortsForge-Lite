"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  clearProject,
  loadRenderMeta,
  loadVideoBlobUrl,
} from "@/lib/storage";
import { getModeLabel } from "@/lib/videoConfig";
import type { RenderMeta } from "@/lib/types";

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export default function PreviewPage() {
  const router = useRouter();
  const [video, setVideo] = useState<{ url: string; filename: string } | null>(
    null
  );
  const [meta, setMeta] = useState<RenderMeta | null>(null);

  useEffect(() => {
    const stored = loadVideoBlobUrl();
    if (!stored) {
      router.replace("/create");
      return;
    }
    setVideo(stored);
    setMeta(loadRenderMeta());
  }, [router]);

  const handleCreateNew = () => {
    clearProject();
    router.push("/create");
  };

  if (!video) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        Loading preview...
      </div>
    );
  }

  const isLong = meta?.mode === "long";
  const aspectClass = isLong ? "aspect-video" : "aspect-[9/16]";

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Your Video</h1>
        <p className="text-muted-foreground">
          Preview your video and download the MP4.
        </p>
      </header>

      {meta && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
            <div className="text-xs text-muted-foreground">Video Type</div>
            <div className="text-sm font-medium">{getModeLabel(meta.mode)}</div>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
            <div className="text-xs text-muted-foreground">Resolution</div>
            <div className="text-sm font-medium">{meta.resolution}</div>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
            <div className="text-xs text-muted-foreground">Duration</div>
            <div className="text-sm font-medium">
              {formatDuration(meta.durationSeconds)}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
            <div className="text-xs text-muted-foreground">Chapters</div>
            <div className="text-sm font-medium">{meta.chapterCount}</div>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
            <div className="text-xs text-muted-foreground">Scenes</div>
            <div className="text-sm font-medium">{meta.sceneCount}</div>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
            <div className="text-xs text-muted-foreground">Status</div>
            <div className="text-sm font-medium text-green-400">Ready</div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="overflow-hidden rounded-xl border border-border bg-black">
            <video
              src={video.url}
              controls
              className={`${aspectClass} w-full object-contain`}
              playsInline
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={video.url}
              download={video.filename}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-base font-medium text-white hover:bg-primary/90"
            >
              <Download className="h-4 w-4" />
              Download MP4
            </a>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={handleCreateNew}
            >
              <Plus className="h-4 w-4" />
              Create New Video
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
