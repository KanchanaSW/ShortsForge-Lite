"use client";

import { AbsoluteFill } from "remotion";

interface CaptionTextProps {
  text: string;
  opacity: number;
  translateY: number;
}

function captionFontSize(text: string): number {
  const len = text.length;
  if (len > 200) return 48;
  if (len > 120) return 56;
  return 72;
}

export function CaptionText({ text, opacity, translateY }: CaptionTextProps) {
  const fontSize = captionFontSize(text);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: "80px 64px",
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          color: "#FFFFFF",
          fontSize,
          fontWeight: 800,
          lineHeight: 1.15,
          textAlign: "center",
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          textShadow: "0 4px 24px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)",
          letterSpacing: "-0.02em",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
}
