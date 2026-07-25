"use client";

import React from "react";

import { cn } from "./lib/cn";

/**
 * SkeletonRow — a loading placeholder that has the GEOMETRY OF THE CONTENT.
 *
 * The problem it replaces: `animate-pulse` skeletons whose blocks are shorter
 * than the real row (40px of grey where the row is 62px), so when the data
 * arrives the table changes height and everything below it re-flows. On top of
 * that, a table skeleton animates opacity on 30–40 nodes at once.
 *
 * What this does instead:
 * - The row reserves its final height, so settling costs zero layout shift.
 * - One sweep per row instead of a pulse on every block inside it.
 * - When `loading` flips false, the real children cross-fade in over the
 *   skeleton with a 4px rise, staggered by `index * motion.stagger`.
 *
 * Usage — replace the `loading ? <tr className="animate-pulse">…` branch:
 *
 *   {rows.map((row, i) => (
 *     <SkeletonRow key={row.id} loading={loading} index={i} height={62}>
 *       <UnitRow unit={row} />
 *     </SkeletonRow>
 *   ))}
 *
 * For a table, render it inside a single <td colSpan> or use `as="tr"` with
 * `cells` — see UnitsTable in the migration notes.
 */

export interface SkeletonRowProps {
  loading: boolean;
  /** Position in the list — drives the stagger. */
  index?: number;
  /** Final row height in px. MUST match the loaded row so nothing shifts. */
  height: number;
  /** Skeleton shape. Defaults to a leading square + two text lines + a pill. */
  placeholder?: React.ReactNode;
  /** Stagger step in ms. 45 for table rows, 100 for metric cells. */
  stagger?: number;
  className?: string;
  children: React.ReactNode;
}

const SWEEP_MS = 1600;

function DefaultPlaceholder() {
  return (
    <div className="flex h-full items-center gap-4 px-6">
      <div className="h-10 w-10 shrink-0 rounded-xl bg-muted-strong" />
      <div className="flex flex-col gap-1.5">
        <div className="h-3.5 w-16 rounded-sm bg-muted-strong" />
        <div className="h-3 w-32 rounded-sm bg-muted" />
      </div>
      <div className="ml-auto h-6 w-16 rounded-sm bg-muted-strong" />
    </div>
  );
}

export function SkeletonRow({
  loading,
  index = 0,
  height,
  placeholder,
  stagger = 45,
  className,
  children,
}: SkeletonRowProps) {
  const delay = `${index * stagger}ms`;

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ height }}
      aria-busy={loading || undefined}
    >
      <div
        aria-hidden={!loading}
        className={cn(
          "absolute inset-0 transition-opacity duration-200 ease-out motion-reduce:transition-none",
          loading ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        style={{ transitionDelay: loading ? "0ms" : delay }}
      >
        {placeholder ?? <DefaultPlaceholder />}
        {loading ? (
          <div className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden">
            <div
              className="h-full w-[45%] bg-[linear-gradient(90deg,transparent_0%,var(--steel-tint)_50%,transparent_100%)]"
              style={{
                animation: `so-skeleton-sweep ${SWEEP_MS}ms linear infinite`,
                animationDelay: delay,
              }}
            />
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          "absolute inset-0 transition-[opacity,transform] duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
          loading ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100",
        )}
        style={{ transitionDelay: loading ? "0ms" : delay }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Add once to each app's globals.css (SO-UI ships no stylesheet):
 *
 *   @keyframes so-skeleton-sweep {
 *     0%   { transform: translateX(-120%) }
 *     60%, 100% { transform: translateX(220%) }
 *   }
 *   @media (prefers-reduced-motion: reduce) {
 *     [style*="so-skeleton-sweep"] { animation: none }
 *   }
 */
