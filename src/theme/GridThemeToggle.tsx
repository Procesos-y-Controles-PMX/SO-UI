"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { cn } from "../lib/cn";

export interface GridThemeToggleProps {
  /** Icon-only circle for the collapsed sidebar rail / mobile chrome. */
  compact?: boolean;
  className?: string;
}

/**
 * Canonical theme control for the SO suite — Equipo Móvil’s clay switch.
 *
 * Expanded: “Apariencia” label + pressed well with a raised knob that slides
 * between claro and oscuro. Compact: round neu-button with a sun/moon crossfade.
 */
export function GridThemeToggle({ compact = false, className }: GridThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === "dark" : true;
  const label = !mounted
    ? "Cambiar tema"
    : isDark
      ? "Cambiar a modo claro"
      : "Cambiar a modo oscuro";

  function toggle() {
    setTheme(isDark ? "light" : "dark");
  }

  if (compact) {
    return (
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={toggle}
        className={cn(
          "neu-button relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-fg-subtle hover:text-fg",
          className,
        )}
      >
        <span className="relative h-4 w-4">
          <SunGlyph
            className={cn(
              "absolute inset-0 h-4 w-4 transition-all duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
              isDark
                ? "scale-50 rotate-90 opacity-0"
                : "scale-100 rotate-0 opacity-100",
            )}
          />
          <MoonGlyph
            className={cn(
              "absolute inset-0 h-4 w-4 transition-all duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
              isDark
                ? "scale-100 rotate-0 opacity-100"
                : "scale-50 -rotate-90 opacity-0",
            )}
          />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={toggle}
      className={cn("flex w-full items-center gap-3 rounded-sm text-left", className)}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-faint">
          Apariencia
        </p>
        <p className="mt-0.5 text-xs font-semibold text-fg-strong">
          {mounted ? (isDark ? "Modo oscuro" : "Modo claro") : "Tema"}
        </p>
      </div>

      <span aria-hidden className="neu-pressed relative h-8 w-14 shrink-0 rounded-full">
        <SunGlyph
          className={cn(
            "absolute left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 transition-opacity duration-[280ms] motion-reduce:transition-none",
            isDark ? "text-fg-faint opacity-40" : "text-fg-faint opacity-0",
          )}
        />
        <MoonGlyph
          className={cn(
            "absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 transition-opacity duration-[280ms] motion-reduce:transition-none",
            isDark ? "text-fg-faint opacity-0" : "text-fg-faint opacity-40",
          )}
        />
        <span
          className={cn(
            "neu-raised absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full text-fg",
            "transition-transform duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
            isDark && "translate-x-6",
          )}
        >
          {isDark ? <MoonGlyph className="h-3 w-3" /> : <SunGlyph className="h-3 w-3" />}
        </span>
      </span>
    </button>
  );
}

function SunGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-3.5 w-3.5", className)}
      aria-hidden
    >
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.1 5.1l1.6 1.6M17.3 17.3l1.6 1.6M5.1 18.9l1.6-1.6M17.3 6.7l1.6-1.6" />
    </svg>
  );
}

function MoonGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-3.5 w-3.5", className)}
      aria-hidden
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
    </svg>
  );
}
