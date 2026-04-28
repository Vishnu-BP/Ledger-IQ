/**
 * @file Header.tsx — Top bar inside the (app) layout.
 * @module components/shell
 *
 * RSC that receives business name + email from the parent layout.
 * Includes a theme toggle (client component) and a user-initial avatar.
 * Period selector placeholder removed — period filtering lives on individual pages.
 *
 * @related app/(app)/layout.tsx, components/landing/ThemeToggle.tsx
 */

import { ThemeToggle } from "@/components/landing/ThemeToggle";

interface HeaderProps {
  businessName: string;
  userEmail?: string;
}

export function Header({ businessName, userEmail }: HeaderProps) {
  const initial = (userEmail ?? businessName).charAt(0).toUpperCase();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-6">
      {/* Business name */}
      <p className="text-sm font-semibold text-foreground">{businessName}</p>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        {userEmail && (
          <div className="flex items-center gap-2 rounded-full border bg-muted/50 pl-1.5 pr-3 py-1">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
              {initial}
            </div>
            <span className="hidden text-xs text-muted-foreground sm:block">{userEmail}</span>
          </div>
        )}
      </div>
    </header>
  );
}
