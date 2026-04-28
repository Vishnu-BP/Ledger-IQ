/**
 * @file FeaturesSection.tsx — Six-card feature grid for the landing page.
 * @module components/landing
 *
 * Presents LedgerIQ's six core capabilities in a responsive 1/2/3-column grid.
 * Each card lifts on hover to signal interactivity without navigating anywhere.
 *
 * @dependencies lucide-react
 */

import {
  AlertTriangle,
  Brain,
  FileBarChart2,
  Receipt,
  ShoppingBag,
  Upload,
  type LucideIcon,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

// ─── Data ──────────────────────────────────────────────────

const FEATURES: Feature[] = [
  {
    icon: Upload,
    title: "One-click CSV Upload",
    description:
      "Drag-drop your HDFC, ICICI, Axis, or any Indian bank CSV. LedgerIQ auto-detects the format — no column mapping, no manual cleanup.",
  },
  {
    icon: Brain,
    title: "Two-Tier AI Categorization",
    description:
      "Llama 3.3 categorizes 200 transactions in one pass. Claude Sonnet steps in for edge cases. Result: 94%+ accuracy without you touching a row.",
  },
  {
    icon: Receipt,
    title: "GST Head Mapping",
    description:
      "Every transaction is tagged to its GST head — Outward Supply, ITC-eligible, ITC-blocked, or Exempt. No spreadsheet gymnastics required.",
  },
  {
    icon: FileBarChart2,
    title: "GSTR-3B Pre-fill",
    description:
      "Sections 3.1, 4A, 4B, 5, and 6.1 populated from your transactions. Copy figures straight into the GST portal. Your CA will thank you.",
  },
  {
    icon: ShoppingBag,
    title: "Marketplace Reconciliation",
    description:
      "Upload your Amazon or Flipkart settlement report. LedgerIQ matches every line item against your bank credits and flags the gap — to the rupee.",
  },
  {
    icon: AlertTriangle,
    title: "Anomaly Detection",
    description:
      "Duplicate debits, missing recurring payments, sudden vendor-spend spikes, and marketplace shortfalls — surfaced automatically, explained by AI.",
  },
];

// ─── Component ─────────────────────────────────────────────

export function FeaturesSection() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            Features
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything your accountant wished you had
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            From raw CSV to GST-ready books — LedgerIQ handles the full journey
            so you don&apos;t have to.
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Sub-component ─────────────────────────────────────────

function FeatureCard({ icon: Icon, title, description }: Feature) {
  return (
    <div className="cursor-default space-y-4 rounded-xl border bg-card p-6 transition-transform duration-200 hover:-translate-y-1">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
