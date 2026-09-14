"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { Dropdown, DropdownItem } from "./dropdown";
import { IconChevronDown } from "./icons";
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
  type SelectOptionInput,
} from "./select-shared";
import { useFloatingPanel } from "./use-floating-panel";

export type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOptionInput[];
  disabled?: boolean;
  placeholder?: string;
  /** Override the trigger surface (filter / compact / field tokens). */
  inputClassName?: string;
  className?: string;
  icon?: ControlIcon;
  /** `"auto"` enables search when there are more than 6 options. */
  searchable?: boolean | "auto";
  size?: ControlSize;
  /** Portal + flip. Leave on unless the menu must stay in-flow. */
  portal?: boolean;
  id?: string;
  emptyMessage?: string;
  searchPlaceholder?: string;
};

const MENU_SEARCH_CLASS =
  "neu-field h-8 w-full rounded-sm px-2 pr-9 text-sm text-fg outline-none placeholder:text-fg-faint";

export const Select = memo(function Select({
  value,
  onChange,
  options,
  disabled = false,
  placeholder = "Seleccionar...",
  inputClassName,
  className,
  icon: Icon,
  searchable = "auto",
  size = "filter",
  portal = true,
  id,
  emptyMessage = "Sin coincidencias",
  searchPlaceholder = "Buscar...",
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);
  const { triggerRef, panelRef, mounted, style } = useFloatingPanel(open, close);

  const normalized = useMemo(() => normalizeOptions(options), [options]);
  const showSearch = shouldShowSearch(searchable, normalized.length);
  const selected = useMemo(
    () => normalized.find((option) => option.value === value),
    [normalized, value],
  );
  const filtered = useMemo(() => filterOptions(normalized, query), [normalized, query]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    close();
  };

  const menu = (
    <Dropdown
      open={open && !disabled && (!portal || mounted)}
      className={portal ? "relative mt-0 max-h-none w-full overflow-hidden" : "overflow-hidden"}
      maxHeightClass="max-h-none"
    >
      {showSearch ? (
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
      <div className={portal ? "max-h-full overflow-y-auto" : "max-h-52 overflow-y-auto"}>
        {filtered.length === 0 ? (
          <p className="px-3 py-2 text-sm text-fg-muted">{emptyMessage}</p>
        ) : (
          filtered.map((option) => (
            <DropdownItem key={option.value}>
              <SelectOptionRow
                marker="radio"
                onSelect={() => handleSelect(option.value)}
                selected={option.value === value}
              >
                <span className="block truncate">{option.label}</span>
                {option.description ? (
                  <span className="mt-0.5 block truncate text-[10px] text-fg-faint">
                    {option.description}
                  </span>
                ) : null}
              </SelectOptionRow>
            </DropdownItem>
          ))
        )}
      </div>
    </Dropdown>
  );

  const panel =
    portal && open && !disabled && mounted
      ? createPortal(
          <div ref={panelRef} className="pointer-events-auto" style={style}>
            {menu}
          </div>,
          document.body,
        )
      : portal
        ? null
        : menu;

  return (
    <div ref={triggerRef} className={cn("relative w-full min-w-[140px]", className)}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => {
          if (!disabled) setOpen((current) => !current);
        }}
        className={cn(
          triggerSurfaceClass(size, inputClassName),
          "flex items-center text-left",
          triggerPaddingClass(Boolean(Icon)),
          disabled ? "" : "cursor-pointer",
        )}
      >
        {Icon ? (
          <Icon
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-faint"
            size={16}
          />
        ) : null}
        <span className={cn("truncate", selected ? "text-fg" : "text-fg-muted")}>
          {selected?.label ?? placeholder}
        </span>
        <IconChevronDown
          className={cn(
            "pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-fg-faint transition-transform",
            open && "rotate-180",
          )}
          size={16}
        />
      </button>
      {panel}
    </div>
  );
});

/** Filter-bar alias — same as `Select` with `size="filter"`. */
export const FilterSelect = Select;

/** Form-row alias — same menu, field-height trigger. */
export function FormSelect({ size = "field", ...props }: SelectProps) {
  return <Select size={size} {...props} />;
}
