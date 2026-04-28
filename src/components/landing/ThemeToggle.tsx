/**
 * @file ThemeToggle.tsx — Sun/Moon icon button that switches light/dark theme.
 * @module components/landing
 *
 * Uses next-themes `useTheme()` to read and set the active theme.
 * Renders null until mounted to avoid SSR/hydration mismatch.
 *
 * @dependencies next-themes, lucide-react
 * @related components/landing/LandingNav.tsx, app/providers.tsx
 */

"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

// ─── Component ─────────────────────────────────────────────

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  // Use `resolvedTheme` not `theme` — when defaultTheme="system" the bare
  // `theme` value is the literal string "system" (not "dark" or "light"),
  // so the toggle compared against the wrong value and went the wrong way
  // on first click. resolvedTheme always returns the actual rendered theme.
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-9" />;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
