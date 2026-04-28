/**
 * @file TechSection.tsx — Tech stack badges and engineering-decision cards.
 * @module components/landing
 *
 * Two-column layout: left has the "built the right way" narrative + 2 callout cards;
 * right has a badge grid showing every technology in the stack.
 *
 * @dependencies lucide-react
 */

import { Cpu, ShieldCheck } from "lucide-react";

// ─── Data ──────────────────────────────────────────────────

const TECH_BADGES = [
  "Next.js 14 App Router",
  "React 18",
  "TypeScript strict",
  "Tailwind CSS",
  "shadcn/ui",
  "Supabase Postgres",
  "Supabase Auth",
  "Supabase RLS",
  "Drizzle ORM",
  "OpenRouter",
  "Llama 3.3 70B",
  "Claude Sonnet",
  "TanStack Query",
  "Recharts",
  "papaparse",
  "Zod",
  "Vercel",
] as const;

// ─── Component ─────────────────────────────────────────────

export function TechSection() {
  return (
    <section className="border-t px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          {/* Left — narrative + engineering cards */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
              Under the hood
            </p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Built for Indian data, not generic bank exports
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              LedgerIQ&apos;s categorization pipeline was designed specifically for
              Indian payment rails — UPI narrations, NACH mandates, GST challans
              — not Western bank data.
            </p>

            {/* Engineering decision 1 */}
            <div className="mt-6 space-y-2 rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">
                  Two-tier categorization, not one model
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Llama 3.3 handles 95% of transactions in bulk at $0.0005/txn.
                Claude Sonnet examines only the low-confidence edge cases.
                Cost-effective and accurate.
              </p>
            </div>

            {/* Engineering decision 2 */}
            <div className="mt-4 space-y-2 rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">
                  Row-level security, not application-level
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Every Supabase query carries RLS policies. Even if an API route
                has a bug, your transactions can never leak to another
                business&apos;s account.
              </p>
            </div>
          </div>

          {/* Right — tech stack badges */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Tech Stack
            </p>
            <div className="flex flex-wrap gap-2">
              {TECH_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="rounded-md border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
