"use client";

import React from "react";

import { InteractiveGridPattern } from "./interactive-grid-pattern";
import { cn } from "./lib/cn";

export interface GridLoadingScreenProps {
  /** Caption under the orbiting trail. */
  message?: string;
  /** Light app canvas vs dark login canvas. @default "light" */
  variant?: "light" | "dark";
  /** Revolution duration in ms. @default 1400 */
  spinnerMs?: number;
  /** Orbit radius in cells. @default 4 */
  spinnerRadius?: number;
  /** Trail fade in ms. @default 700 */
  trailMs?: number;
  className?: string;
  /** Extra classes for the caption. */
  messageClassName?: string;
}

/**
 * Full-bleed grid loading state: idle lattice (no waves) + cell-trail spinner.
 */
export function GridLoadingScreen({
  message = "Cargando...",
  variant = "light",
  spinnerMs = 1400,
  spinnerRadius = 4,
  trailMs = 700,
  className,
  messageClassName,
}: GridLoadingScreenProps) {
  const dark = variant === "dark";

  return (
    <main
      className={cn(
        "relative flex min-h-dvh items-center justify-center overflow-hidden px-6",
        dark ? "bg-[#0d1117] text-white" : "bg-[#f3f6fa] text-slate-800",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <InteractiveGridPattern
        cellSize={40}
        skewY={6}
        spinner
        spinnerMs={spinnerMs}
        spinnerRadius={spinnerRadius}
        trailMs={trailMs}
        spinnerOrigin={[0.5, 0.4]}
        className="absolute inset-0 [mask-image:radial-gradient(ellipse_90%_80%_at_50%_40%,white,transparent)]"
        squaresClassName={dark ? "stroke-white/35" : "stroke-slate-300/80"}
      />
      <p
        className={cn(
          "relative z-10 mt-[min(42vh,14rem)] text-center text-sm",
          dark ? "text-white/55" : "text-slate-500",
          messageClassName,
        )}
      >
        {message}
      </p>
    </main>
  );
}
