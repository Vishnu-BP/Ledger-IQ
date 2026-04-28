"use client";

/**
 * @file Sidebar.tsx — Persistent left navigation for the (app) route group.
 * @module components/shell
 *
 * Premium sidebar: Landmark brand icon, primary-tinted active states, and a
 * user identity area at the bottom showing business initial + email.
 * Active route detected by comparing usePathname to each link's href prefix.
 *
 * @dependencies next/link, next/navigation, lucide-react
 * @related app/(app)/layout.tsx, components/shell/SignOutButton.tsx
 */

import {
  FileText,
  GitCompareArrows,
  Landmark,
  LayoutDashboard,
  ReceiptText,
  Upload,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/shell/SignOutButton";
import { cn } from "@/lib/utils";

// ─── Types & data ──────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",      label: "Dashboard",      icon: LayoutDashboard  },
  { href: "/transactions",   label: "Transactions",   icon: ReceiptText      },
  { href: "/upload",         label: "Upload",         icon: Upload           },
  { href: "/reconciliation", label: "Reconciliation", icon: GitCompareArrows },
  { href: "/reports",        label: "Reports",        icon: FileText         },
];

interface SidebarProps {
  businessName?: string;
  userEmail?: string;
}

// ─── Component ─────────────────────────────────────────────

export function Sidebar({ businessName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const initial = businessName?.charAt(0).toUpperCase() ?? "?";

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r bg-card">
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b px-5 py-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <Landmark className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
        <span className="text-base font-bold tracking-tight">LedgerIQ</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User identity + sign out */}
      <div className="border-t px-3 py-3">
        {(businessName || userEmail) && (
          <div className="mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              {businessName && (
                <p className="truncate text-xs font-medium text-foreground">{businessName}</p>
              )}
              {userEmail && (
                <p className="truncate text-[10px] text-muted-foreground">{userEmail}</p>
              )}
            </div>
          </div>
        )}
        <SignOutButton />
      </div>
    </aside>
  );
}
