/**
 * @file useHideOnScrollDown.ts — Hook that returns false when the user scrolls down past 60px.
 * @module lib/hooks
 *
 * Used by LandingNav to auto-hide on scroll-down and re-appear on scroll-up,
 * keeping the viewport clear while reading long-form content.
 *
 * @dependencies react
 * @related components/landing/LandingNav.tsx
 */

"use client";

import { useEffect, useRef, useState } from "react";

// ─── Hook ──────────────────────────────────────────────────

/**
 * Returns `true` when the nav should be visible.
 * Hides on scroll-down past 60px, re-shows on scroll-up.
 * 10px jitter threshold prevents flickering on micro-scrolls.
 */
export function useHideOnScrollDown(): boolean {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    // SSR guard — window is not available during SSR
    if (typeof window === "undefined") return;

    function handleScroll() {
      const y = window.scrollY;
      const delta = y - lastScrollY.current;

      // Always update ref so direction stays accurate on next tick
      lastScrollY.current = y;

      if (y < 60) {
        // Always show when near the top of the page
        setVisible(true);
      } else if (delta > 10) {
        // Scrolling down meaningfully — hide
        setVisible(false);
      } else if (delta < -5) {
        // Any intentional upward scroll — show immediately
        setVisible(true);
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return visible;
}
