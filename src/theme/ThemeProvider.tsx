"use client";

import type { ComponentProps } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>;

/**
 * Suite-wide theme provider. Thin wrapper over `next-themes` with the
 * conventions the SO apps share: class-based dark mode, OS default, and no
 * color transition flash on toggle.
 *
 * Wrap each app's tree once (usually in the root layout / Providers file).
 * Requires `suppressHydrationWarning` on the app's <html> element.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
