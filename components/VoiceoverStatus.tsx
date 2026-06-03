"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { previewTextWithWebSpeech } from "@/lib/tts/webSpeechPreview";
import type { ShortScript } from "@/lib/types";

interface VoiceoverStatusProps {
  script: ShortScript;
}

export function VoiceoverStatus({ script }: VoiceoverStatusProps) {
  const [cliAvailable, setCliAvailable] = useState<boolean | null>(null);
  const [installHint, setInstallHint] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tts/status")
      .then((r) => r.json())
      .then((data: { available: boolean; installHint: string }) => {
        if (!cancelled) {
          setCliAvailable(data.available);
          setInstallHint(data.installHint);
        }
      })
      .catch(() => {
        if (!cancelled) setCliAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const readyCount = script.scenes.filter((s) => s.audioStatus === "ready").length;

  if (cliAvailable === false) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
        <p className="font-medium">edge-tts not found — video will render without voice</p>
        <p className="mt-1 text-xs text-amber-200/90">{installHint}</p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-2"
          onClick={() => {
            const first = script.scenes.find((s) => s.text.trim());
            if (first) previewTextWithWebSpeech(first.text);
          }}
        >
          Preview voice (browser only)
        </Button>
      </div>
    );
  }

  if (cliAvailable === null) return null;

  return (
    <p className="text-xs text-muted-foreground">
      Voiceover via Edge TTS
      {readyCount > 0
        ? ` — ${readyCount}/${script.scenes.length} scenes cached`
        : " — generated automatically when you create the video"}
    </p>
  );
}
