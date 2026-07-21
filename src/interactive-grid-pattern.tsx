"use client";

import React, { useEffect, useRef, useState } from "react";

import { cn } from "./lib/cn";

/**
 * Interactive grid mesh.
 *
 * Hit-testing uses an untransformed track layer so cursor ↔ cell stays accurate.
 * Optional skewY is applied only to the inner SVG (origin top-left); pointer
 * coords are inverse-skewed into that space.
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

      let x = event.clientX - box.left;
      let y = event.clientY - box.top;

      // Undo skewY with transform-origin top-left:
      // forward (x, y) → (x, y + x·tanθ)
      if (skewY !== 0) {
        y -= x * skewTan;
      }

      if (x < 0 || y < 0 || x >= box.width || y >= box.height) {
        setHoveredSquare(null);
        return;
      }

      const col = Math.min(
        horizontal - 1,
        Math.max(0, Math.floor((x / box.width) * horizontal)),
      );
      const row = Math.min(
        vertical - 1,
        Math.max(0, Math.floor((y / box.height) * vertical)),
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
        className={cn(
          "absolute inset-0 h-full w-full origin-top-left will-change-transform",
        )}
        style={
          skewY !== 0 ? { transform: `skewY(${skewY}deg)` } : undefined
        }
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
