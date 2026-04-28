/**
 * @file page.tsx — Onboarding wizard host page (RSC).
 * @module app/onboarding
 *
 * Server-side gate: redirect unauthenticated users to /auth/login (defensive —
 * middleware already does this), redirect users with an existing business to
 * /dashboard. Else render the client wizard.
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
  if (result.business) redirect("/dashboard");

  return <OnboardingWizard />;
}
