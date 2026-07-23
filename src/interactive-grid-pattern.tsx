"use client";

import React, { useEffect, useRef, useState } from "react";

import { cn } from "./lib/cn";

/**
 * Interactive tilted grid — screen-space square cells.
 *
 * Paint and hit-test share one model:
 * - Cells are fixed CSS pixels (always square)
 * - Layer is centered with pixel left/top (no % translate)
 * - Skew is `skewY` about the layer center (canvas transform)
 * - Pointer → cell uses the inverse of that same skew
 *
 * Optional `wave`: thick irregular beach bands roll along grid rows
 * (mesh-horizontal under skew; sometimes two, never more) with quantized intensity.
 * Optional `trail`: cursor path lights cells that fade out over time.
 * Optional `spinner`: programmatic orbit that stamps the same trail fade —
 * a loading “comet” made of grid cells (no CSS ring).
 * Hover still wins on the pointed cell.
 *
 * Rendering is a single <canvas>: the static lattice is cached on an
 * offscreen canvas and blitted per frame, then only the active cells
 * (wave band / trail / hover) are painted on top. All animation state
 * lives in refs — no React re-renders per tick, no per-cell DOM.
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
  /** Full wave sweep length in seconds (crest speed). @default 5 */
  waveDuration?: number;
  /**
   * Idle seconds after the mesh clears before the next wave starts.
   * Higher = lower frequency; does not change crest speed. @default 0
   */
  waveGap?: number;
  /**
   * Cursor trail: visited cells light up and fade out over time.
   * @default false
   */
  trail?: boolean;
  /** Trail fade length in milliseconds (also used by `spinner`). @default 850 */
  trailMs?: number;
  /**
   * Orbiting cell trail — loading spinner made from the mesh itself.
   * Uses the same quantized red fade as cursor trail. @default false
   */
  spinner?: boolean;
  /** One full revolution in milliseconds. @default 1400 */
  spinnerMs?: number;
  /** Orbit radius in cells. @default 4 */
  spinnerRadius?: number;
  /**
   * Orbit center as fractions of the grid (0–1).
   * Default slightly above mid so a caption can sit under the ring.
   * @default [0.5, 0.42]
   */
  spinnerOrigin?: [number, number];
}

const HOVER_FILL = "rgba(237, 28, 36, 0.22)";
const HOVER_STROKE = "rgba(237, 28, 36, 0.45)";
/** Lattice stroke when `squaresClassName` doesn't resolve (stroke-gray-400/40). */
const DEFAULT_LATTICE_STROKE = "rgba(156, 163, 175, 0.4)";

/** How many cell-steps deep the wash runs behind the crest. */
const WAVE_BAND = 8;
/** Shoreline warp can push the band this many extra rows either way. */
const WARP_MARGIN = 7;
/** Chunky intensity ladder (pixel feel, not a smooth fade). */
const INTENSITY_STEPS = 5;
/** Default cursor-trail lifetime. */
const DEFAULT_TRAIL_MS = 850;
/** Default spinner revolution. */
const DEFAULT_SPINNER_MS = 1400;
/** Default orbit radius in cells. */
const DEFAULT_SPINNER_RADIUS = 4;
/** Debounced resize re-measure (ResizeObserver storms are real — see sidebar jank). */
const RESIZE_DEBOUNCE_MS = 150;
/**
 * Repeating spawn plan for “should this lead wave get a follower?”
 * Feels varied without true randomness — never 3, never always-double.
 */
const FOLLOW_PATTERN: ReadonlyArray<0 | 1> = [
  0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0,
];

/** One traveling crest — progress along grid rows (horizontal in mesh space). */
interface WaveCrest {
  front: number;
  /** Episode seed for shoreline warp phase (not travel angle). */
  seed: number;
}

function seedForEpisode(episode: number): number {
  // Deterministic phase offsets so successive crests don’t look identical.
  const phases = [0, 1.7, 0.4, 2.3, 1.1, 2.9, 0.8, 2.0, 1.4, 0.2, 2.6, 1.9];
  return phases[episode % phases.length]!;
}

/** Stable 0..1 noise per cell — irregular shoreline, no frame flicker. */
function cellNoise(col: number, row: number): number {
  const n = Math.sin(col * 127.1 + row * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * Beach-wave intensity for one crest.
 * Travel is purely along `row` so the lit band stays parallel to the grid’s
 * horizontal lines (and therefore follows skewY with the mesh).
 */
function crestIntensity(
  col: number,
  row: number,
  front: number,
  seed: number,
): number {
  if (front < 0) return 0;

  // Crest parallel to grid horizontals; warp only frays the shoreline.
  const along = row;
  const across = col;
  const n = cellNoise(col, row);

  const warp =
    Math.sin(across * 0.22 + front * 0.12 + seed) * 2.2 +
    Math.sin(across * 0.65 - front * 0.07 - seed * 0.7) * 1.4 +
    Math.sin(across * 1.2 + n * 5.5) * 0.8 +
    (n - 0.5) * 1.6;

  const depth = front + warp - along;
  if (depth < 0 || depth > WAVE_BAND) return 0;

  const t = depth / WAVE_BAND; // 0 = crest, 1 = end of wash
  const profile = Math.pow(1 - t, 1.25);
  const foam = n > 0.62 ? (n - 0.62) * 1.15 * (1 - t * 0.55) : 0;
  const raw = Math.min(1, profile * 0.92 + foam);

  return Math.round(raw * INTENSITY_STEPS) / INTENSITY_STEPS;
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

/** Quantized trail strength from age since last visit. */
function trailIntensityAt(litAt: number | undefined, now: number, trailMs: number): number {
  if (litAt == null) return 0;
  const t = 1 - (now - litAt) / trailMs;
  if (t <= 0) return 0;
  return Math.round(t * INTENSITY_STEPS) / INTENSITY_STEPS;
}

/** Bresenham line in grid space so fast moves don’t skip cells. */
function stampLine(
  trail: Map<number, number>,
  cols: number,
  c0: number,
  r0: number,
  c1: number,
  r1: number,
  now: number,
) {
  let x = c0;
  let y = r0;
  const dx = Math.abs(c1 - c0);
  const dy = Math.abs(r1 - r0);
  const sx = c0 < c1 ? 1 : -1;
  const sy = r0 < r1 ? 1 : -1;
  let err = dx - dy;

  for (;;) {
    trail.set(y * cols + x, now);
    if (x === c1 && y === r1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

/** Geometry derived from the measured clip box. */
interface GridGeometry {
  size: number;
  cols: number;
  rows: number;
  gridW: number;
  gridH: number;
  offsetLeft: number;
  offsetTop: number;
  boxW: number;
  boxH: number;
  dpr: number;
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
  waveGap = 0,
  trail = false,
  trailMs = DEFAULT_TRAIL_MS,
  spinner = false,
  spinnerMs = DEFAULT_SPINNER_MS,
  spinnerRadius = DEFAULT_SPINNER_RADIUS,
  spinnerOrigin = [0.5, 0.42],
  ...props
}: InteractiveGridPatternProps) {
  void _squares;

  const size = Math.max(8, cellSize ?? Math.min(width, height));
  const clipRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const probeRef = useRef<SVGSVGElement>(null);

  const [reduceMotion, setReduceMotion] = useState(false);

  // ---- Animation state: refs only, no React re-renders per frame. ----
  const geomRef = useRef<GridGeometry | null>(null);
  const latticeRef = useRef<HTMLCanvasElement | null>(null);
  const latticeStrokeRef = useRef<string>(DEFAULT_LATTICE_STROKE);
  const crestsRef = useRef<WaveCrest[]>([]);
  const hoveredRef = useRef<number | null>(null);
  const trailRef = useRef<Map<number, number>>(new Map());
  const lastCellRef = useRef<{ col: number; row: number } | null>(null);
  const spinnerLastRef = useRef<{ col: number; row: number } | null>(null);
  const dirtyRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const fadeMs = Math.max(200, trailMs);
  const revMs = Math.max(400, spinnerMs);
  const orbitR = Math.max(1.5, spinnerRadius);
  const originX = Math.min(1, Math.max(0, spinnerOrigin[0] ?? 0.5));
  const originY = Math.min(1, Math.max(0, spinnerOrigin[1] ?? 0.42));
  const cursorTrailActive = trail && !reduceMotion;
  const spinnerActive = spinner && !reduceMotion;
  /** Paint trail cells whenever cursor trail or spinner (incl. reduced-motion static). */
  const trailPaintActive = cursorTrailActive || Boolean(spinner);
  /** Age-out only while something is actively stamping. */
  const trailDecayActive = cursorTrailActive || spinnerActive;
  const skewTan = Math.tan((skewY * Math.PI) / 180);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Measure, build geometry + cached lattice, and run the draw loop.
  useEffect(() => {
    const clip = clipRef.current;
    const canvas = canvasRef.current;
    if (!clip || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const readLatticeStroke = () => {
      const probe = probeRef.current;
      if (!probe) return;
      const rect = probe.querySelector("rect");
      if (!rect) return;
      const stroke = getComputedStyle(rect).stroke;
      if (stroke && stroke !== "none") latticeStrokeRef.current = stroke;
    };

    const buildGeometry = (): GridGeometry | null => {
      const r = clip.getBoundingClientRect();
      const boxW = Math.max(0, r.width);
      const boxH = Math.max(0, r.height);
      if (boxW === 0 || boxH === 0) return null;

      const skewTanAbs = Math.abs(skewTan);
      const padX = skewY === 0 ? 1 : Math.ceil((boxH * skewTanAbs) / size) + 2;
      const padY = skewY === 0 ? 1 : Math.ceil((boxW * skewTanAbs) / size) + 2;
      const cols = Math.ceil(boxW / size) + padX * 2;
      const rows = Math.ceil(boxH / size) + padY * 2;
      const gridW = cols * size;
      const gridH = rows * size;
      return {
        size,
        cols,
        rows,
        gridW,
        gridH,
        offsetLeft: (boxW - gridW) / 2,
        offsetTop: (boxH - gridH) / 2,
        boxW,
        boxH,
        dpr: Math.min(2, window.devicePixelRatio || 1),
      };
    };

    /**
     * Apply the shared paint transform: DPR scale, layer offset, then
     * skewY about the layer center — the same model hit-testing inverts.
     */
    const applyTransform = (target: CanvasRenderingContext2D, geom: GridGeometry) => {
      target.setTransform(geom.dpr, 0, 0, geom.dpr, 0, 0);
      target.translate(geom.offsetLeft, geom.offsetTop);
      if (skewY !== 0) {
        target.translate(geom.gridW / 2, geom.gridH / 2);
        target.transform(1, skewTan, 0, 1, 0, 0);
        target.translate(-geom.gridW / 2, -geom.gridH / 2);
      }
    };

    /** Render the static lattice once into an offscreen canvas. */
    const buildLattice = (geom: GridGeometry) => {
      const off = latticeRef.current ?? document.createElement("canvas");
      latticeRef.current = off;
      off.width = Math.max(1, Math.round(geom.boxW * geom.dpr));
      off.height = Math.max(1, Math.round(geom.boxH * geom.dpr));
      const offCtx = off.getContext("2d");
      if (!offCtx) return;

      offCtx.clearRect(0, 0, off.width, off.height);
      applyTransform(offCtx, geom);
      offCtx.strokeStyle = latticeStrokeRef.current;
      offCtx.lineWidth = 1;
      offCtx.beginPath();
      for (let c = 0; c <= geom.cols; c += 1) {
        offCtx.moveTo(c * geom.size, 0);
        offCtx.lineTo(c * geom.size, geom.gridH);
      }
      for (let r = 0; r <= geom.rows; r += 1) {
        offCtx.moveTo(0, r * geom.size);
        offCtx.lineTo(geom.gridW, r * geom.size);
      }
      offCtx.stroke();
      offCtx.setTransform(1, 0, 0, 1, 0, 0);
    };

    const measure = () => {
      readLatticeStroke();
      const geom = buildGeometry();
      geomRef.current = geom;
      if (!geom) return;
      canvas.width = Math.max(1, Math.round(geom.boxW * geom.dpr));
      canvas.height = Math.max(1, Math.round(geom.boxH * geom.dpr));
      canvas.style.width = `${geom.boxW}px`;
      canvas.style.height = `${geom.boxH}px`;
      buildLattice(geom);
      dirtyRef.current = true;
    };

    const paintCell = (
      geom: GridGeometry,
      col: number,
      row: number,
      fill: string,
      stroke?: string,
    ) => {
      const x = col * geom.size;
      const y = row * geom.size;
      if (fill !== "transparent") {
        ctx.fillStyle = fill;
        ctx.fillRect(x, y, geom.size, geom.size);
      }
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, geom.size, geom.size);
      }
    };

    const draw = () => {
      const geom = geomRef.current;
      if (!geom) return;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const lattice = latticeRef.current;
      if (lattice) ctx.drawImage(lattice, 0, 0);

      applyTransform(ctx, geom);

      const now = performance.now();
      const crests = crestsRef.current;
      const hovered = hoveredRef.current;

      // Gather active-cell intensities (max wins), then paint each cell once.
      const active = new Map<number, number>();

      // Wave: only rows the band (plus shoreline warp) can reach.
      for (const crest of crests) {
        const rowStart = Math.max(0, Math.floor(crest.front - WAVE_BAND - WARP_MARGIN));
        const rowEnd = Math.min(geom.rows - 1, Math.ceil(crest.front + WARP_MARGIN));
        for (let row = rowStart; row <= rowEnd; row += 1) {
          for (let col = 0; col < geom.cols; col += 1) {
            const intensity = crestIntensity(col, row, crest.front, crest.seed);
            if (intensity <= 0) continue;
            const index = row * geom.cols + col;
            const prev = active.get(index);
            if (prev == null || intensity > prev) active.set(index, intensity);
          }
        }
      }

      // Trail: cursor path and/or spinner orbit.
      if (trailPaintActive) {
        for (const [index, litAt] of trailRef.current) {
          const intensity = trailIntensityAt(litAt, now, fadeMs);
          if (intensity <= 0) continue;
          const prev = active.get(index);
          if (prev == null || intensity > prev) active.set(index, intensity);
        }
      }

      for (const [index, intensity] of active) {
        if (index === hovered) continue;
        const paint = redFromIntensity(intensity);
        paintCell(geom, index % geom.cols, Math.floor(index / geom.cols), paint.fill, paint.stroke);
      }

      if (hovered != null) {
        const col = hovered % geom.cols;
        const row = Math.floor(hovered / geom.cols);
        paintCell(geom, col, row, HOVER_FILL, HOVER_STROKE);
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };

    // rAF stops on its own while the document is hidden, so the draw loop
    // only gates on the dirty flag — visibility gating lives in the wave
    // stepper. Gating draws on visibility too can miss the first frame
    // after re-show and leave a cleared canvas blank.
    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      if (!dirtyRef.current) return;
      dirtyRef.current = false;
      draw();
    };

    measure();
    rafRef.current = requestAnimationFrame(loop);

    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(measure, RESIZE_DEBOUNCE_MS);
    });
    ro.observe(clip);

    const onVisibility = () => {
      if (!document.hidden) dirtyRef.current = true;
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      window.clearTimeout(resizeTimer);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [size, skewY, skewTan, trailPaintActive, fadeMs]);

  // Trail decay on a chunky interval (matches quantized intensity steps).
  useEffect(() => {
    if (!trailDecayActive) {
      if (!spinner) {
        trailRef.current.clear();
        lastCellRef.current = null;
        spinnerLastRef.current = null;
      }
      return;
    }

    const id = window.setInterval(() => {
      const map = trailRef.current;
      if (map.size === 0) return;
      const now = performance.now();
      for (const [index, litAt] of map) {
        if (now - litAt >= fadeMs) map.delete(index);
      }
      dirtyRef.current = true;
    }, 55);

    return () => window.clearInterval(id);
  }, [trailDecayActive, fadeMs, spinner]);

  // Programmatic orbit — stamps the same trail map the cursor uses.
  useEffect(() => {
    if (!spinnerActive) {
      spinnerLastRef.current = null;
      return;
    }

    let raf = 0;
    let cancelled = false;
    const startedAt = performance.now();

    const tick = (now: number) => {
      if (cancelled) return;
      raf = requestAnimationFrame(tick);

      const geom = geomRef.current;
      if (!geom || geom.cols < 3 || geom.rows < 3) return;

      const t = ((now - startedAt) % revMs) / revMs;
      // Start at top; travel clockwise in grid space.
      const angle = t * Math.PI * 2 - Math.PI / 2;
      const cx = originX * (geom.cols - 1);
      const cy = originY * (geom.rows - 1);
      const col = Math.min(
        geom.cols - 1,
        Math.max(0, Math.round(cx + Math.cos(angle) * orbitR)),
      );
      const row = Math.min(
        geom.rows - 1,
        Math.max(0, Math.round(cy + Math.sin(angle) * orbitR)),
      );

      const prev = spinnerLastRef.current;
      if (prev && (prev.col !== col || prev.row !== row)) {
        stampLine(trailRef.current, geom.cols, prev.col, prev.row, col, row, now);
      } else {
        trailRef.current.set(row * geom.cols + col, now);
      }
      spinnerLastRef.current = { col, row };
      dirtyRef.current = true;
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      spinnerLastRef.current = null;
    };
  }, [spinnerActive, revMs, orbitR, originX, originY]);

  // Reduced-motion spinner: static arc so the state still reads as “loading”.
  useEffect(() => {
    if (!spinner || !reduceMotion) return;

    const paintStatic = () => {
      const geom = geomRef.current;
      if (!geom || geom.cols < 3 || geom.rows < 3) {
        window.setTimeout(paintStatic, 80);
        return;
      }
      const now = performance.now();
      const cx = originX * (geom.cols - 1);
      const cy = originY * (geom.rows - 1);
      trailRef.current.clear();
      for (let i = 0; i < 5; i += 1) {
        const angle = -Math.PI / 2 + (i / 8) * Math.PI * 2;
        const col = Math.min(
          geom.cols - 1,
          Math.max(0, Math.round(cx + Math.cos(angle) * orbitR)),
        );
        const row = Math.min(
          geom.rows - 1,
          Math.max(0, Math.round(cy + Math.sin(angle) * orbitR)),
        );
        // Stagger ages so the arc still has a bright head.
        trailRef.current.set(row * geom.cols + col, now - i * (fadeMs / 6));
      }
      dirtyRef.current = true;
    };

    paintStatic();
  }, [spinner, reduceMotion, orbitR, originX, originY, fadeMs]);

  const waveActive = wave && !reduceMotion;

  // Step crests one cell at a time; occasionally run a second spaced wave.
  useEffect(() => {
    if (!waveActive) {
      crestsRef.current = [];
      dirtyRef.current = true;
      return;
    }

    let intervalId = 0;
    let cancelled = false;

    // Geometry is measured asynchronously; wait for it before spawning.
    const start = () => {
      if (cancelled) return;
      const geom = geomRef.current;
      if (!geom || geom.rows <= 0) {
        window.setTimeout(start, 100);
        return;
      }

      const travelSpan = geom.rows;
      const durationMs = Math.max(2, waveDuration) * 1000;
      // Extra steps so the thick wash + shoreline warp can clear the grid.
      const sweepEnd = travelSpan + WAVE_BAND + 4;
      // Keep crests apart so dual waves read as two, not one blob.
      const minSeparation = Math.max(
        WAVE_BAND + 5,
        Math.min(14, Math.floor(travelSpan * 0.28)),
      );
      // Early handoff only when there’s no idle gap (keeps Portal lively).
      const gapMs = Math.max(0, waveGap) * 1000;
      const earlyHandoff = gapMs <= 0;
      const handoffAt = Math.max(
        minSeparation + 3,
        Math.floor(travelSpan * 0.58),
      );
      const stepMs = Math.max(85, durationMs / sweepEnd);
      const gapSteps = Math.ceil(gapMs / stepMs);

      let episode = 0;
      let followArmed = FOLLOW_PATTERN[0] === 1;
      let idleLeft = 0;
      const spawn = (ep: number): WaveCrest => ({
        front: 0,
        seed: seedForEpisode(ep),
      });
      episode = 1;
      crestsRef.current = [spawn(0)];
      dirtyRef.current = true;

      intervalId = window.setInterval(() => {
        // Skip stepping entirely while hidden — resume where left off.
        if (document.hidden) return;

        const advanced = crestsRef.current
          .map((crest) => ({ ...crest, front: crest.front + 1 }))
          .filter((crest) => crest.front < sweepEnd);

        if (advanced.length === 0) {
          if (idleLeft > 0) {
            idleLeft -= 1;
            crestsRef.current = [];
          } else if (gapSteps > 0 && crestsRef.current.length > 0) {
            // Just cleared — start the idle beat before the next spawn.
            idleLeft = gapSteps;
            crestsRef.current = [];
          } else {
            followArmed = FOLLOW_PATTERN[episode % FOLLOW_PATTERN.length] === 1;
            crestsRef.current = [spawn(episode)];
            episode += 1;
          }
        } else if (advanced.length === 1) {
          const lead = advanced[0]!;

          if (followArmed && lead.front >= minSeparation) {
            // Intentional double — earlier follower (own shoreline seed).
            followArmed = false;
            const follower = spawn(episode);
            episode += 1;
            crestsRef.current = [lead, follower];
          } else if (earlyHandoff && !followArmed && lead.front >= handoffAt) {
            // Solo handoff — next crest enters before the wash empties the view.
            followArmed = FOLLOW_PATTERN[episode % FOLLOW_PATTERN.length] === 1;
            const next = spawn(episode);
            episode += 1;
            crestsRef.current = [lead, next];
          } else {
            crestsRef.current = advanced;
          }
        } else {
          crestsRef.current = advanced;
        }

        dirtyRef.current = true;
      }, stepMs);
    };

    start();

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [waveActive, waveDuration, waveGap, size, skewY]);

  // Pointer → cell via the inverse of the paint transform.
  useEffect(() => {
    const clip = clipRef.current;
    if (!clip) return;

    const onMove = (event: PointerEvent) => {
      const geom = geomRef.current;
      if (!geom) return;

      const bounds = clip.getBoundingClientRect();
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      ) {
        if (hoveredRef.current != null) dirtyRef.current = true;
        hoveredRef.current = null;
        lastCellRef.current = null;
        return;
      }

      // Layer center in viewport pixels (matches skew-about-center).
      const cx = bounds.left + geom.offsetLeft + geom.gridW / 2;
      const cy = bounds.top + geom.offsetTop + geom.gridH / 2;

      // Screen → centered coords
      const x = event.clientX - cx;
      let y = event.clientY - cy;

      // Inverse skewY about center: forward (x, y) → (x, y + x·tanθ)
      if (skewY !== 0) {
        y -= x * skewTan;
      }

      // Centered → grid local
      const localX = x + geom.gridW / 2;
      const localY = y + geom.gridH / 2;

      if (localX < 0 || localY < 0 || localX >= geom.gridW || localY >= geom.gridH) {
        if (hoveredRef.current != null) dirtyRef.current = true;
        hoveredRef.current = null;
        lastCellRef.current = null;
        return;
      }

      const col = Math.min(geom.cols - 1, Math.max(0, Math.floor(localX / geom.size)));
      const row = Math.min(geom.rows - 1, Math.max(0, Math.floor(localY / geom.size)));
      const index = row * geom.cols + col;
      if (hoveredRef.current !== index) dirtyRef.current = true;
      hoveredRef.current = index;

      if (cursorTrailActive) {
        const now = performance.now();
        const prev = lastCellRef.current;
        if (prev && (prev.col !== col || prev.row !== row)) {
          stampLine(trailRef.current, geom.cols, prev.col, prev.row, col, row, now);
        } else {
          trailRef.current.set(index, now);
        }
        lastCellRef.current = { col, row };
        dirtyRef.current = true;
      }
    };

    const clear = () => {
      if (hoveredRef.current != null) dirtyRef.current = true;
      hoveredRef.current = null;
      lastCellRef.current = null;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", clear);
    document.documentElement.addEventListener("mouseleave", clear);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", clear);
      document.documentElement.removeEventListener("mouseleave", clear);
    };
  }, [skewY, skewTan, cursorTrailActive]);

  return (
    <div
      ref={clipRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      {...props}
    >
      {/* Hidden probe: resolves the Tailwind stroke class to a color for canvas. */}
      <svg ref={probeRef} width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <rect className={cn("stroke-gray-400/40", squaresClassName)} />
      </svg>
      <canvas ref={canvasRef} style={{ position: "absolute", left: 0, top: 0 }} />
    </div>
  );
}
