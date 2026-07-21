"use client";

import React, { useEffect, useRef, useState } from "react";

import { cn } from "./lib/cn";

/**
 * InteractiveGridPattern is a component that renders a grid pattern with interactive squares.
 *
 * Pointer tracking is global (window) so cells highlight even when UI panels sit on top
 * of the grid — the SVG itself is pointer-events-none and never blocks clicks.
 *
 * @param width - The width of each square.
 * @param height - The height of each square.
 * @param squares - The number of squares in the grid. The first element is the number of horizontal squares, and the second element is the number of vertical squares.
 * @param className - The class name of the grid.
 * @param squaresClassName - The class name of the squares.
 */
interface InteractiveGridPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  squares?: [number, number]; // [horizontal, vertical]
  className?: string;
  squaresClassName?: string;
}

/**
 * The InteractiveGridPattern component.
 *
 * @see InteractiveGridPatternProps for the props interface.
 * @returns A React component.
 */
export function InteractiveGridPattern({
  width = 40,
  height = 40,
  squares = [24, 24],
  className,
  squaresClassName,
  ...props
}: InteractiveGridPatternProps) {
  const [horizontal, vertical] = squares;
  const [hoveredSquare, setHoveredSquare] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const onMove = (event: PointerEvent) => {
      const ctm = svg.getScreenCTM();
      if (!ctm) {
        setHoveredSquare(null);
        return;
      }

      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const local = point.matrixTransform(ctm.inverse());

      const col = Math.floor(local.x / width);
      const row = Math.floor(local.y / height);

      if (col < 0 || row < 0 || col >= horizontal || row >= vertical) {
        setHoveredSquare(null);
        return;
      }

      setHoveredSquare(row * horizontal + col);
    };

    const onLeave = () => setHoveredSquare(null);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", onLeave);
    document.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", onLeave);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [width, height, horizontal, vertical]);

  return (
    <svg
      ref={svgRef}
      width={width * horizontal}
      height={height * vertical}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full border border-gray-400/30",
        className,
      )}
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
              "stroke-gray-400/40 transition-[fill] duration-150 ease-out",
              active ? "fill-brand/20" : "fill-transparent",
              squaresClassName,
              // Keep active fill after squaresClassName so app hover: utilities can't wipe it.
              active && "fill-brand/20",
            )}
          />
        );
      })}
    </svg>
  );
}
