/**
 * @file useScrollSpy.ts — Tracks which section is currently in the viewport.
 * @module lib/hooks
 *
 * Uses a single IntersectionObserver across all watched IDs to return the
 * currently-active section ID. Powers the sticky pill navigator in DemoSection.
 *
 * @dependencies react
 * @related components/landing/DemoSection.tsx
 */

"use client";

import { useEffect, useState } from "react";

// ─── Hook ──────────────────────────────────────────────────

/**
 * Watches a list of element IDs via IntersectionObserver.
 * Returns the ID of the section currently intersecting the middle band of the viewport.
 * rootMargin "-40% 0px -50% 0px" means the active zone is the top 10% of the viewport
 * (below the sticky nav + pill bar), so the pill updates right as content enters view.
 */
export function useScrollSpy(
  ids: string[],
  rootMargin = "-40% 0px -50% 0px",
): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || ids.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin },
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [ids, rootMargin]);

  return activeId;
}
