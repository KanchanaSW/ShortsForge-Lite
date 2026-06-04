"use client";

import { AbsoluteFill } from "remotion";

interface CaptionOverlayProps {
  text: string;
  opacity: number;
  translateY: number;
  variant: "short" | "long";
}

function shortFontSize(text: string): number {
  const len = text.length;
  if (len > 200) return 48;
  if (len > 120) return 56;
  return 72;
}

function longFontSize(text: string): number {
  const len = text.length;
  if (len > 200) return 28;
  if (len > 120) return 32;
  return 36;
}

export function CaptionOverlay({
  text,
  opacity,
  translateY,
  variant,
}: CaptionOverlayProps) {
  if (variant === "short") {
    const fontSize = shortFontSize(text);
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

  const fontSize = longFontSize(text);
  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "stretch",
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          padding: "24px 48px 32px",
          borderTop: "3px solid rgba(227, 11, 92, 0.8)",
        }}
      >
        <div
          style={{
            color: "#FFFFFF",
            fontSize,
            fontWeight: 600,
            lineHeight: 1.35,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
}
