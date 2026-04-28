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

import { Calendar, ChevronRight } from "lucide-react";

interface HeaderProps {
  businessName: string;
  userEmail?: string;
}

export function Header({ businessName, userEmail }: HeaderProps) {
  const userInitial = userEmail ? userEmail[0].toUpperCase() : "U";

  return (
    <header className="flex h-16 items-center justify-between bg-white dark:bg-zinc-950 px-8 border-b border-slate-100 dark:border-zinc-800">
      {/* Breadcrumb / Context */}
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        <span className="text-slate-900 dark:text-white font-bold text-base tracking-tight uppercase">{businessName}</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Period Selector */}
        <button className="flex items-center gap-2 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 px-4 py-2 text-sm font-semibold transition-all hover:bg-slate-100 dark:hover:bg-zinc-800">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-slate-700 dark:text-slate-200">This month</span>
          <ChevronRight className="h-3 w-3 text-slate-400 rotate-90" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-100 dark:border-zinc-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/20">
            {userInitial}
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-bold text-slate-900 dark:text-white leading-none mb-0.5">{userEmail}</span>
            <span className="text-[10px] text-slate-400 font-medium">Free Plan</span>
          </div>
        </div>
      </div>
    </header>
  );
}

