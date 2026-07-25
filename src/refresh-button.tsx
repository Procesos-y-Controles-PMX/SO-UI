"use client";

import React, { useEffect, useRef, useState } from "react";

import { cn } from "./lib/cn";

/**
 * RefreshButton — a refresh affordance that CLOSES its loop.
 *
 * Today the dashboards spin `RefreshCw` while loading and stop at whatever
 * angle the icon happened to be at. A cut mid-revolution reads as an error, not
 * as "done". This keeps spinning at constant velocity while loading, then
 * completes to a WHOLE number of revolutions and decelerates into it.
 *
 * Pair it with `useUpdatedFlash` so the operator can see WHAT changed — in a
 * control room that is the moment that matters.
 *
 * Usage:
 *
 *   <RefreshButton loading={loading} onClick={refetch}>Actualizar</RefreshButton>
 */

export interface RefreshButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  loading: boolean;
  children?: React.ReactNode;
  /** One revolution in ms while loading. */
  revolutionMs?: number;
  icon?: React.ReactNode;
}

export function RefreshButton({
  loading,
  children,
  revolutionMs = 900,
  icon,
  className,
  ...props
}: RefreshButtonProps) {
  const [turns, setTurns] = useState(0);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (loading) {
      startedAt.current = performance.now();
      return;
    }
    if (startedAt.current == null) return;
    const elapsed = performance.now() - startedAt.current;
    // Round UP to the next whole revolution: the icon never stops mid-turn.
    setTurns((t) => t + Math.max(1, Math.ceil(elapsed / revolutionMs)));
    startedAt.current = null;
  }, [loading, revolutionMs]);

  return (
    <button
      type="button"
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex min-h-9 items-center gap-2 rounded-sm border border-line bg-card px-3 py-1.5",
        "text-xs font-medium text-fg-muted transition-colors duration-[90ms] hover:bg-muted",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "inline-flex",
          loading
            ? "motion-safe:animate-[so-refresh-spin_var(--rev)_linear_infinite]"
            : "transition-transform duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        )}
        style={
          loading
            ? ({ "--rev": `${revolutionMs}ms` } as React.CSSProperties)
            : { transform: `rotate(${turns * 360}deg)` }
        }
      >
        {icon}
      </span>
      {children}
    </button>
  );
}

/**
 * Flags the values that changed on the last refresh so the row can flash.
 *
 *   const changed = useUpdatedFlash(rows, (r) => r.id, (r) => r.minutesOffline);
 *   <tr className={changed.has(row.id) ? "animate-[so-updated-flash_400ms_ease-out]" : undefined}>
 *
 * Only the cells whose value actually moved flash — a row that didn't change
 * stays still, which is the whole point.
 */
export function useUpdatedFlash<T>(
  rows: readonly T[],
  keyOf: (row: T) => string | number,
  valueOf: (row: T) => unknown,
): Set<string | number> {
  const previous = useRef<Map<string | number, unknown> | null>(null);
  const [changed, setChanged] = useState<Set<string | number>>(new Set());

  useEffect(() => {
    const next = new Map<string | number, unknown>();
    for (const row of rows) next.set(keyOf(row), valueOf(row));

    if (previous.current) {
      const diff = new Set<string | number>();
      for (const [key, value] of next) {
        if (previous.current.has(key) && previous.current.get(key) !== value) diff.add(key);
      }
      if (diff.size > 0) {
        setChanged(diff);
        const id = window.setTimeout(() => setChanged(new Set()), 500);
        previous.current = next;
        return () => window.clearTimeout(id);
      }
    }
    previous.current = next;
  }, [rows, keyOf, valueOf]);

  return changed;
}

/**
 * Add once to each app's globals.css:
 *
 *   @keyframes so-refresh-spin { to { transform: rotate(360deg) } }
 *   @keyframes so-updated-flash {
 *     0%   { background-color: rgba(52, 80, 122, 0) }
 *     18%  { background-color: var(--steel-tint) }
 *     100% { background-color: rgba(52, 80, 122, 0) }
 *   }
 */
