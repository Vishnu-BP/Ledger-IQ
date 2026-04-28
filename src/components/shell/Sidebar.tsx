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
  BarChart3,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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
    <aside className="hidden lg:flex h-screen w-[420px] shrink-0 flex-col bg-[#030113] text-white border-r border-white/5 shadow-2xl overflow-hidden">
      {/* Logo Header */}
      <div className="px-6 py-8">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 text-xl font-bold tracking-tight text-white group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/20 transition-transform group-hover:scale-105">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <span className="tracking-tight">LedgerIQ</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-4">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[15px] font-semibold transition-all duration-200",
                active
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-white/40 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 transition-colors",
                active ? "text-white" : "text-white/40 group-hover:text-white"
              )} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Promotional Card - Exactly like the reference */}
      <div className="px-4 mb-6">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-b from-white/10 to-transparent border border-white/10 p-6 backdrop-blur-xl">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4 h-24 w-24">
              <Image 
                src="/images/promo-sidebar.png" 
                alt="Promo Illustration" 
                fill 
                className="object-contain"
              />
            </div>
            <h4 className="text-sm font-bold text-white mb-2 leading-snug">
              Save 20+ hours<br/>every month
            </h4>
            <p className="text-[11px] text-white/50 mb-5 leading-relaxed">
              Automate your bookkeeping and focus on growth.
            </p>
            <Link 
              href="/dashboard/automation"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-[11px] font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98]"
            >
              Explore Automation
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="space-y-1 border-t border-white/5 px-4 py-6 bg-black/10">
        <button
          type="button"
          disabled
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/30 cursor-not-allowed transition-colors hover:text-white/50 group"
        >
          <Settings className="h-5 w-5 text-white/20 group-hover:text-white/40" />
          Settings
        </button>
        <div className="px-0">
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}


