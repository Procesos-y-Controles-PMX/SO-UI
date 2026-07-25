"use client";

import React from "react";
import { AnimatePresence, motion as m, useReducedMotion } from "motion/react";

import { cn } from "./lib/cn";
import { MODAL_ITEM_VARIANTS, MODAL_VARIANTS } from "./motion";

/**
 * Modal — the ONE modal for the suite.
 *
 * It replaces four implementations that coexist today:
 *   - PromexmaModal / SmoothSheetModal / ConfirmationModal (Equipo Móvil, motion)
 *   - SheetModal (Permisos, hand-written keyframes)
 *   - Modal (Cotizador, another motion variant)
 *   - ChoferModal & friends (Tailwind `animate-in zoom-in-95`)
 *
 * The gesture is deliberately KEPT — spring, rotateX and the backdrop blur are
 * part of the suite's character. What changed is the timing: settle ~300ms
 * instead of ~600ms, damping 34 instead of 30, a shorter entry travel and a
 * 35ms child stagger, so the panel arrives and settles in one movement.
 *
 * The blur stays here (modals and sheets). Do NOT carry it into dropdowns and
 * tooltips — those appear dozens of times per session and it is the most
 * expensive frame these apps draw.
 */

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  /** Don't mount children until open — for heavy tabs behind dynamic import. */
  deferContent?: boolean;
  children: React.ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  footer,
  maxWidth = "max-w-3xl",
  deferContent = false,
  children,
}: ModalProps) {
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
          <m.div
            aria-hidden
            onClick={onClose}
            initial={reduceMotion ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          <m.div
            role="dialog"
            aria-modal="true"
            variants={reduceMotion ? undefined : MODAL_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
            style={{ transformPerspective: 900, originY: 1 }}
            className={cn(
              "relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden",
              "rounded-sm border border-line bg-card shadow-md",
              maxWidth,
            )}
          >
            {title ? (
              <m.div
                variants={reduceMotion ? undefined : MODAL_ITEM_VARIANTS}
                className="flex shrink-0 items-center justify-between gap-3 border-b border-line-subtle px-5 py-3.5"
              >
                <h2 className="truncate text-sm font-semibold text-fg">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="rounded-sm p-1.5 text-fg-faint transition-colors duration-[90ms] hover:bg-muted hover:text-fg-strong"
                >
                  {/* lucide X */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </m.div>
            ) : null}

            <m.div
              variants={reduceMotion ? undefined : MODAL_ITEM_VARIANTS}
              className="min-h-0 flex-1 overflow-y-auto px-5 py-5"
            >
              {deferContent && !isOpen ? null : children}
            </m.div>

            {footer ? (
              <m.div
                variants={reduceMotion ? undefined : MODAL_ITEM_VARIANTS}
                className="flex shrink-0 justify-end gap-2 border-t border-line-subtle px-5 py-3.5"
              >
                {footer}
              </m.div>
            ) : null}
          </m.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
