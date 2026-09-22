"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { Dropdown, DropdownItem } from "./dropdown";
import { IconChevronDown, IconX } from "./icons";
import { cn } from "./lib/cn";
import { SearchInput } from "./search-input";
import { SelectOptionRow } from "./select-option";
import {
  filterOptions,
  normalizeOptions,
  shouldShowSearch,
  triggerPaddingClass,
  triggerSurfaceClass,
  type ControlIcon,
  type ControlSize,
  type SelectOption,
  type SelectOptionInput,
} from "./select-shared";
import { useFloatingPanel } from "./use-floating-panel";

export type MultiSelectProps = {
  values: string[];
  onChange: (values: string[]) => void;
  options: SelectOptionInput[];
  disabled?: boolean;
  placeholder?: string;
  /** Label when nothing is selected. */
  emptyLabel?: string;
  allLabel?: string;
  selectAll?: boolean;
  clearable?: boolean;
  searchable?: boolean | "auto";
  /** `trigger` = type-to-filter in the field (sucursal). `menu` = search inside the list. */
  searchPlacement?: "menu" | "trigger";
  inputClassName?: string;
  className?: string;
  icon?: ControlIcon;
  size?: ControlSize;
  portal?: boolean;
  id?: string;
  emptyMessage?: string;
  searchPlaceholder?: string;
};

const MENU_SEARCH_CLASS =
  "neu-field h-8 w-full rounded-sm px-2 pr-9 text-sm text-fg outline-none placeholder:text-fg-faint";

function toggleValue(values: string[], optionValue: string): string[] {
  return values.includes(optionValue)
    ? values.filter((value) => value !== optionValue)
    : [...values, optionValue];
}

export const MultiSelect = memo(function MultiSelect({
  values,
  onChange,
  options,
  disabled = false,
  placeholder = "Buscar...",
  emptyLabel = "Todas",
  allLabel,
  selectAll = false,
  clearable,
  searchable = "auto",
  searchPlacement = "menu",
  inputClassName,
  className,
  icon: Icon,
  size = "filter",
  portal = true,
  id,
  emptyMessage = "Sin coincidencias",
  searchPlaceholder = "Buscar...",
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);
  const { triggerRef, panelRef, mounted, style } = useFloatingPanel(open, close);

  const normalized = useMemo(() => normalizeOptions(options), [options]);
  const optionValues = useMemo(() => normalized.map((option) => option.value), [normalized]);
  const selectedSet = useMemo(() => new Set(values), [values]);
  const allSelected =
    optionValues.length > 0 && optionValues.every((value) => selectedSet.has(value));
  const showSearch =
    searchPlacement === "trigger" || shouldShowSearch(searchable, normalized.length);
  const canClear = (clearable ?? searchPlacement === "trigger") && values.length > 0 && !disabled;

  const triggerLabel = useMemo(() => {
    if (normalized.length === 0) return emptyLabel;
    if (allSelected) return allLabel ?? emptyLabel;
    if (values.length === 0) return emptyLabel;
    if (values.length === 1) {
      return normalized.find((option) => option.value === values[0])?.label ?? values[0];
    }
    return `${values.length} seleccionadas`;
  }, [allLabel, allSelected, emptyLabel, normalized, values]);

  const filtered = useMemo(() => filterOptions(normalized, query), [normalized, query]);

  const handleSelectAll = () => {
    onChange(allSelected ? [] : [...optionValues]);
  };

  const menu = (
    <Dropdown
      open={open && !disabled && (!portal || mounted)}
      className={
        portal
          ? "relative mt-0 flex max-h-none min-h-0 w-full flex-col overflow-hidden"
          : "overflow-hidden"
      }
      maxHeightClass="max-h-none"
    >
      {showSearch && searchPlacement === "menu" ? (
        <div className="border-b border-line-subtle p-2">
          <SearchInput
            autoFocus
            className={MENU_SEARCH_CLASS}
            onChange={setQuery}
            placeholder={searchPlaceholder}
            value={query}
          />
        </div>
      ) : null}
      <div
        tabIndex={-1}
        className={portal ? "min-h-0 flex-1 overflow-y-auto" : "max-h-52 overflow-y-auto"}
      >
        {selectAll ? (
          <DropdownItem>
            <SelectOptionRow marker="check" onSelect={handleSelectAll} selected={allSelected}>
              <span className="truncate">{allLabel ?? emptyLabel}</span>
            </SelectOptionRow>
          </DropdownItem>
        ) : null}
        {filtered.length === 0 ? (
          <p className="px-3 py-2 text-sm text-fg-muted">{emptyMessage}</p>
        ) : (
          filtered.map((option) => {
            const selected = selectedSet.has(option.value);
            return (
              <DropdownItem key={option.value}>
                <SelectOptionRow
                  marker="check"
                  onSelect={() => onChange(toggleValue(values, option.value))}
                  selected={selected}
                >
                  <span className="block truncate">{option.label}</span>
                  {option.description ? (
                    <span className="mt-0.5 block truncate text-[10px] text-fg-faint">
                      {option.description}
                    </span>
                  ) : null}
                </SelectOptionRow>
              </DropdownItem>
            );
          })
        )}
      </div>
    </Dropdown>
  );

  const panel =
    portal && open && !disabled && mounted
      ? createPortal(
          <div
            ref={panelRef}
            className="pointer-events-auto flex flex-col overflow-hidden"
            style={style}
          >
            {menu}
          </div>,
          document.body,
        )
      : portal
        ? null
        : menu;

  const surface = cn(
    triggerSurfaceClass(size, inputClassName),
    triggerPaddingClass(Boolean(Icon)),
    "placeholder:text-fg-faint",
    disabled ? "" : "cursor-pointer",
  );

  return (
    <div ref={triggerRef} className={cn("relative w-full min-w-[200px]", className)}>
      <div className="relative">
        {Icon ? (
          <Icon
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-faint"
            size={16}
          />
        ) : null}
        {searchPlacement === "trigger" ? (
          <input
            id={id}
            type="text"
            value={open ? query : triggerLabel}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              if (!disabled) {
                setOpen(true);
                setQuery("");
              }
            }}
            disabled={disabled}
            placeholder={placeholder}
            autoComplete="off"
            className={surface}
          />
        ) : (
          <button
            type="button"
            id={id}
            disabled={disabled}
            aria-expanded={open}
            aria-haspopup="listbox"
            onClick={() => {
              if (!disabled) setOpen((current) => !current);
            }}
            className={cn(surface, "flex items-center text-left")}
          >
            <span className="truncate">{triggerLabel}</span>
          </button>
        )}
        <IconChevronDown
          className={cn(
            "pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-fg-faint transition-transform",
            open && "rotate-180",
          )}
          size={16}
        />
      </div>

      {canClear ? (
        <button
          type="button"
          onClick={() => onChange([])}
          className="absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-muted-strong text-fg-muted hover:bg-slate-300"
          title="Limpiar selección"
        >
          <IconX size={12} />
        </button>
      ) : null}

      {panel}
    </div>
  );
});

/** Equipo sucursal / región control: type-to-filter, checkboxes, clear chip. */
export function MultiSearchSelect({
  options,
  ...props
}: Omit<MultiSelectProps, "options"> & { options: string[] }) {
  return (
    <MultiSelect
      clearable
      searchPlacement="trigger"
      searchable
      options={options}
      {...props}
    />
  );
}

export type FilterMultiSelectOption = SelectOption;

export type FilterMultiSelectProps = Omit<
  MultiSelectProps,
  "values" | "onChange" | "emptyLabel"
> & {
  /** `null` = every option selected. Empty array = none. */
  value: string[] | null;
  onChange: (value: string[] | null) => void;
  allLabel?: string;
  noneLabel?: string;
};

/**
 * Cotizador-style tri-state filter: `null` means "all". Prefer `MultiSelect`
 * with `string[]` when the caller does not need that convention.
 */
export const FilterMultiSelect = memo(function FilterMultiSelect({
  value,
  onChange,
  options,
  allLabel = "Todas",
  noneLabel = "Ninguna",
  ...props
}: FilterMultiSelectProps) {
  const normalized = useMemo(() => normalizeOptions(options), [options]);
  const allValues = useMemo(() => normalized.map((option) => option.value), [normalized]);
  const values = value === null ? allValues : value;

  return (
    <MultiSelect
      allLabel={allLabel}
      emptyLabel={value !== null && value.length === 0 ? noneLabel : allLabel}
      options={normalized}
      searchPlacement="menu"
      selectAll
      values={values}
      onChange={(next) => {
        if (next.length === 0) {
          onChange([]);
          return;
        }
        if (allValues.length > 0 && next.length === allValues.length) {
          onChange(null);
          return;
        }
        onChange(next);
      }}
      {...props}
    />
  );
});

/** Returns true when the row value passes a multi-select filter. */
export function matchesMultiFilter(
  rowValue: string,
  selected: string[] | null,
  allValues: string[],
): boolean {
  if (allValues.length === 0) return true;
  if (selected === null || selected.length === allValues.length) return true;
  if (selected.length === 0) return false;
  return selected.includes(rowValue);
}
