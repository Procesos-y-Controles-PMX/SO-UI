/** Shared clay surface class strings. Import from `@promexma/ui`. */

export const PANEL_CARD = "neu-raised rounded-sm";

export const SECTION_PANEL = "neu-raised rounded-sm";

export const SECTION_PANEL_HEADER =
  "flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5";

export const PANEL_INSET = "neu-tray rounded-sm";

export const FIELD_INPUT =
  "neu-field w-full min-h-12 rounded-sm px-4 py-2.5 text-base text-fg placeholder:text-fg-faint focus:outline-none md:min-h-0 md:py-2.5 md:text-sm";

export const FIELD_SELECT =
  "neu-field w-full min-h-12 appearance-none rounded-sm bg-[length:12px] bg-[position:right_12px_center] bg-no-repeat px-4 py-2.5 pr-10 text-base text-fg focus:outline-none md:min-h-0 md:text-sm";

/** Trigger for FilterSelect — FIELD_SELECT visual language without native chevron. */
export const FIELD_SELECT_TRIGGER =
  "neu-field min-h-12 w-full rounded-sm py-2.5 text-base text-fg focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 md:min-h-0 md:text-sm";

export const BTN_PRIMARY =
  "btn-primary inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed sm:w-auto md:min-h-0";

export const BTN_SECONDARY =
  "neu-button inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-sm font-semibold text-fg-strong disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto md:min-h-0";

export const BTN_DANGER =
  "btn-danger inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 md:min-h-0";

export const FIELD_LABEL =
  "block text-xs font-semibold uppercase tracking-wider text-fg-subtle";

export const BTN_GHOST =
  "inline-flex min-h-10 items-center justify-center rounded-sm px-3 py-2 text-sm font-semibold text-fg-muted transition-colors hover:text-fg";

export const TABLE_WRAP =
  "neu-raised overflow-x-auto overscroll-x-contain rounded-sm [-webkit-overflow-scrolling:touch]";

export const TABLE_HEAD_CELL =
  "whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-fg-subtle";

export const TABLE_BODY_ROW =
  "border-t border-line-subtle transition-colors hover:bg-muted";

export const EMPTY_STATE =
  "neu-raised rounded-sm px-4 py-12 text-center text-sm text-fg-subtle";

export const MOBILE_LIST_CARD = "neu-raised rounded-sm p-4";

export const STAT_TILE =
  "neu-raised rounded-sm p-4 text-center";

export const STAT_TILE_ACTIVE =
  "neu-pressed rounded-sm p-4 text-center";

export const PAGE_EYEBROW =
  "text-[10px] font-bold uppercase tracking-[0.2em] text-brand";

export const ALERT_WARNING =
  "neu-tray rounded-sm p-3 text-sm text-amber-800 dark:text-amber-200";

export const ALERT_INFO =
  "neu-tray rounded-sm p-3 text-sm text-fg-strong";

export const ALERT_SUCCESS =
  "neu-tray rounded-sm px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300";

export const ALERT_ERROR =
  "neu-tray rounded-sm px-4 py-3 text-sm text-red-600 dark:text-red-400";

export const CHEVRON_SELECT =
  "bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20width%3d%2212%22%20height%3d%2212%22%20viewBox%3d%220%200%2024%2024%22%20fill%3d%22none%22%20stroke%3d%22%2364748b%22%20stroke-width%3d%222%22%3e%3cpolyline%20points%3d%226%209%2012%2015%2018%209%22%3e%3c%2fpolyline%3e%3c%2fsvg%3e')]";

export const FILTER_CONTROL_CLASS =
  "neu-field h-10 w-full rounded-sm text-sm font-medium text-fg outline-none disabled:cursor-not-allowed disabled:text-fg-muted";

export const FILTER_CONTROL_COMPACT_CLASS =
  "neu-field h-9 w-full rounded-sm text-xs font-medium text-fg outline-none disabled:cursor-not-allowed disabled:text-fg-muted";

/** Layout only — add `flex` when the sidebar is visible (never with `hidden`). */
export const SIDEBAR_SHELL = "neu-sidebar h-screen flex-col";

export const SIDEBAR_NAV_ACTIVE = "neu-nav-active text-white";

export const SIDEBAR_NAV_IDLE = "neu-nav-idle text-fg-muted hover:text-fg";

export const SIDEBAR_SECTION_LABEL =
  "text-xs font-bold uppercase tracking-[0.14em] text-brand";

export const SIDEBAR_USER_CARD = "neu-tray rounded-sm p-3";
