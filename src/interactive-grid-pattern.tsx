"use client";

import React, { useEffect, useRef, useState } from "react";

import { cn } from "./lib/cn";

/**
 * InteractiveGridPattern — full-bleed interactive mesh.
 *
 * Tracks the window pointer so cells light up even under UI panels.
 * Hit-testing uses the element's layout box (not SVG CTM), so CSS stretch
 * stays accurate. Optional skewY is inverted with transform-origin top-left.
 */
interface InteractiveGridPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  squares?: [number, number]; // [horizontal, vertical]
  className?: string;
  squaresClassName?: string;
  /** Degrees of CSS skew-y. Pair with `origin-top-left` in className. */
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
  const svgRef = useRef<SVGSVGElement>(null);

  const svgW = width * horizontal;
  const svgH = height * vertical;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const skewTan = Math.tan((skewY * Math.PI) / 180);

    const onMove = (event: PointerEvent) => {
      const box = svg.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0) {
        setHoveredSquare(null);
        return;
      }

      // Position in the laid-out (post-CSS-size) box, then undo skewY
      // assuming transform-origin: top left.
      let x = event.clientX - box.left;
      let y = event.clientY - box.top;
      if (skewY !== 0) {
        y = y - x * skewTan;
      }

      if (x < 0 || y < 0 || x > box.width || y > box.height) {
        setHoveredSquare(null);
        return;
      }

      const col = Math.min(horizontal - 1, Math.max(0, Math.floor((x / box.width) * horizontal)));
      const row = Math.min(vertical - 1, Math.max(0, Math.floor((y / box.height) * vertical)));
      setHoveredSquare(row * horizontal + col);
    };

    const onLeave = () => setHoveredSquare(null);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", onLeave);
    document.documentElement.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", onLeave);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, [horizontal, vertical, skewY]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${svgW} ${svgH}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full border-0",
        skewY !== 0 && "origin-top-left",
        className,
      )}
      style={skewY !== 0 ? { transform: `skewY(${skewY}deg)` } : undefined}
      {...props}
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
              "stroke-gray-400/40 transition-[fill] duration-100 ease-out",
              squaresClassName,
            )}
            // Inline fill so highlight never depends on Tailwind scanning `brand`.
            fill={active ? "rgba(237, 28, 36, 0.18)" : "transparent"}
            stroke={active ? "rgba(237, 28, 36, 0.35)" : undefined}
          />
        );
      })}
    </svg>
  );
}
