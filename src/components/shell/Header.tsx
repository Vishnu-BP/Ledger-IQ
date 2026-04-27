/**
 * @file Header.tsx — Top bar inside the (app) layout.
 * @module components/shell
 *
 * Server Component — receives business name + email already resolved by the
 * parent layout. Shows business name, period selector placeholder (real
 * implementation lands in Layer 4 dashboard), and a user-email pill.
 *
 * @related app/(app)/layout.tsx
 */

import { Calendar } from "lucide-react";

interface HeaderProps {
  businessName: string;
  userEmail?: string;
}

export function Header({ businessName, userEmail }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold">{businessName}</h1>
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5 rounded-md border px-2.5 py-1">
          <Calendar className="h-3.5 w-3.5" />
          <span>This month</span>
        </div>
        {userEmail && (
          <span className="hidden truncate sm:block">{userEmail}</span>
        )}
      </div>
    </header>
  );
}
