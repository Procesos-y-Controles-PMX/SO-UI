"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { cn } from "../lib/cn";

export interface GridThemeToggleProps {
  /** Icon-only square for the collapsed sidebar rail. */
  compact?: boolean;
  className?: string;
}

/**
 * Canonical sidebar theme control — clay switch that slides between
 * claro and oscuro. Lives above the user card in every SO app.
 */
export function GridThemeToggle({ compact = false, className }: GridThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === "dark" : true;
  const label = isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro";

  function toggle() {
    setTheme(isDark ? "light" : "dark");
  }

  if (compact) {
    return (
      <button
        type="button"
        aria-label={label}
        title={isDark ? "Modo claro" : "Modo oscuro"}
        onClick={toggle}
        className={cn(
          "neu-button relative flex h-9 w-9 items-center justify-center rounded-sm text-fg",
          className,
        )}
      >
        {isDark ? <MoonGlyph /> : <SunGlyph />}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      onClick={toggle}
      className={cn(
        "neu-button group flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-subtle">
          Apariencia
        </p>
        <p className="mt-0.5 text-xs font-semibold text-fg-strong">
          {mounted ? (isDark ? "Modo oscuro" : "Modo claro") : "Tema"}
        </p>
      </div>

      <span
        className="neu-pressed relative h-7 w-12 shrink-0 rounded-full"
        aria-hidden
      >
        <span
          className={cn(
            "absolute top-0.5 flex h-6 w-6 items-center justify-center rounded-full",
            "bg-[var(--brand)] text-white",
            "transition-transform duration-[180ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
            isDark ? "translate-x-[22px]" : "translate-x-0.5",
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
      strokeWidth="2.4"
      strokeLinecap="round"
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
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-3.5 w-3.5", className)}
      aria-hidden
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
    </svg>
  );
}
