/**
 * Motion tokens — the one source of truth for duration, easing and stagger
 * across the SO suite (Portal, Equipo Móvil, Cotizador, Permisos, Carta Responsiva).
 *
 * Before this file each app hand-wrote its own values: 140, 180, 200, 220, 260,
 * 280, 300, 500, 700, 1000 and 2000 ms with no relationship between them. Pick a
 * token, never a number.
 *
 * The curve is not new — it is the one already used by the sidebar width
 * transition and the module enter keyframes in every app's globals.css.
 */

export const motion = {
  /** hover, focus, pressed — anything that must feel like a direct response. */
  instant: 90,
  /** modals, dropdowns, tabs, toasts — the default for UI that appears. */
  quick: 180,
  /** module enter, sheets, side panels — larger surfaces that travel further. */
  settle: 280,
  /** between siblings in a list. 45ms for table rows, 100ms for metric cells. */
  stagger: 45,
  staggerWide: 100,
  /** The only curve in the system. */
  ease: [0.32, 0.72, 0, 1] as const,
} as const;

/** CSS-ready strings, for Tailwind arbitrary values and inline styles. */
export const motionCss = {
  instant: `${motion.instant}ms`,
  quick: `${motion.quick}ms`,
  settle: `${motion.settle}ms`,
  ease: `cubic-bezier(${motion.ease.join(",")})`,
} as const;

/**
 * Canonical modal spring. Softened from the KokonutUI original: the same gesture
 * (spring + rotateX), but damping 34 instead of 30 and a shorter entry travel, so
 * the panel arrives and settles in ONE movement instead of bouncing twice.
 * Total settle ~300ms, down from ~600ms.
 */
export const MODAL_SPRING = {
  type: "spring",
  stiffness: 300,
  damping: 34,
  mass: 0.7,
} as const;

export const MODAL_VARIANTS = {
  hidden: {
    y: "52%",
    opacity: 0,
    rotateX: 4,
    transition: MODAL_SPRING,
  },
  visible: {
    y: 0,
    opacity: 1,
    rotateX: 0,
    transition: {
      ...MODAL_SPRING,
      staggerChildren: 0.035,
      delayChildren: 0.04,
    },
  },
} as const;

export const MODAL_ITEM_VARIANTS = {
  hidden: { y: 10, opacity: 0, transition: MODAL_SPRING },
  visible: { y: 0, opacity: 1, transition: MODAL_SPRING },
} as const;
