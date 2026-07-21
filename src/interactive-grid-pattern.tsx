"use client";

import React, { useEffect, useRef, useState } from "react";

import { cn } from "./lib/cn";

/**
 * Interactive grid mesh with optional tilt.
 *
 * Hit-testing uses the clipped track box. The inner SVG is slightly oversized and
 * skewY'd from the top-left so the tilt never leaves an empty wedge at the edges.
 */
interface InteractiveGridPatternProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  width?: number;
  height?: number;
  squares?: [number, number];
  className?: string;
  squaresClassName?: string;
  /** Visual tilt in degrees (CSS skewY). */
  skewY?: number;
}

/** Extra SVG coverage so skewY does not expose empty corners. */
const OVERSCAN = 0.22; // 22% beyond the track on the axis that skew opens up

export function InteractiveGridPattern({
  width = 40,
  height = 40,
  squares = [24, 24],
  className,
  squaresClassName,
  skewY = 0,
  ...props
}: InteractiveGridPatternProps) {
  const [horizontal, vertical] = squares;
  const [hoveredSquare, setHoveredSquare] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const svgW = width * horizontal;
  const svgH = height * vertical;

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const skewTan = Math.tan((skewY * Math.PI) / 180);

    const onMove = (event: PointerEvent) => {
      const box = track.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0) {
        setHoveredSquare(null);
        return;
      }

      // Visible clip test (cursor must be over the track).
      if (
        event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom
      ) {
        setHoveredSquare(null);
        return;
      }

      // Map into the oversized SVG's pre-transform layout space.
      // SVG is positioned at top: -OVERSCAN*H, height: (1+2*OVERSCAN)*H, origin 0 0.
      const overY = box.height * OVERSCAN;
      const layoutH = box.height + overY * 2;
      const layoutW = box.width;

      let x = event.clientX - box.left;
      let y = event.clientY - box.top + overY;

      // Inverse skewY with transform-origin (0,0):
      // forward (x,y) → (x, y + x·tanθ)
      if (skewY !== 0) {
        y -= x * skewTan;
      }

      if (x < 0 || y < 0 || x >= layoutW || y >= layoutH) {
        setHoveredSquare(null);
        return;
      }

      const col = Math.min(
        horizontal - 1,
        Math.max(0, Math.floor((x / layoutW) * horizontal)),
      );
      const row = Math.min(
        vertical - 1,
        Math.max(0, Math.floor((y / layoutH) * vertical)),
      );
      setHoveredSquare(row * horizontal + col);
    };

    const clear = () => setHoveredSquare(null);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", clear);
    document.documentElement.addEventListener("mouseleave", clear);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", clear);
      document.documentElement.removeEventListener("mouseleave", clear);
    };
  }, [horizontal, vertical, skewY]);

  const overPct = OVERSCAN * 100;

  return (
    <div
      ref={trackRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      {...props}
    >
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        preserveAspectRatio="none"
        className="absolute left-0 w-full origin-top-left will-change-transform"
        style={{
          top: `-${overPct}%`,
          height: `${100 + overPct * 2}%`,
          transformOrigin: "0 0",
          transform: skewY !== 0 ? `skewY(${skewY}deg)` : undefined,
        }}
      >
        {Array.from({ length: horizontal * vertical }).map((_, index) => {
          const x = (index % horizontal) * width;
          const y = Math.floor(index / horizontal) * height;
          const active = hoveredSquare === index;
          return (
            <rect
              key={index}
              x={x}
              y={y}
              width={width}
              height={height}
              className={cn(
                "stroke-gray-400/40 transition-[fill,stroke] duration-100 ease-out",
                squaresClassName,
              )}
              fill={active ? "rgba(237, 28, 36, 0.2)" : "transparent"}
              stroke={active ? "rgba(237, 28, 36, 0.4)" : undefined}
            />
          );
        })}
      </svg>
    </div>
  );
}
