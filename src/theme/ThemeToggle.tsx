"use client";

import { useEffect, useState, type ComponentPropsWithoutRef } from "react";
import { useTheme } from "next-themes";

import { cn } from "../lib/cn";

interface ThemeToggleProps extends ComponentPropsWithoutRef<"button"> {
  /** Render nothing at all (still mounts the hook). Used to wire an app
   *  before its dark styles are ready — e.g. Equipo Móvil in Phase 1. */
  hidden?: boolean;
}

/**
 * Sun/moon theme toggle, styled with the shared design tokens so it reads
 * correctly in both themes. Guards against hydration mismatch by only
 * revealing the resolved icon after mount.
 */
export function ThemeToggle({ hidden, className, ...props }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (hidden) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg",
        "border border-slate-200 bg-white text-slate-600 transition-colors",
        "hover:bg-slate-50 hover:text-slate-900",
        "dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-color,#34507A)]",
        className,
      )}
      {...props}
    >
      {/* Keep layout stable pre-mount; swap the glyph once we know the theme. */}
      <span className="sr-only">{mounted ? (isDark ? "Oscuro" : "Claro") : "Tema"}</span>
      {mounted && isDark ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
