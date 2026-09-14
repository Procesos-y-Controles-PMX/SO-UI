"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { IconSearch, IconSend } from "./icons";
import { cn } from "./lib/cn";
import type { ControlIcon } from "./select-shared";
import { FILTER_CONTROL_CLASS } from "./styles";

export type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  leftIcon?: ControlIcon;
  autoFocus?: boolean;
  name?: string;
  tabIndex?: number;
};

/**
 * Search field with a search → send glyph swap. The control itself is a
 * pressed well (`.neu-field`); the icons are decorative.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  className,
  id,
  disabled = false,
  leftIcon: LeftIcon,
  autoFocus = false,
  name,
  tabIndex,
}: SearchInputProps) {
  const reduceMotion = useReducedMotion();
  const hasQuery = value.length > 0;

  return (
    <div className="relative w-full">
      {LeftIcon ? (
        <LeftIcon
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-faint"
          size={16}
        />
      ) : null}
      <input
        id={id}
        name={name}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        autoFocus={autoFocus}
        tabIndex={tabIndex}
        className={
          className ??
          cn(
            FILTER_CONTROL_CLASS,
            LeftIcon ? "pl-9" : "pl-3",
            "pr-10 placeholder:text-fg-faint",
          )
        }
      />
      <div className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2">
        <AnimatePresence mode="popLayout">
          {hasQuery ? (
            <motion.span
              key="send"
              animate={reduceMotion ? undefined : { y: 0, opacity: 1 }}
              className="inline-flex"
              exit={reduceMotion ? undefined : { y: 10, opacity: 0 }}
              initial={reduceMotion ? undefined : { y: -10, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <IconSend className="h-4 w-4 text-fg-faint" size={16} />
            </motion.span>
          ) : (
            <motion.span
              key="search"
              animate={reduceMotion ? undefined : { y: 0, opacity: 1 }}
              className="inline-flex"
              exit={reduceMotion ? undefined : { y: 10, opacity: 0 }}
              initial={reduceMotion ? undefined : { y: -10, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <IconSearch className="h-4 w-4 text-fg-faint" size={16} />
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export const AnimatedSearchInput = SearchInput;
export type AnimatedSearchInputProps = SearchInputProps;
