"use client";

import React, { useEffect, useRef, useState } from "react";

import { cn } from "./lib/cn";

/**
 * Interactive tilted grid — rebuilt for screen-space square cells.
 *
 * Previous approaches stretched an SVG into the clip box (non-square cells) or
 * used fragile overscan math. This version:
 * 1. Measures the clip box
 * 2. Builds a grid of fixed CSS-pixel squares (always 1:1)
 * 3. Centers an oversized layer and applies skewY so edges stay covered
 * 4. Maps the pointer with SVG getScreenCTM (works under opaque UI)
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
  /** CSS skewY in degrees. @default 0 */
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
  const svgRef = useRef<SVGSVGElement>(null);
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

  // Pad enough cells that skewY cannot expose empty corners.
  const skewTan = Math.abs(Math.tan((skewY * Math.PI) / 180));
  const padX = skewY === 0 ? 1 : Math.ceil((box.h * skewTan) / size) + 2;
  const padY = skewY === 0 ? 1 : Math.ceil((box.w * skewTan) / size) + 2;
  const cols = box.w > 0 ? Math.ceil(box.w / size) + padX * 2 : 0;
  const rows = box.h > 0 ? Math.ceil(box.h / size) + padY * 2 : 0;
  const gridW = cols * size;
  const gridH = rows * size;

  useEffect(() => {
    const clip = clipRef.current;
    const svg = svgRef.current;
    if (!clip || !svg || cols === 0 || rows === 0) return;

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

      const ctm = svg.getScreenCTM();
      if (!ctm) {
        setHovered(null);
        return;
      }

      const local = new DOMPoint(event.clientX, event.clientY).matrixTransform(
        ctm.inverse(),
      );

      if (local.x < 0 || local.y < 0 || local.x >= gridW || local.y >= gridH) {
        setHovered(null);
        return;
      }

      const col = Math.min(cols - 1, Math.max(0, Math.floor(local.x / size)));
      const row = Math.min(rows - 1, Math.max(0, Math.floor(local.y / size)));
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
  }, [cols, rows, size, gridW, gridH, skewY]);

  return (
    <div
      ref={clipRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      {...props}
    >
      {cols > 0 && rows > 0 ? (
        <svg
          ref={svgRef}
          width={gridW}
          height={gridH}
          // Lock CSS size to the same px as the SVG attributes → no stretch.
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: gridW,
            height: gridH,
            transformOrigin: "center",
            transform:
              skewY !== 0
                ? `translate(-50%, -50%) skewY(${skewY}deg)`
                : "translate(-50%, -50%)",
            willChange: "transform",
          }}
        >
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
        </svg>
      ) : null}
    </div>
  );
}
