import type { ComponentType } from "react";

import {
  FIELD_SELECT_TRIGGER,
  FILTER_CONTROL_CLASS,
  FILTER_CONTROL_COMPACT_CLASS,
} from "./styles";

export type ControlSize = "filter" | "compact" | "field";

/** Lucide and any other 16px stroke icon. */
export type ControlIcon = ComponentType<{
  className?: string;
  size?: number | string;
}>;

export type SelectOption = {
  value: string;
  label: string;
  description?: string;
};

export type FilterSelectOption = SelectOption;

export type SelectOptionInput = string | SelectOption;

export function normalizeOptions(options: SelectOptionInput[]): SelectOption[] {
  return options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option,
  );
}

export function filterOptions(options: SelectOption[], query: string): SelectOption[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return options;
  return options.filter(
    (option) =>
      option.label.toLowerCase().includes(normalized) ||
      option.value.toLowerCase().includes(normalized) ||
      (option.description?.toLowerCase().includes(normalized) ?? false),
  );
}

export function shouldShowSearch(
  searchable: boolean | "auto",
  count: number,
  threshold = 6,
): boolean {
  return searchable === true || (searchable === "auto" && count > threshold);
}

export function triggerSurfaceClass(size: ControlSize, inputClassName?: string): string {
  if (inputClassName) return inputClassName;
  if (size === "compact") return FILTER_CONTROL_COMPACT_CLASS;
  if (size === "field") return FIELD_SELECT_TRIGGER;
  return FILTER_CONTROL_CLASS;
}

export function triggerPaddingClass(hasIcon: boolean): string {
  return hasIcon ? "pl-9 pr-9" : "pl-3 pr-9";
}
