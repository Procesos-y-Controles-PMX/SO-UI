"use client";

import React, { useEffect, useRef, useState } from "react";

import { cn } from "./lib/cn";

/**
 * Interactive tilted grid — screen-space square cells.
 *
 * Paint and hit-test share one model:
 * - Cells are fixed CSS pixels (always square)
 * - Layer is centered with pixel left/top (no % translate)
 * - Skew is SVG `skewY` about the layer center
 * - Pointer → cell uses the inverse of that same skew (no getScreenCTM;
 *   CSS/SVG CTM mismatches in Safari caused a multi-cell Y offset)
 *
 * Optional `wave`: thick irregular beach bands roll nearly horizontally
 * (sometimes two, never more, never too close) with quantized intensity.
 * Cursor hover still wins on the pointed cell.
 */
export interface InteractiveGridPatternProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Cell size in CSS pixels. Always square. @default 40 */
  cellSize?: number;
  /**
   * @deprecated Use `cellSize`. Kept so existing call sites keep working;
   * if both width and height are passed, the smaller value is used.
   */
  width?: number;
  /** @deprecated Use `cellSize`. */
  height?: number;
  /** @deprecated Ignored — coverage is computed from the clip box. */
  squares?: [number, number];
  className?: string;
  squaresClassName?: string;
  /** SkewY in degrees. @default 0 */
  skewY?: number;
  /**
   * Ambient beach-like wave: thick irregular band with varying intensity.
   * Hover still overrides the wave on the pointed cell. @default false
   */
  wave?: boolean;
  /** Full wave sweep length in seconds. @default 5 */
  waveDuration?: number;
}

const HOVER_FILL = "rgba(237, 28, 36, 0.22)";
const HOVER_STROKE = "rgba(237, 28, 36, 0.45)";

/** How many cell-steps deep the wash runs behind the crest. */
const WAVE_BAND = 8;
/** Chunky intensity ladder (pixel feel, not a smooth fade). */
const INTENSITY_STEPS = 5;
/**
 * Repeating spawn plan for “should this lead wave get a follower?”
 * Feels varied without true randomness — never 3, never always-double.
 */
const FOLLOW_PATTERN: ReadonlyArray<0 | 1> = [
  0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0,
];
/**
 * Small crest slopes per episode — mostly horizontal (low col mix),
 * with a little angle variation so it doesn’t look locked.
 */
const SLOPE_PATTERN = [
  0.12, 0.2, 0.08, 0.16, 0.24, 0.1, 0.18, 0.14, 0.22, 0.09, 0.17, 0.11,
];

/** One traveling crest: progress + slight crest slope. */
interface WaveCrest {
  front: number;
  /** Col mix into travel axis — low values ≈ nearly horizontal crest. */
  slope: number;
}

function slopeForEpisode(episode: number): number {
  return SLOPE_PATTERN[episode % SLOPE_PATTERN.length]!;
}

/** Stable 0..1 noise per cell — irregular shoreline, no frame flicker. */
function cellNoise(col: number, row: number): number {
  const n = Math.sin(col * 127.1 + row * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * Beach-wave intensity for one crest.
 * Travel is mostly top→bottom so the lit band stays nearly horizontal;
 * `slope` adds only a small angle.
 */
function crestIntensity(
  col: number,
  row: number,
  front: number,
  slope: number,
): number {
  if (front < 0) return 0;

  // Near-horizontal crest: progress mainly with row, gentle col lean.
  const along = row + slope * col;
  const across = col - slope * row;
  const n = cellNoise(col, row);

  // Shoreline warp — lobes + per-cell grit (still discrete once quantized).
  const warp =
    Math.sin(across * 0.22 + front * 0.12 + slope * 3) * 2.2 +
    Math.sin(across * 0.65 - front * 0.07 - slope * 2) * 1.4 +
    Math.sin(across * 1.2 + n * 5.5) * 0.8 +
    (n - 0.5) * 1.6;

  const depth = front + warp - along;
  if (depth < 0 || depth > WAVE_BAND) return 0;

  const t = depth / WAVE_BAND; // 0 = crest, 1 = end of wash
  // Bright breaking crest, longer fading wash behind.
  const profile = Math.pow(1 - t, 1.25);
  // Foam speckles denser near the crest, sparse in the wash.
  const foam = n > 0.62 ? (n - 0.62) * 1.15 * (1 - t * 0.55) : 0;
  const raw = Math.min(1, profile * 0.92 + foam);

  return Math.round(raw * INTENSITY_STEPS) / INTENSITY_STEPS;
}

/** Max intensity across up to two concurrent crests. */
function waveIntensity(
  col: number,
  row: number,
  crests: readonly WaveCrest[],
): number {
  let max = 0;
  for (const crest of crests) {
    const i = crestIntensity(col, row, crest.front, crest.slope);
    if (i > max) max = i;
  }
  return max;
}

function redFromIntensity(intensity: number): { fill: string; stroke?: string } {
  if (intensity <= 0) return { fill: "transparent" };
  const fillA = 0.05 + intensity * 0.3;
  const strokeA = 0.1 + intensity * 0.42;
  return {
    fill: `rgba(237, 28, 36, ${fillA.toFixed(3)})`,
    stroke: `rgba(237, 28, 36, ${strokeA.toFixed(3)})`,
  };
}

export function InteractiveGridPattern({
  cellSize,
  width = 40,
  height = 40,
  squares: _squares,
  className,
  squaresClassName,
  skewY = 0,
  wave = false,
  waveDuration = 5,
  ...props
}: InteractiveGridPatternProps) {
  void _squares;

  const size = Math.max(8, cellSize ?? Math.min(width, height));
  const clipRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [hovered, setHovered] = useState<number | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  /** Active crests (0–2): progress + slight crest slope. */
  const [waveFronts, setWaveFronts] = useState<WaveCrest[]>([]);

  useEffect(() => {
    const el = clipRef.current;
    if (!el) return;

    const measure = () => {
      const r = el.getBoundingClientRect();
      setBox({ w: Math.max(0, r.width), h: Math.max(0, r.height) });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const skewTan = Math.tan((skewY * Math.PI) / 180);
  const skewTanAbs = Math.abs(skewTan);
  const padX = skewY === 0 ? 1 : Math.ceil((box.h * skewTanAbs) / size) + 2;
  const padY = skewY === 0 ? 1 : Math.ceil((box.w * skewTanAbs) / size) + 2;
  const cols = box.w > 0 ? Math.ceil(box.w / size) + padX * 2 : 0;
  const rows = box.h > 0 ? Math.ceil(box.h / size) + padY * 2 : 0;
  const gridW = cols * size;
  const gridH = rows * size;
  const offsetLeft = (box.w - gridW) / 2;
  const offsetTop = (box.h - gridH) / 2;
  const waveActive = wave && !reduceMotion && cols > 0 && rows > 0;
  // Near-horizontal travel span (row-major + max slope × cols).
  const travelSpan = rows + Math.ceil(0.28 * cols);

  // Step crests one cell at a time; occasionally run a second spaced wave.
  useEffect(() => {
    if (!waveActive || travelSpan <= 0) {
      setWaveFronts([]);
      return;
    }

    const durationMs = Math.max(2, waveDuration) * 1000;
    // Extra steps so the thick wash can clear the grid.
    const sweepEnd = travelSpan + WAVE_BAND + 4;
    // Keep crests apart so dual waves read as two, not one blob.
    const minSeparation = Math.max(
      WAVE_BAND + 5,
      Math.min(14, Math.floor(travelSpan * 0.28)),
    );
    // Start the next lead before the previous fully clears — shortens the
    // empty beat in the masked center without speeding up the crest itself.
    const handoffAt = Math.max(
      minSeparation + 3,
      Math.floor(travelSpan * 0.58),
    );
    const stepMs = Math.max(85, durationMs / sweepEnd);

    let episode = 0;
    let followArmed = FOLLOW_PATTERN[0] === 1;
    const spawn = (ep: number): WaveCrest => ({
      front: 0,
      slope: slopeForEpisode(ep),
    });
    episode = 1;
    setWaveFronts([spawn(0)]);

    const id = window.setInterval(() => {
      setWaveFronts((prev) => {
        const advanced = prev
          .map((crest) => ({ ...crest, front: crest.front + 1 }))
          .filter((crest) => crest.front < sweepEnd);

        // Safety net if everything somehow cleared.
        if (advanced.length === 0) {
          followArmed =
            FOLLOW_PATTERN[episode % FOLLOW_PATTERN.length] === 1;
          const next = spawn(episode);
          episode += 1;
          return [next];
        }

        if (advanced.length === 1) {
          const lead = advanced[0]!;

          // Intentional double — earlier follower (own slight slope).
          if (followArmed && lead.front >= minSeparation) {
            followArmed = false;
            const follower = spawn(episode);
            episode += 1;
            return [lead, follower];
          }

          // Solo handoff — next crest enters before the wash empties the view.
          if (!followArmed && lead.front >= handoffAt) {
            followArmed =
              FOLLOW_PATTERN[episode % FOLLOW_PATTERN.length] === 1;
            const next = spawn(episode);
            episode += 1;
            return [lead, next];
          }
        }

        return advanced;
      });
    }, stepMs);

    return () => window.clearInterval(id);
  }, [waveActive, travelSpan, waveDuration]);

  const skewTransform =
    skewY !== 0
      ? `translate(${gridW / 2} ${gridH / 2}) skewY(${skewY}) translate(${-gridW / 2} ${-gridH / 2})`
      : undefined;

  useEffect(() => {
    const clip = clipRef.current;
    if (!clip || cols === 0 || rows === 0) return;

    const onMove = (event: PointerEvent) => {
      const bounds = clip.getBoundingClientRect();
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      ) {
        setHovered(null);
        return;
      }

      // Layer center in viewport pixels (matches SVG skew-about-center).
      const cx = bounds.left + offsetLeft + gridW / 2;
      const cy = bounds.top + offsetTop + gridH / 2;

      // Screen → centered coords
      let x = event.clientX - cx;
      let y = event.clientY - cy;

      // Inverse skewY about center: forward (x, y) → (x, y + x·tanθ)
      if (skewY !== 0) {
        y -= x * skewTan;
      }

      // Centered → grid local
      const localX = x + gridW / 2;
      const localY = y + gridH / 2;

      if (localX < 0 || localY < 0 || localX >= gridW || localY >= gridH) {
        setHovered(null);
        return;
      }

      const col = Math.min(cols - 1, Math.max(0, Math.floor(localX / size)));
      const row = Math.min(rows - 1, Math.max(0, Math.floor(localY / size)));
      setHovered(row * cols + col);
    };

    const clear = () => setHovered(null);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", clear);
    document.documentElement.addEventListener("mouseleave", clear);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", clear);
      document.documentElement.removeEventListener("mouseleave", clear);
    };
  }, [cols, rows, size, gridW, gridH, offsetLeft, offsetTop, skewY, skewTan]);

  return (
    <div
      ref={clipRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      {...props}
    >
      {cols > 0 && rows > 0 ? (
        <svg
          width={gridW}
          height={gridH}
          style={{
            position: "absolute",
            left: offsetLeft,
            top: offsetTop,
            width: gridW,
            height: gridH,
            overflow: "visible",
          }}
        >
          <g transform={skewTransform}>
            {Array.from({ length: cols * rows }, (_, index) => {
              const col = index % cols;
              const row = Math.floor(index / cols);
              const x = col * size;
              const y = row * size;
              const active = hovered === index;
              const intensity = waveActive ? waveIntensity(col, row, waveFronts) : 0;
              const wavePaint = redFromIntensity(intensity);

              return (
                <rect
                  key={index}
                  x={x}
                  y={y}
                  width={size}
                  height={size}
                  className={cn(
                    "stroke-gray-400/40",
                    !waveActive && "transition-[fill,stroke] duration-100 ease-out",
                    squaresClassName,
                  )}
                  fill={active ? HOVER_FILL : wavePaint.fill}
                  stroke={active ? HOVER_STROKE : wavePaint.stroke}
                />
              );
            })}
          </g>
        </svg>
      ) : null}
    </div>
  );
}
