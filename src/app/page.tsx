/**
 * @file page.tsx — / — LedgerIQ public landing page.
 * @module app
 *
 * Layer 5.7: polished hero + 3 feature cards + CTA.
 * Kept as a single RSC file (no sub-components) since the page is compact.
 */

import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  FileBarChart2,
  ShoppingBag,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { ArrowRight, BarChart3, ShieldCheck, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* ── Nav ──────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 py-4 border-b">
        <span className="text-lg font-bold tracking-tight">LedgerIQ</span>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-md bg-primary px-4 py-1.5 text-sm text-primary-foreground transition hover:opacity-90"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground mb-6">
          <Zap className="h-3 w-3 text-yellow-500" />
          AI-powered · Built for Indian SMBs
        </div>

        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Your bank statement,{" "}
          <span className="text-primary">understood in minutes</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Upload a CSV → AI categorizes every transaction → GST liability computed
          automatically → Amazon marketplace gaps surfaced instantly.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow transition hover:opacity-90"
          >
            Start free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/auth/login"
            className="rounded-md border px-6 py-3 text-sm font-medium transition hover:bg-muted"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* ── Feature cards ────────────────────────────────── */}
      <section className="border-t bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-2xl font-bold tracking-tight">
            Everything an Indian SMB needs
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <FeatureCard
              icon={BookOpen}
              title="AI Categorisation"
              description="Two-tier LLM pipeline: Llama for bulk, Claude for edge cases. Regex rules pre-categorize Indian payment rails instantly."
            />
            <FeatureCard
              icon={FileBarChart2}
              title="GST Compliance"
              description="GSTR-3B pre-filled from your transactions. Outward tax, eligible ITC, blocked ITC — copy values straight to the GST portal."
            />
            <FeatureCard
              icon={ShoppingBag}
              title="Marketplace Reconciliation"
              description="Upload your Amazon settlement report. LedgerIQ spots the gap between what Amazon says they paid and what hit your bank."
            />
          </div>
        </div>
      </section>

      {/* ── Anomaly callout ──────────────────────────────── */}
      <section className="border-t px-6 py-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="text-xl font-bold">
            &ldquo;Amazon owes you ₹960 across 6 disputed orders&rdquo;
          </h3>
          <p className="text-muted-foreground">
            AI anomaly detection catches duplicates, missing recurring payments,
            spend spikes, and marketplace discrepancies — before your CA does.
          </p>
          <Link
            href="/auth/signup"
            className="mt-2 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Try it free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t px-6 py-6 text-center text-xs text-muted-foreground">
        LedgerIQ — AI financial autopilot for Indian small businesses
      </footer>
    </main>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 space-y-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
