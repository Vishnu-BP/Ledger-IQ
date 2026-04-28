/**
 * @file HeroSection.tsx — Above-the-fold hero for the LedgerIQ landing page.
 * @module components/landing
 *
 * Full-width section with oversized headline, gradient accent text, decorative
 * background blobs, dual CTAs, and three social-proof trust badges.
 *
 * @dependencies next/link, lucide-react
 * @related components/landing/LandingNav.tsx
 */

import Link from "next/link";
import { ArrowRight, FileText, ShieldCheck, Zap } from "lucide-react";

// ─── Component ─────────────────────────────────────────────

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-36 text-center">
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute -top-32 right-0 h-[500px] w-[500px] rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-blue-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-3xl">
        {/* Announcement pill */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
          <Zap className="h-3 w-3 text-yellow-500" />
          AI-powered · Built for Indian SMBs
        </div>

        {/* Headline */}
        <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
          Your CA&apos;s job,{" "}
          <span className="bg-gradient-to-r from-primary via-blue-600 to-blue-800 bg-clip-text text-transparent">
            done overnight.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Upload your HDFC or ICICI bank CSV. LedgerIQ&apos;s two-tier AI
          categorizes every UPI, NEFT and card entry, maps GST heads, pre-fills
          your GSTR-3B, and catches the Amazon settlement gaps your CA misses.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90"
          >
            Start free — no card needed
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#demo-transactions"
            className="rounded-md border px-7 py-3.5 text-sm font-medium transition hover:bg-muted"
          >
            See a live demo ↓
          </a>
        </div>

        {/* Trust badges */}
        <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Data never leaves India
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-yellow-500" />
            200 transactions in under 90 seconds
          </span>
          <span className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-primary" />
            HDFC · ICICI · Axis · Universal CSV
          </span>
        </div>
      </div>
    </section>
  );
}
