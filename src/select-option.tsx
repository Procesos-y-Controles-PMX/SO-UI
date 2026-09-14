"use client";

import React from "react";

import { IconCheck } from "./icons";
import { cn } from "./lib/cn";
import {
  SELECT_CHECK_IDLE,
  SELECT_CHECK_SELECTED,
  SELECT_OPTION_IDLE,
  SELECT_OPTION_ROW,
  SELECT_OPTION_SELECTED,
} from "./styles";

export type SelectOptionMarker = "radio" | "check";

export type SelectOptionRowProps = {
  selected: boolean;
  onSelect: () => void;
  marker?: SelectOptionMarker;
  children: React.ReactNode;
  className?: string;
};

export function SelectOptionRow({
  selected,
  onSelect,
  marker = "radio",
  children,
  className,
}: SelectOptionRowProps) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onSelect}
      className={cn(
        SELECT_OPTION_ROW,
        selected ? SELECT_OPTION_SELECTED : SELECT_OPTION_IDLE,
        className,
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center border",
          marker === "radio" ? "rounded-full" : "rounded-sm",
          selected ? SELECT_CHECK_SELECTED : SELECT_CHECK_IDLE,
        )}
      >
        {selected ? <IconCheck size={marker === "radio" ? 10 : 12} /> : null}
      </span>
      <span className="min-w-0 flex-1 text-left">{children}</span>
    </button>
  );
}
