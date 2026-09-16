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
