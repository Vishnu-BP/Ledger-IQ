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
  const { theme, setTheme } = useTheme();

  // Avoid hydration mismatch — don't render icon until client-side theme is known
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-9" />;

  const isDark = theme === "dark";

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
