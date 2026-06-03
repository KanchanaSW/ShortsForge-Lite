"use client";

import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export function Background() {
  const frame = useCurrentFrame();
  const hueShift = interpolate(frame % 900, [0, 450, 900], [0, 20, 0]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(
          160deg,
          hsl(${320 + hueShift}, 45%, 12%) 0%,
          hsl(${280 + hueShift}, 35%, 8%) 40%,
          hsl(${340 + hueShift}, 50%, 10%) 100%
        )`,
      }}
    />
  );
}
