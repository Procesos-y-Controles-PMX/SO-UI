"use client";

import { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
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

const TYPEAHEAD_RESET_MS = 500;

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
  const listId = useId();
  const listboxId = `${listId}-listbox`;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const typeaheadRef = useRef("");
  const typeaheadTimerRef = useRef<number>(0);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    typeaheadRef.current = "";
  }, []);
  const { triggerRef, panelRef, mounted, style } = useFloatingPanel(open, close);

  const normalized = useMemo(() => normalizeOptions(options), [options]);
  const showSearch = shouldShowSearch(searchable, normalized.length);
  const selected = useMemo(
    () => normalized.find((option) => option.value === value),
    [normalized, value],
  );
  const filtered = useMemo(() => filterOptions(normalized, query), [normalized, query]);
  const highlighted = filtered[highlightedIndex];
  const activeOptionId =
    open && highlighted ? `${listId}-option-${highlightedIndex}` : undefined;

  useEffect(() => {
    if (!open) return;
    const selectedIndex = filtered.findIndex((option) => option.value === value);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [open, filtered, value]);

  useEffect(() => {
    if (!open || !activeOptionId) return;
    document.getElementById(activeOptionId)?.scrollIntoView({ block: "nearest" });
  }, [open, activeOptionId]);

  useEffect(() => {
    return () => window.clearTimeout(typeaheadTimerRef.current);
  }, []);

  useEffect(() => {
    if (!open || disabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        const active = document.activeElement;
        const inPanel = !!(panelRef.current && active && panelRef.current.contains(active));
        const inInflowMenu = !!(
          triggerRef.current &&
          buttonRef.current &&
          active &&
          active !== buttonRef.current &&
          triggerRef.current.contains(active)
        );
        close();
        if (inPanel || inInflowMenu) {
          buttonRef.current?.focus();
        }
        return;
      }

      if (event.key === "Escape") {
        const active = document.activeElement;
        const inPanel = !!(panelRef.current && active && panelRef.current.contains(active));
        if (inPanel) buttonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close, disabled, open, panelRef, triggerRef]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    close();
  };

  const moveHighlight = (delta: number) => {
    if (filtered.length === 0) return;
    setHighlightedIndex((current) => (current + delta + filtered.length) % filtered.length);
  };

  const selectHighlighted = () => {
    if (highlighted) handleSelect(highlighted.value);
  };

  const handleTypeahead = (character: string) => {
    window.clearTimeout(typeaheadTimerRef.current);
    typeaheadRef.current = `${typeaheadRef.current}${character}`.toLowerCase();
    typeaheadTimerRef.current = window.setTimeout(() => {
      typeaheadRef.current = "";
    }, TYPEAHEAD_RESET_MS);
    const match = filtered.findIndex((option) =>
      option.label.toLowerCase().startsWith(typeaheadRef.current),
    );
    if (match >= 0) setHighlightedIndex(match);
  };

  const onTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) setOpen(true);
      else moveHighlight(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) setOpen(true);
      else moveHighlight(-1);
      return;
    }

    if (event.key === "Home" && open) {
      event.preventDefault();
      setHighlightedIndex(0);
      return;
    }

    if (event.key === "End" && open) {
      event.preventDefault();
      setHighlightedIndex(Math.max(0, filtered.length - 1));
      return;
    }

    if ((event.key === "Enter" || event.key === " ") && open) {
      event.preventDefault();
      selectHighlighted();
      return;
    }

    if (!open) return;

    if (event.key === "Backspace" && showSearch) {
      event.preventDefault();
      setQuery((current) => current.slice(0, -1));
      return;
    }

    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;

    if (showSearch) {
      event.preventDefault();
      setQuery((current) => current + event.key);
      return;
    }

    event.preventDefault();
    handleTypeahead(event.key);
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
            className={MENU_SEARCH_CLASS}
            onChange={setQuery}
            placeholder={searchPlaceholder}
            tabIndex={-1}
            value={query}
          />
        </div>
      ) : null}
      <div
        id={listboxId}
        role="listbox"
        tabIndex={-1}
        className={portal ? "max-h-full overflow-y-auto" : "max-h-52 overflow-y-auto"}
      >
        {filtered.length === 0 ? (
          <p className="px-3 py-2 text-sm text-fg-muted">{emptyMessage}</p>
        ) : (
          filtered.map((option, index) => (
            <DropdownItem key={option.value}>
              <SelectOptionRow
                highlighted={index === highlightedIndex}
                id={`${listId}-option-${index}`}
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
        ref={buttonRef}
        type="button"
        id={id}
        disabled={disabled}
        role="combobox"
        aria-autocomplete={showSearch ? "list" : "none"}
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-activedescendant={activeOptionId}
        onClick={() => {
          if (!disabled) setOpen((current) => !current);
        }}
        onKeyDown={onTriggerKeyDown}
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
