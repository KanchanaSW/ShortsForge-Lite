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
import { clearProject, loadVideoBlobUrl } from "@/lib/storage";

export default function PreviewPage() {
  const router = useRouter();
  const [video, setVideo] = useState<{ url: string; filename: string } | null>(
    null
  );

  useEffect(() => {
    const stored = loadVideoBlobUrl();
    if (!stored) {
      router.replace("/create");
      return;
    }
    setVideo(stored);
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

  return (
    <div className="mx-auto max-w-lg space-y-8 px-4 py-12">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Your Short</h1>
        <p className="text-muted-foreground">
          Preview your video and download the MP4.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="overflow-hidden rounded-xl border border-border bg-black">
            <video
              src={video.url}
              controls
              className="aspect-[9/16] w-full object-contain"
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
