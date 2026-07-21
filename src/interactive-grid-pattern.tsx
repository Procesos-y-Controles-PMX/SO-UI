"use client";

import React, { useEffect, useRef, useState } from "react";

import { cn } from "./lib/cn";

/**
 * Interactive grid mesh with optional tilt.
 *
 * Hit-testing uses the SVG screen CTM (handles skew + overscan). The inner SVG is
 * oversized so skewY never leaves an empty wedge along the top/bottom edges.
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
  const [overscanY, setOverscanY] = useState(0.25);
  const trackRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const svgW = width * horizontal;
  const svgH = height * vertical;

  // Keep enough vertical overscan that skewY cannot expose empty corners.
  // Required lift ≈ width·tan(θ); express as a fraction of track height.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const update = () => {
      const { width: w, height: h } = track.getBoundingClientRect();
      if (w <= 0 || h <= 0) return;
      const skewTan = Math.abs(Math.tan((skewY * Math.PI) / 180));
      const needed = skewY === 0 ? 0.08 : (w / h) * skewTan + 0.08;
      setOverscanY(Math.min(0.55, Math.max(0.18, needed)));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(track);
    return () => ro.disconnect();
  }, [skewY]);

  useEffect(() => {
    const track = trackRef.current;
    const svg = svgRef.current;
    if (!track || !svg) return;

    const onMove = (event: PointerEvent) => {
      const box = track.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0) {
        setHoveredSquare(null);
        return;
      }

      if (
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

      // Screen → SVG user space (viewBox units), including skew + overscan layout.
      const pt = svg.createSVGPoint();
      pt.x = event.clientX;
      pt.y = event.clientY;
      const local = pt.matrixTransform(ctm.inverse());

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
  }, [horizontal, vertical, width, height, svgW, svgH, overscanY]);

  const overPct = overscanY * 100;

  return (
    <div
      ref={trackRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      {...props}
    >
      <svg
        ref={svgRef}
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
