/**
 * @file page.tsx — Onboarding wizard host page (RSC).
 * @module app/onboarding
 *
 * Server-side gate: redirect unauthenticated users to /auth/login (defensive —
 * middleware already does this), redirect users with an existing business to
 * /app/dashboard. Else render the client wizard.
 *
 * @related components/onboarding/OnboardingWizard.tsx, middleware.ts
 */

import { redirect } from "next/navigation";
import { BarChart3 } from "lucide-react";
import Link from "next/link";

import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { getCurrentBusiness } from "@/lib/auth/getCurrentBusiness";

export default async function OnboardingPage() {
  const result = await getCurrentBusiness();

  if (!result) redirect("/auth/login");
  if (result.business) redirect("/app/dashboard");

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-zinc-900">
      {/* Top Header */}
      <header className="flex h-16 w-full items-center justify-between border-b border-slate-100 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-950">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-indigo">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-medium tracking-tight">LedgerIQ</span>
        </Link>
        <div id="onboarding-progress-pill">
          {/* This pill will be populated by the client component or we can pass state if needed. 
              For now, let's keep it simple or just a placeholder. */}
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-4 py-10">
        <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <OnboardingWizard />
        </div>
      </main>
    </div>
  );
}
