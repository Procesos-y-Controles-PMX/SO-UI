"use client";

import React, { useEffect, useRef, useState } from "react";

import { cn } from "./lib/cn";

/**
 * Ambient noise field — a lattice of portrait capsules whose brightness is
 * driven by an animated value-noise field.
 *
 * Sibling to `InteractiveGridPattern`, not a variant of it. That component is a
 * *sparse* effect: a directional crest travels along grid rows and cells outside
 * the band paint nothing. This one is *dense* — every cell is always filled and
 * only its value moves, which is what makes it read as a lit surface rather than
 * as a wave crossing a grid.
 *
 * Defaults were fitted against a reference clip rather than guessed, and three
 * of them are counterintuitive enough to be worth stating:
 *
 * - Noise is sampled in **pixel space and anisotropically**. Measured blobs are
 *   ~1.9x wider than tall, which needs `featureWidth` wider than
 *   `featureHeight`. Isotropic noise over (col, row) instead yields
 *   blobs taller than they are wide, because cells are ~2.4:1 portrait.
 * - Brightness is **continuous**, never stepped. A quantized ladder (the idiom
 *   `InteractiveGridPattern` uses for its crest) reads as banding here, since
 *   no motion hides the steps.
 * - `contrast` exists because trilinear value noise is not uniform: it clusters
 *   near 0.5 (measured p5..p95 of only 0.28..0.74). Stretching about the
 *   midpoint gives the texture enough range to reach true black.
 *
 * Brightness is built as **base + wave + texture**. `baseLevel` sets a resting
 * mid-gray, the wave only ever brightens from there, and the noise is a
 * *signed* texture dithering either side of it. An earlier version made the
 * noise the field and added the wave on top; that could not hold a tight
 * mid-gray distribution and a strong wave at once, and every fit bought the
 * distribution by driving `waveStrength` to near zero. When the cheapest fit
 * deletes the feature, the structure is wrong, not the numbers.
 *
 * Motion has three independent parts, and the wind-like read depends on all
 * three being present:
 *
 * - `driftX` advects the field sideways. Tuned so the field's apparent
 *   velocity measures ~12 px/s, matching the reference; the value is lower
 *   than that because `evolve` churn also carries features along.
 * - `gustAmplitude` makes that speed *vary* — the reference gusts between about
 *   +10 and +48 px/s. The gust is integrated into a position offset rather than
 *   applied as a velocity, so the field never jumps when the speed changes.
 * - `evolve` churns the field in place. This does most of the perceived motion:
 *   advection alone moves features less than one cell per second, far too little
 *   to explain how fast the reference decorrelates (half its correlation inside
 *   ~1s). A field that only translates reads as a sliding texture, not wind.
 *
 * `pulse` is a global brightness breathe, off by default. The reference clip
 * has one (a sinusoid fits at R^2 = 0.97), but it reads as the whole surface
 * dimming at once, so it is opt-in rather than shipped.
 *
 * On top of the field, `wave` runs a traveling wave along the rows, the same
 * axis `InteractiveGridPattern`'s beach wave uses, and keeps its texture: a
 * sine-sum warp frays the crest so it never reads as a straight rule, and foam
 * speckles the cells whose noise clears a threshold.
 *
 * It departs from that component in being *continuous* rather than episodic.
 * The reference is periodic — its pattern autocorrelation drops to ~0 at half a
 * cycle and recovers to 0.76 at 2.07s — so crests repeat on a fixed wavelength
 * with no idle gap, and there is no spawn plan or follower. Phase comes from
 * elapsed time alone, so there is no wave state to keep in sync. The wave adds
 * to the ambient field rather than replacing the cells it crosses.
 *
 * `waveFalloff` reproduces the reference's vertical amplitude envelope: the
 * wave measured ±1.9 at the first row and ±25 by the last, so it is nearly
 * absent at the leading edge and full strength at the trailing one.
 *
 * Defaults are fitted to the reference's whole quantile curve, not a handful of
 * percentiles — median and p95 can both match while the distribution's shape is
 * wrong, and p25 is the statistic that exposes it. Tune `featureWidth`/
 * `featureHeight` for blob size, `baseLevel`/`texture` for how the field sits,
 * `octaveAmplitude` for grain.
 *
 * Values composite as alpha over whatever sits behind, so the field inherits the
 * page background instead of assuming black.
 *
 * Rendering is one <canvas> with no offscreen cache: every cell changes every
 * frame, so there is no static layer worth keeping. All animation state lives in
 * refs — no React re-render per tick, no per-cell DOM.
 */
export interface NoiseFieldProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "color"> {
  /** Cell width in CSS pixels. @default 10 */
  cellWidth?: number;
  /** Cell height in CSS pixels. @default 40 */
  cellHeight?: number;
  /** Space between cells in CSS pixels, both axes. @default 4 */
  gap?: number;
  /** Corner radius in CSS pixels. Clamped to half the smaller cell side. @default 3 */
  radius?: number;
  /** Cell color as `[r, g, b]`, 0–255. Brightness drives alpha. @default [255,255,255] */
  color?: [number, number, number];
  /** Alpha of the brightest cell. @default 0.99 */
  maxOpacity?: number;
  /** Alpha floor, applied before the pulse. @default 0 */
  minOpacity?: number;
  /**
   * Spread of the raw noise about its midpoint. Values above 1 widen the
   * texture's range and let cells reach true black. @default 1.96
   */
  contrast?: number;
  /**
   * Resting brightness before wave and texture, 0–1. The wave brightens from
   * here; texture dithers either side of it. @default 0.191
   */
  baseLevel?: number;
  /**
   * Amplitude of the signed noise texture, 0–1. Carries the cell-to-cell grain
   * and the dark tail. @default 0.349
   */
  texture?: number;
  /** Blob width in CSS pixels — horizontal noise feature size. @default 250 */
  featureWidth?: number;
  /** Blob height in CSS pixels — vertical noise feature size. @default 212 */
  featureHeight?: number;
  /** Octaves of value noise. 2 adds fine grain; 1 is cheaper and smoother. @default 2 */
  octaves?: 1 | 2;
  /** Amplitude of the second octave relative to the first. @default 0.19 */
  octaveAmplitude?: number;
  /** Frequency multiplier of the second octave. @default 2.9 */
  octaveFrequency?: number;
  /** Sideways drift in CSS pixels per second. Positive blows right. @default 10 */
  driftX?: number;
  /** Vertical drift in CSS pixels per second. Positive drifts down. @default 0 */
  driftY?: number;
  /** How much the sideways speed gusts, in CSS pixels per second. @default 14 */
  gustAmplitude?: number;
  /** Rough seconds per gust cycle. @default 1.5 */
  gustSeconds?: number;
  /**
   * Rate the field churns in place, in noise units per second. The main source
   * of perceived motion — see the note above before lowering it. @default 0.14
   */
  evolve?: number;
  /** Depth of the global brightness breathe, 0–1. Off by default. @default 0 */
  pulse?: number;
  /** Seconds per breathe cycle. @default 2.32 */
  pulseSeconds?: number;
  /** Run a traveling wave along the rows. @default true */
  wave?: boolean;
  /** Seconds per wave cycle. @default 2.07 */
  waveSeconds?: number;
  /** Distance between successive crests, in CSS pixels. @default 780 */
  waveLength?: number;
  /** How much a crest brightens what it crosses, 0–1. @default 0.2 */
  waveStrength?: number;
  /**
   * Crest tightness. 1 is a plain cosine; higher narrows the crest and lengthens
   * the wash behind it. @default 1.94
   */
  waveSharpness?: number;
  /** How far the shoreline warp frays the crest, in CSS pixels. @default 90 */
  waveWarp?: number;
  /** Travel direction: -1 runs up the rows, 1 runs down. @default -1 */
  waveDirection?: 1 | -1;
  /**
   * Vertical amplitude envelope, 0–1: the wave's strength at the edge it
   * travels toward, ramping to full at the edge it comes from. 1 disables the
   * envelope. @default 0.34
   */
  waveFalloff?: number;
  className?: string;
}

const DEFAULT_CELL_W = 10;
const DEFAULT_CELL_H = 40;
const DEFAULT_GAP = 4;
const DEFAULT_RADIUS = 3;
const DEFAULT_FEATURE_W = 250;
const DEFAULT_FEATURE_H = 212;
const DEFAULT_CONTRAST = 1.96;
const DEFAULT_BASE_LEVEL = 0.191;
const DEFAULT_TEXTURE = 0.349;
const DEFAULT_MAX_OPACITY = 0.99;
const DEFAULT_OCTAVE_AMP = 0.19;
const DEFAULT_OCTAVE_FREQ = 2.9;
const DEFAULT_DRIFT_X = 10;
const DEFAULT_DRIFT_Y = 0;
const DEFAULT_GUST_AMP = 14;
const DEFAULT_GUST_SECONDS = 1.5;
const DEFAULT_EVOLVE = 0.14;
/** Second gust harmonic, incommensurate with the first so gusts don't visibly repeat. */
const GUST_RATIO = 0.61;
const GUST_PHASE = 1.3;
const DEFAULT_PULSE = 0;
const DEFAULT_PULSE_SECONDS = 2.32;
const DEFAULT_WAVE_SECONDS = 2.07;
const DEFAULT_WAVE_LENGTH = 780;
const DEFAULT_WAVE_STRENGTH = 0.2;
const DEFAULT_WAVE_SHARPNESS = 2.57;
const DEFAULT_WAVE_WARP = 90;
const DEFAULT_WAVE_FALLOFF = 0.34;
/** Debounced resize re-measure (ResizeObserver storms are real — see sidebar jank). */
const RESIZE_DEBOUNCE_MS = 150;

function fract(n: number): number {
  return n - Math.floor(n);
}

/** Deterministic 0..1 hash on an integer lattice point. */
function hash3(x: number, y: number, z: number): number {
  return fract(Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453);
}

/** Hermite ease — smooth first derivative, so blobs have no lattice creases. */
function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Trilinear value noise, 0..1. z is the morph axis. */
function valueNoise(x: number, y: number, z: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const xf = smooth(x - xi);
  const yf = smooth(y - yi);
  const zf = smooth(z - zi);

  const x00 = lerp(hash3(xi, yi, zi), hash3(xi + 1, yi, zi), xf);
  const x10 = lerp(hash3(xi, yi + 1, zi), hash3(xi + 1, yi + 1, zi), xf);
  const x01 = lerp(hash3(xi, yi, zi + 1), hash3(xi + 1, yi, zi + 1), xf);
  const x11 = lerp(hash3(xi, yi + 1, zi + 1), hash3(xi + 1, yi + 1, zi + 1), xf);

  return lerp(lerp(x00, x10, yf), lerp(x01, x11, yf), zf);
}

/**
 * Wave brightness at a point, 0..1.
 *
 * `phase` is the point's position along travel divided by the wavelength, minus
 * elapsed cycles — so a whole number is a crest. `n` is the cell's stable 0..1
 * noise, driving both the warp jitter and the foam, exactly as the beach wave in
 * `InteractiveGridPattern` does.
 */
function waveAt(
  phase: number,
  across: number,
  n: number,
  sharpness: number,
  warpTurns: number,
): number {
  // Frays the crest so it never reads as a straight rule across the grid.
  const warp =
    Math.sin(across * 2.1 + phase * 0.7) * 0.55 +
    Math.sin(across * 5.3 - phase * 0.4) * 0.3 +
    Math.sin(across * 9.1 + n * 5.5) * 0.15 +
    (n - 0.5) * 0.4;

  const cycle = (phase + warp * warpTurns) * Math.PI * 2;
  // 0 at the trough, 1 at the crest.
  const raw = 0.5 + 0.5 * Math.cos(cycle);
  const profile = Math.pow(raw, sharpness);
  const foam = n > 0.62 ? (n - 0.62) * 1.15 * profile : 0;
  return Math.min(1, profile * 0.92 + foam);
}

/**
 * Horizontal offset in CSS pixels at `t` seconds — the integral of
 * `driftX + gust`, so a changing gust speed never teleports the field.
 */
function windOffset(
  t: number,
  driftX: number,
  gustAmp: number,
  gustSec: number,
): number {
  const t2 = gustSec * GUST_RATIO;
  const a = (gustAmp * 0.6 * gustSec) / (Math.PI * 2);
  const b = (gustAmp * 0.4 * t2) / (Math.PI * 2);
  return (
    driftX * t -
    a * (Math.cos((Math.PI * 2 * t) / gustSec) - 1) -
    b * (Math.cos((Math.PI * 2 * t) / t2 + GUST_PHASE) - Math.cos(GUST_PHASE))
  );
}

/** Geometry derived from the measured clip box. */
interface FieldGeometry {
  cellW: number;
  cellH: number;
  pitchX: number;
  pitchY: number;
  cols: number;
  rows: number;
  offsetLeft: number;
  offsetTop: number;
  boxW: number;
  boxH: number;
  dpr: number;
}

export function NoiseField({
  cellWidth = DEFAULT_CELL_W,
  cellHeight = DEFAULT_CELL_H,
  gap = DEFAULT_GAP,
  radius = DEFAULT_RADIUS,
  color = [255, 255, 255],
  maxOpacity = DEFAULT_MAX_OPACITY,
  minOpacity = 0,
  contrast = DEFAULT_CONTRAST,
  baseLevel = DEFAULT_BASE_LEVEL,
  texture = DEFAULT_TEXTURE,
  featureWidth = DEFAULT_FEATURE_W,
  featureHeight = DEFAULT_FEATURE_H,
  octaves = 2,
  octaveAmplitude = DEFAULT_OCTAVE_AMP,
  octaveFrequency = DEFAULT_OCTAVE_FREQ,
  driftX = DEFAULT_DRIFT_X,
  driftY = DEFAULT_DRIFT_Y,
  gustAmplitude = DEFAULT_GUST_AMP,
  gustSeconds = DEFAULT_GUST_SECONDS,
  evolve = DEFAULT_EVOLVE,
  pulse = DEFAULT_PULSE,
  pulseSeconds = DEFAULT_PULSE_SECONDS,
  wave = true,
  waveSeconds = DEFAULT_WAVE_SECONDS,
  waveLength = DEFAULT_WAVE_LENGTH,
  waveStrength = DEFAULT_WAVE_STRENGTH,
  waveSharpness = DEFAULT_WAVE_SHARPNESS,
  waveWarp = DEFAULT_WAVE_WARP,
  waveDirection = -1,
  waveFalloff = DEFAULT_WAVE_FALLOFF,
  className,
  ...props
}: NoiseFieldProps) {
  const clipRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  const geomRef = useRef<FieldGeometry | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  const cellW = Math.max(1, cellWidth);
  const cellH = Math.max(1, cellHeight);
  const gapPx = Math.max(0, gap);
  const cornerR = Math.max(0, Math.min(radius, Math.min(cellW, cellH) / 2));
  const featW = Math.max(8, featureWidth);
  const featH = Math.max(8, featureHeight);
  const lo = Math.min(minOpacity, maxOpacity);
  const hi = Math.max(minOpacity, maxOpacity);
  const spread = Math.max(0, contrast);
  const octAmp = Math.max(0, octaveAmplitude);
  const octFreq = Math.max(1, octaveFrequency);
  const gustAmp = Math.max(0, gustAmplitude);
  const gustSec = Math.max(0.1, gustSeconds);
  const waveSec = Math.max(0.05, waveSeconds);
  const waveLen = Math.max(8, waveLength);
  const waveAmt = Math.max(0, waveStrength);
  const waveSharp = Math.max(0.1, waveSharpness);
  const warpPx = Math.max(0, waveWarp);
  const waveDir = waveDirection === 1 ? 1 : -1;
  const waveEdge = Math.min(1, Math.max(0, waveFalloff));
  const waveOn = wave && waveAmt > 0;
  // Warp is authored in pixels but applied to phase, which is in wavelengths.
  const warpTurns = warpPx / waveLen;
  const baseLvl = Math.min(1, Math.max(0, baseLevel));
  const textureAmt = Math.max(0, texture);
  const pulseDepth = Math.min(1, Math.max(0, pulse));
  const pulsePeriod = Math.max(0.1, pulseSeconds);
  const [cr, cg, cb] = color;
  const rgb = `${Math.round(cr)}, ${Math.round(cg)}, ${Math.round(cb)}`;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const clip = clipRef.current;
    const canvas = canvasRef.current;
    if (!clip || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const supportsRound = typeof ctx.roundRect === "function";

    const buildGeometry = (): FieldGeometry | null => {
      const r = clip.getBoundingClientRect();
      const boxW = Math.max(0, r.width);
      const boxH = Math.max(0, r.height);
      if (boxW === 0 || boxH === 0) return null;

      const pitchX = cellW + gapPx;
      const pitchY = cellH + gapPx;
      // One extra cell each axis so the centered lattice still covers the box.
      const cols = Math.ceil(boxW / pitchX) + 1;
      const rows = Math.ceil(boxH / pitchY) + 1;
      return {
        cellW,
        cellH,
        pitchX,
        pitchY,
        cols,
        rows,
        offsetLeft: (boxW - cols * pitchX) / 2,
        offsetTop: (boxH - rows * pitchY) / 2,
        boxW,
        boxH,
        dpr: Math.min(2, window.devicePixelRatio || 1),
      };
    };

    const measure = () => {
      const geom = buildGeometry();
      geomRef.current = geom;
      if (!geom) return;
      canvas.width = Math.max(1, Math.round(geom.boxW * geom.dpr));
      canvas.height = Math.max(1, Math.round(geom.boxH * geom.dpr));
      canvas.style.width = `${geom.boxW}px`;
      canvas.style.height = `${geom.boxH}px`;
    };

    /** @param elapsed seconds since mount; 0 renders the reduced-motion still. */
    const draw = (elapsed: number) => {
      const geom = geomRef.current;
      if (!geom) return;

      ctx.setTransform(geom.dpr, 0, 0, geom.dpr, 0, 0);
      ctx.clearRect(0, 0, geom.boxW, geom.boxH);

      // Wind moves the sample window, not the lattice, so cells stay put.
      const xShift = windOffset(elapsed, driftX, gustAmp, gustSec) / featW;
      const yShift = (elapsed * driftY) / featH;
      const z = elapsed * evolve;
      const breathe =
        pulseDepth === 0
          ? 1
          : 1 + pulseDepth * Math.sin((elapsed / pulsePeriod) * Math.PI * 2);

      // The wave is continuous and periodic: phase advances one wavelength per
      // `waveSec`, so there is no episode or gap to track.
      const wavePhase = elapsed / waveSec;

      for (let row = 0; row < geom.rows; row += 1) {
        const y = geom.offsetTop + row * geom.pitchY;
        const ny = (y + geom.cellH / 2) / featH + yShift;

        for (let col = 0; col < geom.cols; col += 1) {
          const x = geom.offsetLeft + col * geom.pitchX;
          const nx = (x + geom.cellW / 2) / featW - xShift;

          let n = valueNoise(nx, ny, z);
          if (octaves > 1 && octAmp > 0) {
            // Second octave supplies the cell-to-cell grain, not the structure.
            n =
              (n + valueNoise(nx * octFreq, ny * octFreq, z * 1.7) * octAmp) /
              (1 + octAmp);
          }

          // Stretch about the midpoint, then centre it: value noise clusters
          // near 0.5, so the stretch gives the texture usable range.
          const stretched = Math.min(1, Math.max(0, 0.5 + (n - 0.5) * spread));
          const tex = (stretched - 0.5) * 2; // -1..1, signed

          // Resting level plus texture; the wave lifts from here.
          let level = (baseLvl + tex * textureAmt) * breathe;

          if (waveOn) {
            // Travel runs along the rows; direction -1 sends crests up the grid.
            const yt = waveDir === 1 ? y : geom.boxH - y;
            const cellN = hash3(col, row, 17.3);
            const crest = waveAt(
              yt / waveLen - wavePhase,
              x / waveLen,
              cellN,
              waveSharp,
              warpTurns,
            );
            // Envelope: near-silent at the edge the wave runs toward, full at
            // the edge it comes from. Matches the reference's row amplitudes.
            // `yt` is distance from the edge the wave comes from, so strength
            // must FALL as it grows — not rise with it.
            const env =
              waveEdge >= 1
                ? 1
                : waveEdge +
                  (1 - waveEdge) * (geom.boxH <= 0 ? 1 : 1 - yt / geom.boxH);
            // The wave only ever brightens, lifting from the resting level.
            if (crest > 0) level += crest * waveAmt * env;
          }

          const shaped = Math.min(1, Math.max(0, level));
          const alpha = lo + (hi - lo) * shaped;
          if (alpha <= 0.002) continue;

          ctx.fillStyle = `rgba(${rgb}, ${alpha.toFixed(3)})`;
          if (supportsRound && cornerR > 0) {
            ctx.beginPath();
            ctx.roundRect(x, y, geom.cellW, geom.cellH, cornerR);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, geom.cellW, geom.cellH);
          }
        }
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };

    measure();

    if (reduceMotion) {
      // Static still — the field's look survives without the motion.
      draw(0);
    } else {
      startRef.current = performance.now();
      // rAF pauses on its own while the document is hidden, so elapsed time is
      // read per frame rather than accumulated — no catch-up jump on re-show.
      const loop = () => {
        rafRef.current = requestAnimationFrame(loop);
        draw((performance.now() - startRef.current) / 1000);
      };
      rafRef.current = requestAnimationFrame(loop);
    }

    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        measure();
        if (reduceMotion) draw(0);
      }, RESIZE_DEBOUNCE_MS);
    });
    ro.observe(clip);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      window.clearTimeout(resizeTimer);
      ro.disconnect();
    };
  }, [
    cellW,
    cellH,
    gapPx,
    cornerR,
    rgb,
    lo,
    hi,
    spread,
    baseLvl,
    textureAmt,
    featW,
    featH,
    octaves,
    octAmp,
    octFreq,
    driftX,
    driftY,
    gustAmp,
    gustSec,
    evolve,
    pulseDepth,
    pulsePeriod,
    waveOn,
    waveSec,
    waveLen,
    waveAmt,
    waveSharp,
    warpTurns,
    waveDir,
    waveEdge,
    reduceMotion,
  ]);

  return (
    <div
      ref={clipRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      {...props}
    >
      <canvas ref={canvasRef} style={{ position: "absolute", left: 0, top: 0 }} />
    </div>
  );
}
