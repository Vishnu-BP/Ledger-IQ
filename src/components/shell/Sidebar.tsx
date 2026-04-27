"use client";

/**
 * @file Sidebar.tsx — Persistent left navigation for the (app) route group.
 * @module components/shell
 *
 * Renders the 5 protected sections (Dashboard, Transactions, Upload,
 * Reconciliation, Reports) with lucide icons. Highlights the active route by
 * comparing usePathname to each link's href prefix.
 *
 * Bottom of sidebar holds Settings link (placeholder for now) and Sign out.
 *
 * @dependencies next/link, next/navigation, lucide-react
 * @related app/(app)/layout.tsx, components/shell/SignOutButton.tsx
 */

import {
  FileText,
  GitCompareArrows,
  LayoutDashboard,
  ReceiptText,
  Settings,
  Upload,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/shell/SignOutButton";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ReceiptText },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/reconciliation", label: "Reconciliation", icon: GitCompareArrows },
  { href: "/reports", label: "Reports", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r bg-card">
      <div className="px-6 py-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-lg font-bold tracking-tight"
        >
          LedgerIQ
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t px-3 py-3">
        <button
          type="button"
          disabled
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground/60"
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
        <SignOutButton />
      </div>
    </aside>
  );
}
