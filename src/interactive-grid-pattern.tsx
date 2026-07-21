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
}

export function InteractiveGridPattern({
  cellSize,
  width = 40,
  height = 40,
  squares: _squares,
  className,
  squaresClassName,
  skewY = 0,
  ...props
}: InteractiveGridPatternProps) {
  void _squares;

  const size = Math.max(8, cellSize ?? Math.min(width, height));
  const clipRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [hovered, setHovered] = useState<number | null>(null);

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
              const x = (index % cols) * size;
              const y = Math.floor(index / cols) * size;
              const active = hovered === index;
              return (
                <rect
                  key={index}
                  x={x}
                  y={y}
                  width={size}
                  height={size}
                  className={cn(
                    "stroke-gray-400/40 transition-[fill,stroke] duration-100 ease-out",
                    squaresClassName,
                  )}
                  fill={active ? "rgba(237, 28, 36, 0.22)" : "transparent"}
                  stroke={active ? "rgba(237, 28, 36, 0.45)" : undefined}
                />
              );
            })}
          </g>
        </svg>
      ) : null}
    </div>
  );
}
