import type { SceneMood } from "@/lib/types";

export interface MoodPreset {
  gradientAngle: number;
  hueShiftRange: number;
  cycleFrames: number;
  secondaryHueOffset: number;
  lightnessBase: number;
}

export const MOOD_PRESETS: Record<SceneMood, MoodPreset> = {
  energetic: {
    gradientAngle: 135,
    hueShiftRange: 28,
    cycleFrames: 450,
    secondaryHueOffset: 40,
    lightnessBase: 14,
  },
  calm: {
    gradientAngle: 180,
    hueShiftRange: 8,
    cycleFrames: 900,
    secondaryHueOffset: 25,
    lightnessBase: 10,
  },
  dramatic: {
    gradientAngle: 160,
    hueShiftRange: 12,
    cycleFrames: 600,
    secondaryHueOffset: -30,
    lightnessBase: 8,
  },
  mysterious: {
    gradientAngle: 200,
    hueShiftRange: 15,
    cycleFrames: 750,
    secondaryHueOffset: 50,
    lightnessBase: 9,
  },
  uplifting: {
    gradientAngle: 150,
    hueShiftRange: 20,
    cycleFrames: 540,
    secondaryHueOffset: 35,
    lightnessBase: 16,
  },
  intense: {
    gradientAngle: 120,
    hueShiftRange: 32,
    cycleFrames: 360,
    secondaryHueOffset: -15,
    lightnessBase: 12,
  },
};

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function buildMoodGradient(
  accentColor: string,
  mood: SceneMood,
  hueShift: number
): string {
  const { h, s } = hexToHsl(accentColor);
  const preset = MOOD_PRESETS[mood];
  const h1 = h + hueShift;
  const h2 = h + hueShift + preset.secondaryHueOffset;
  const h3 = h + hueShift - preset.secondaryHueOffset * 0.5;
  const sat = Math.min(70, Math.max(35, s));
  const l1 = preset.lightnessBase;
  const l2 = Math.max(4, l1 - 4);
  const l3 = Math.max(6, l1 - 2);

  return `linear-gradient(
    ${preset.gradientAngle}deg,
    hsl(${h1}, ${sat}%, ${l1}%) 0%,
    hsl(${h2}, ${sat * 0.85}%, ${l2}%) 45%,
    hsl(${h3}, ${sat * 0.9}%, ${l3}%) 100%
  )`;
}
