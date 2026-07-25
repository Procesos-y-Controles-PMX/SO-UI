"use client";

import React from "react";

import { cn } from "./lib/cn";
import { motion } from "./motion";

/**
 * PendingButton — replaces the 31 hand-written
 * `{saving ? <Loader2 className="animate-spin" /> : <Save />}` sites.
 *
 * Three problems it fixes:
 * 1. Swapping the icon changes the button width by ~20px, which re-flows the
 *    whole action row. Here the width is reserved for the longest label.
 * 2. The spinner turns forever with no sense of progress. Here a 3px bar
 *    advances inside the button itself.
 * 3. Nothing acknowledges success — the modal just closes. Here a 300ms
 *    "done" state confirms it, which replaces about half of the success toasts.
 *
 * Usage:
 *
 *   <PendingButton
 *     state={saving ? "pending" : saved ? "done" : "idle"}
 *     idleLabel="Guardar"
 *     pendingLabel="Guardando…"
 *     doneLabel="Guardado"
 *     onClick={handleSave}
 *   />
 */

export type PendingState = "idle" | "pending" | "done";

export interface PendingButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  state: PendingState;
  idleLabel: string;
  pendingLabel?: string;
  doneLabel?: string;
  idleIcon?: React.ReactNode;
  doneIcon?: React.ReactNode;
  /** Expected request time in ms — paces the indeterminate bar. */
  expectedMs?: number;
  variant?: "primary" | "secondary";
}

const LAYER =
  "absolute inset-0 flex items-center justify-center gap-2 whitespace-nowrap transition-[opacity,transform] motion-reduce:transition-none";

export function PendingButton({
  state,
  idleLabel,
  pendingLabel = "Guardando…",
  doneLabel = "Guardado",
  idleIcon,
  doneIcon,
  expectedMs = 1200,
  variant = "primary",
  className,
  disabled,
  ...props
}: PendingButtonProps) {
  // Reserve the width of the longest label so nothing moves between states.
  const widest = [idleLabel, pendingLabel, doneLabel].reduce((a, b) =>
    b.length > a.length ? b : a,
  );

  return (
    <button
      type="button"
      aria-live="polite"
      aria-busy={state === "pending" || undefined}
      disabled={disabled || state !== "idle"}
      className={cn(
        "relative inline-flex min-h-10 items-center justify-center overflow-hidden rounded-sm px-4 py-2.5 text-sm font-semibold",
        "transition-colors duration-[90ms] disabled:cursor-not-allowed",
        variant === "primary"
          ? "bg-brand text-white hover:bg-brand-hover active:bg-brand-active"
          : "border border-line bg-card text-fg-strong hover:bg-muted",
        className,
      )}
      {...props}
    >
      {/* Width reservation: invisible longest label, in normal flow. */}
      <span aria-hidden className="pointer-events-none inline-flex items-center gap-2 opacity-0">
        {idleIcon}
        {widest}
      </span>

      <span
        aria-hidden={state !== "idle"}
        className={cn(LAYER, "duration-[90ms]", state === "idle" ? "opacity-100" : "opacity-0")}
      >
        {idleIcon}
        {idleLabel}
      </span>

      <span
        aria-hidden={state !== "pending"}
        className={cn(
          LAYER,
          "duration-[180ms]",
          state === "pending" ? "opacity-100" : "opacity-0",
        )}
      >
        {pendingLabel}
      </span>

      <span
        aria-hidden={state !== "done"}
        className={cn(
          LAYER,
          "duration-[180ms] ease-[cubic-bezier(0.34,1.4,0.5,1)]",
          state === "done" ? "scale-100 opacity-100" : "scale-90 opacity-0",
        )}
      >
        {doneIcon}
        {doneLabel}
      </span>

      {/* Advance bar — indeterminate, but paced, so 4s doesn't read as dead. */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 bottom-0 h-[3px] origin-left bg-white/85 transition-transform ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none",
          state === "idle" && "scale-x-0 duration-0",
          state === "pending" && "scale-x-100",
          state === "done" && "scale-x-100 duration-0",
        )}
        style={{ transitionDuration: state === "pending" ? `${expectedMs}ms` : undefined }}
      />
    </button>
  );
}

export { motion as motionTokens };
