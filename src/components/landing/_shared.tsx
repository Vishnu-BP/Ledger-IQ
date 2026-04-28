/**
 * @file _shared.tsx — Internal presentational primitives for landing components.
 * @module components/landing
 *
 * Small atoms reused across landing sub-components.
 * Not exported from the landing barrel — internal only.
 */

import type { ReactNode } from "react";

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-primary">
      {children}
    </p>
  );
}

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
      {children}
    </h2>
  );
}
