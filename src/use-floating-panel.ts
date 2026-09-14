"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Positions a menu in a portal so overflow:hidden ancestors (drawers, tables,
 * sticky filter bars) cannot clip it. Flips above the trigger when there is
 * not enough room below.
 */
export function useFloatingPanel(open: boolean, onClose: () => void) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const update = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const spaceBelow = viewportH - rect.bottom;
    const preferUp = spaceBelow < 240 && rect.top > spaceBelow;
    const maxH = Math.min(280, preferUp ? rect.top - 12 : spaceBelow - 12);
    setStyle({
      position: "fixed",
      left: rect.left,
      width: Math.max(rect.width, 160),
      zIndex: 200,
      ...(preferUp
        ? { bottom: viewportH - rect.top + 4, top: "auto" }
        : { top: rect.bottom + 4, bottom: "auto" }),
      maxHeight: Math.max(120, maxH),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, update]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return { triggerRef, panelRef, mounted, style };
}
