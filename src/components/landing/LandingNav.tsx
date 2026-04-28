/**
 * @file LandingNav.tsx — Sticky top navigation bar for the public landing page.
 * @module components/landing
 *
 * Auto-hides on scroll-down and re-appears on scroll-up via useHideOnScrollDown.
 * Contains the LedgerIQ brand, a theme toggle, and Sign in / Get started CTAs.
 *
 * @dependencies next/link, lucide-react, lib/hooks, lib/utils
 * @related components/landing/ThemeToggle.tsx, lib/hooks/useHideOnScrollDown.ts
 */

"use client";

import Link from "next/link";
import { Landmark } from "lucide-react";
import { useHideOnScrollDown } from "@/lib/hooks/useHideOnScrollDown";
import { ThemeToggle } from "@/components/landing/ThemeToggle";
import { cn } from "@/lib/utils";

// ─── Component ─────────────────────────────────────────────

export function LandingNav() {
  const visible = useHideOnScrollDown();

  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-3",
        "border-b bg-background/80 backdrop-blur-md",
        "transition-transform duration-300",
        visible ? "translate-y-0" : "-translate-y-full",
      )}
    >
      {/* Brand */}
      <Link
        href="/"
        className="flex items-center gap-2 font-bold text-lg tracking-tight text-foreground"
      >
        <Landmark className="h-5 w-5 text-primary" />
        LedgerIQ
      </Link>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <Link
          href="/auth/login"
          className="rounded-md px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign in
        </Link>

        <Link
          href="/auth/signup"
          className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Get started
        </Link>
      </div>
    </nav>
  );
}
