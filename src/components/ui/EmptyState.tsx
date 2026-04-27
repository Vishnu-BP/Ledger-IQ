/**
 * @file EmptyState.tsx — Reusable empty-state slot for screens without data.
 * @module components/ui
 *
 * Used by every protected page in its initial state per PRD §15.5. Composed
 * of an icon, title, description, and an optional CTA passed as children
 * (typically a Button + Link).
 *
 * @related app/(app)/dashboard/page.tsx, app/(app)/upload/page.tsx, etc.
 */

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-card/50 p-12 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && (
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      )}
      {children && <div className="pt-2">{children}</div>}
    </div>
  );
}
