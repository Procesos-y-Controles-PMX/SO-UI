"use client";

import React, { useEffect, useRef, useState } from "react";

import { cn } from "./lib/cn";

/**
 * Interactive grid mesh (Magic UI), with optional tilt and global pointer tracking.
 *
 * Coverage uses uniform scale (not a non-uniform height stretch) so cells stay square.
 * Hover works through opaque UI via window `pointermove` + SVG `getScreenCTM`.
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

/** Extra uniform scale so skewY does not expose empty corners. */
const SKEW_COVER_SCALE = 1.4;

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
  const clipRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const svgW = width * horizontal;
  const svgH = height * vertical;

  useEffect(() => {
    const clip = clipRef.current;
    const svg = svgRef.current;
    if (!clip || !svg) return;

    const onMove = (event: PointerEvent) => {
      const box = clip.getBoundingClientRect();
      if (
        box.width <= 0 ||
        box.height <= 0 ||
        event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom
      ) {
        setHoveredSquare(null);
        return;
      }

      const ctm = svg.getScreenCTM();
      if (!ctm) {
        setHoveredSquare(null);
        return;
      }

      const local = new DOMPoint(event.clientX, event.clientY).matrixTransform(
        ctm.inverse(),
      );

      if (local.x < 0 || local.y < 0 || local.x >= svgW || local.y >= svgH) {
        setHoveredSquare(null);
        return;
      }

      const col = Math.min(horizontal - 1, Math.max(0, Math.floor(local.x / width)));
      const row = Math.min(vertical - 1, Math.max(0, Math.floor(local.y / height)));
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
  }, [horizontal, vertical, width, height, svgW, svgH, skewY]);

  return (
    <div
      ref={clipRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      {...props}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${svgW} ${svgH}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full origin-center will-change-transform"
        style={
          skewY !== 0
            ? { transform: `skewY(${skewY}deg) scale(${SKEW_COVER_SCALE})` }
            : undefined
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
