export { NumberTicker } from "./number-ticker";
export { InteractiveGridPattern } from "./interactive-grid-pattern";
export type { InteractiveGridPatternProps } from "./interactive-grid-pattern";
export { GridLoadingScreen } from "./grid-loading-screen";
export type { GridLoadingScreenProps } from "./grid-loading-screen";
export {
  Terminal,
  TypingAnimation,
  AnimatedSpan,
} from "./terminal";
export { ThemeProvider } from "./theme/ThemeProvider";
export { ThemeToggle } from "./theme/ThemeToggle";
export { GridThemeToggle } from "./theme/GridThemeToggle";
export type { GridThemeToggleProps } from "./theme/GridThemeToggle";
export { cn } from "./lib/cn";

// --- Motion system (design handoff: unified motion tokens + 5 interactions) ---
export { motion, motionCss, MODAL_SPRING, MODAL_VARIANTS, MODAL_ITEM_VARIANTS } from "./motion";
export { SkeletonRow } from "./skeleton-row";
export type { SkeletonRowProps } from "./skeleton-row";
export { Modal } from "./modal";
export type { ModalProps } from "./modal";
export { PendingButton } from "./pending-button";
export type { PendingButtonProps, PendingState } from "./pending-button";
export { RefreshButton, useUpdatedFlash } from "./refresh-button";
export type { RefreshButtonProps } from "./refresh-button";
