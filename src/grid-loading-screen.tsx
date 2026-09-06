"use client";

import React from "react";

import { cn } from "./lib/cn";
import { NoiseField } from "./noise-field";

export interface GridLoadingScreenProps {
  /** Caption under the loader. */
  message?: string;
  /** Light app canvas vs dark login / handoff canvas. @default "light" */
  variant?: "light" | "dark";
  /**
   * @deprecated Kept for call-site compatibility. The NoiseField loader no
   * longer uses an orbiting cell trail.
   */
  spinnerMs?: number;
  /** @deprecated Kept for call-site compatibility. */
  spinnerRadius?: number;
  /** @deprecated Kept for call-site compatibility. */
  trailMs?: number;
  className?: string;
  /** Extra classes for the caption. */
  messageClassName?: string;
}

/**
 * Full-bleed handoff / session loading state.
 *
 * Matches the Portal login atmosphere: dense NoiseField capsules on a clay
 * canvas, with a small brand pulse and a centered caption. Replaces the older
 * InteractiveGridPattern + orbiting-cell spinner.
 */
export function GridLoadingScreen({
  message = "Cargando...",
  variant = "light",
  spinnerMs: _spinnerMs,
  spinnerRadius: _spinnerRadius,
  trailMs: _trailMs,
  className,
  messageClassName,
}: GridLoadingScreenProps) {
  void _spinnerMs;
  void _spinnerRadius;
  void _trailMs;

  const dark = variant === "dark";

  return (
    <main
      className={cn(
        "relative flex min-h-dvh items-center justify-center overflow-hidden px-6",
        dark ? "bg-[#0c0e12] text-white" : "bg-[#e8ecf3] text-slate-800",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <NoiseField
          className="absolute inset-0"
          color={dark ? [255, 255, 255] : [52, 80, 122]}
          maxOpacity={dark ? 0.5 : 0.2}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-5">
        <div
          className="flex items-center gap-1.5"
          aria-hidden
        >
          <span className="nf-loader-bar h-1 w-7 rounded-full bg-[#ED1C24]" />
          <span className="nf-loader-bar nf-loader-bar-delay-1 h-1 w-3 rounded-full bg-[#ED1C24]/70" />
          <span className="nf-loader-bar nf-loader-bar-delay-2 h-1 w-2 rounded-full bg-[#ED1C24]/45" />
        </div>
        <p
          className={cn(
            "max-w-sm text-center text-sm tracking-wide",
            dark ? "text-white/55" : "text-slate-500",
            messageClassName,
          )}
        >
          {message}
        </p>
      </div>

      <style>{`
        @keyframes nf-loader-breathe {
          0%, 100% { opacity: 0.35; transform: scaleX(0.85); }
          50% { opacity: 1; transform: scaleX(1); }
        }
        .nf-loader-bar {
          transform-origin: left center;
          animation: nf-loader-breathe 1.6s ease-in-out infinite;
        }
        .nf-loader-bar-delay-1 { animation-delay: 0.18s; }
        .nf-loader-bar-delay-2 { animation-delay: 0.36s; }
        @media (prefers-reduced-motion: reduce) {
          .nf-loader-bar { animation: none; opacity: 0.85; transform: none; }
        }
      `}</style>
    </main>
  );
}
