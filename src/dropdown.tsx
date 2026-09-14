"use client";

import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "./lib/cn";
import { FILTER_DROPDOWN_VARIANTS } from "./motion";
import { SELECT_PANEL } from "./styles";

export type DropdownProps = {
  open: boolean;
  children: React.ReactNode;
  className?: string;
  maxHeightClass?: string;
};

/**
 * AnimatedFilterDropdown — the suite menu shell.
 *
 * Height expand, no backdrop blur (see Modal). Used by Select / MultiSelect
 * and by app menus that still compose their own rows.
 */
export function Dropdown({
  open,
  children,
  className,
  maxHeightClass = "max-h-60",
}: DropdownProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          animate={reduceMotion ? undefined : "show"}
          className={cn(
            SELECT_PANEL,
            "absolute top-full right-0 left-0 z-50 mt-1 w-full overflow-y-auto",
            maxHeightClass,
            className,
          )}
          exit={reduceMotion ? undefined : "exit"}
          initial={reduceMotion ? undefined : "hidden"}
          variants={FILTER_DROPDOWN_VARIANTS.container}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function DropdownItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      layout={!reduceMotion}
      variants={FILTER_DROPDOWN_VARIANTS.item}
    >
      {children}
    </motion.div>
  );
}

/** Names Equipo / Cotizador / Permisos already import. */
export const AnimatedFilterDropdown = Dropdown;
export const AnimatedFilterDropdownItem = DropdownItem;
