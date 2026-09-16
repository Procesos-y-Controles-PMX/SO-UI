"use client";

import { useEffect } from "react";
import {
  AMBIENT_BRAND_VAR_KEYS,
  brandVarsFromColor,
} from "./ambient-noise";

/**
 * Retint clay brand chrome to a custom NoiseField color. No-op without a
 * color (owner keeps Promexma red). Cleans up on logout / profile change.
 */
export function useAmbientBrand(
  color: [number, number, number] | null | undefined,
) {
  const r = color?.[0];
  const g = color?.[1];
  const b = color?.[2];

  useEffect(() => {
    const root = document.documentElement;
    if (r == null || g == null || b == null) return;
    const vars = brandVarsFromColor([r, g, b]);
    for (const key of AMBIENT_BRAND_VAR_KEYS) {
      root.style.setProperty(key, vars[key]);
    }
    return () => {
      for (const key of AMBIENT_BRAND_VAR_KEYS) {
        root.style.removeProperty(key);
      }
    };
  }, [r, g, b]);
}
