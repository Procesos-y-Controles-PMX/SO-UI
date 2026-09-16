import type { NoiseFieldProps } from "./noise-field";

/**
 * Per-user in-app NoiseField knobs. Adding someone is a new email key — it
 * does not grant admin access. Shells animate for the owner (library
 * defaults + theme color) *or* anyone listed here.
 */
export type AmbientNoiseTune = Pick<
  NoiseFieldProps,
  | "color"
  | "waveStrength"
  | "waveSeconds"
  | "waveLength"
  | "waveSharpness"
  | "waveFalloff"
  | "waveWarp"
  | "waveDirection"
  | "wave"
  | "driftX"
  | "gustAmplitude"
  | "gustSeconds"
  | "evolve"
  | "driftY"
  | "featureWidth"
  | "featureHeight"
  | "contrast"
  | "baseLevel"
  | "texture"
  | "octaveAmplitude"
  | "octaveFrequency"
  | "octaves"
  | "maxOpacity"
  | "minOpacity"
  | "cellWidth"
  | "cellHeight"
  | "gap"
  | "radius"
  | "pulse"
  | "pulseSeconds"
>;

export const AMBIENT_NOISE_PROFILES: Record<string, AmbientNoiseTune> = {
  "alejandra.rangel@ext.cemex.com": {
    color: [0, 66, 170],
    waveStrength: 0,
    waveSeconds: 8,
    waveLength: 1530,
    waveDirection: 1,
    driftX: 20,
    gustAmplitude: 20,
    gustSeconds: 1,
    evolve: 0.26,
    driftY: -9,
    featureWidth: 300,
    featureHeight: 150,
    contrast: 3,
    baseLevel: 0.4,
    texture: 0.5,
    octaveAmplitude: 0,
    octaveFrequency: 2.8,
    maxOpacity: 1,
    cellWidth: 20,
    cellHeight: 20,
    gap: 1,
    radius: 20,
  },
};

export function customAmbientNoise(
  email: string | null | undefined,
): AmbientNoiseTune | null {
  const key = (email ?? "").trim().toLowerCase();
  return AMBIENT_NOISE_PROFILES[key] ?? null;
}

/** @deprecated Use AmbientNoiseTune */
export type CustomAmbientNoise = AmbientNoiseTune;

const BRAND_VAR_KEYS = [
  "--brand",
  "--brand-hover",
  "--brand-active",
  "--brand-tint",
] as const;

function clampByte(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function mixRgb(
  rgb: [number, number, number],
  toward: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    clampByte(rgb[0] + (toward[0] - rgb[0]) * t),
    clampByte(rgb[1] + (toward[1] - rgb[1]) * t),
    clampByte(rgb[2] + (toward[2] - rgb[2]) * t),
  ];
}

function toHex(rgb: [number, number, number]) {
  return `#${rgb.map((n) => clampByte(n).toString(16).padStart(2, "0")).join("")}`;
}

/** Map a NoiseField RGB onto clay `--brand*` tokens. */
export function brandVarsFromColor(
  color: [number, number, number],
): Record<(typeof BRAND_VAR_KEYS)[number], string> {
  const rgb: [number, number, number] = [
    clampByte(color[0]),
    clampByte(color[1]),
    clampByte(color[2]),
  ];
  const hover = mixRgb(rgb, [0, 0, 0], 0.16);
  const active = mixRgb(rgb, [0, 0, 0], 0.28);
  return {
    "--brand": toHex(rgb),
    "--brand-hover": toHex(hover),
    "--brand-active": toHex(active),
    "--brand-tint": `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.14)`,
  };
}

export const AMBIENT_BRAND_VAR_KEYS = BRAND_VAR_KEYS;
