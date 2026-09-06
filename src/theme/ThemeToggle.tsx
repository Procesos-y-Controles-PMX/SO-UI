"use client";

import { cn } from "../lib/cn";
import { GridThemeToggle } from "./GridThemeToggle";

interface ThemeToggleProps {
  /**
   * Render nothing (still mounts the theme hook). Kept for call-site
   * compatibility while an app finishes dark-mode wiring.
   */
  hidden?: boolean;
  className?: string;
}

/**
 * Compact theme control — same Equipo clay switch as {@link GridThemeToggle}
 * in its icon-only form. Use this on login rails and mobile headers; use
 * GridThemeToggle (expanded) in sidebars.
 */
export function ThemeToggle({ hidden, className }: ThemeToggleProps) {
  if (hidden) return null;
  return <GridThemeToggle compact className={cn(className)} />;
}
