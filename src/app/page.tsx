import Link from "next/link";
import { ArrowRight, BarChart3, ShieldCheck, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-indigo">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-medium tracking-tight">LedgerIQ</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild className="hidden sm:inline-flex font-medium">
              <Link href="/auth/login">Log in</Link>
            </Button>
            <Button asChild className="bg-brand-indigo hover:bg-brand-indigo/90 text-white font-medium">
              <Link href="/auth/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative">
        {/* Background Gradient Bloom */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(79,70,229,0.07),transparent)] dark:bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(79,70,229,0.15),transparent)]" />

        <div className="container flex flex-col items-center justify-center px-4 py-24 text-center">
          {/* Pill Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-indigo/20 bg-brand-indigo/5 px-3 py-1 text-xs font-medium text-brand-indigo">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-indigo opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-indigo"></span>
            </span>
            Now in public beta
          </div>

          <h1 className="max-w-3xl text-5xl font-medium tracking-tight sm:text-6xl">
            Automate your business{" "}
            <span className="text-brand-indigo">finances</span> with LedgerIQ
          </h1>

          <p className="mt-6 max-w-xl text-lg text-slate-500 dark:text-slate-400">
            The AI-powered financial autopilot for Indian SMBs. Focus on growth, while we handle your bookkeeping, compliance, and taxes.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Button size="lg" asChild className="bg-brand-indigo hover:bg-brand-indigo/90 text-white px-8 font-medium">
              <Link href="/auth/signup">
                Get started free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-slate-200 dark:border-zinc-800 font-medium">
              View features
            </Button>
          </div>

          {/* Stats Section */}
          <div className="mt-24 grid w-full max-w-4xl grid-cols-1 gap-8 border-t border-slate-100 dark:border-zinc-800 pt-16 sm:grid-cols-3">
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl font-medium">500+</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">Businesses onboarded</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl font-medium">₹10Cr+</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">Transactions processed</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-3xl font-medium">99.9%</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">Platform uptime</span>
            </div>
          </div>
        </div>
      </main>

      {/* Feature Section Placeholder to show spacing rhythm */}
      <section className="container px-4 py-24">
        <div className="grid gap-12 sm:grid-cols-3">
          <div className="space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 dark:bg-zinc-900">
              <Zap className="h-5 w-5 text-brand-indigo" />
            </div>
            <h3 className="text-lg font-medium">Instant Integration</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Connect your bank accounts and GSTIN in minutes with automated syncing.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 dark:bg-zinc-900">
              <ShieldCheck className="h-5 w-5 text-brand-indigo" />
            </div>
            <h3 className="text-lg font-medium">Compliant by Design</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Always up to date with the latest GST and income tax regulations.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 dark:bg-zinc-900">
              <BarChart3 className="h-5 w-5 text-brand-indigo" />
            </div>
            <h3 className="text-lg font-medium">Real-time Insights</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Powerful dashboard with cashflow forecasting and expense analytics.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
