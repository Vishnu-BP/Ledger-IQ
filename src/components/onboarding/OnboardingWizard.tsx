"use client";

/**
 * @file OnboardingWizard.tsx — Premium 4-step business setup wizard.
 * @module components/onboarding
 *
 * Full-screen split layout: left panel provides step-aware context on desktop,
 * right panel hosts the form. Single react-hook-form instance spans all steps.
 * Logic (validation, submit, routing) is unchanged — only the visual layer is new.
 *
 * @dependencies react-hook-form, zod, @hookform/resolvers, sonner, next/navigation
 * @related app/onboarding/page.tsx, app/api/onboarding/route.ts, lib/onboarding/schema.ts
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Landmark, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Step1Basics } from "@/components/onboarding/Step1Basics";
import { Step2TaxIdentity } from "@/components/onboarding/Step2TaxIdentity";
import { Step3ChannelsBank } from "@/components/onboarding/Step3ChannelsBank";
import { Step4Recap } from "@/components/onboarding/Step4Recap";
import { onboardingSchema, type OnboardingValues } from "@/lib/onboarding/schema";
import { cn } from "@/lib/utils";

// ─── Step Definitions ──────────────────────────────────────

interface StepDef {
  title: string;
  description: string;
  fields: FieldPath<OnboardingValues>[];
  leftTitle: string;
  leftBody: string;
  leftBullets: string[];
}

const STEPS: StepDef[] = [
  {
    title: "Business basics",
    description: "Tell us about your business",
    fields: ["name", "business_type", "industry_subcategory"],
    leftTitle: "What kind of business do you run?",
    leftBody: "LedgerIQ tailors AI categorization, GST heads, and anomaly detection to your exact industry.",
    leftBullets: ["6 business types", "Indian payment rail patterns built-in", "Subcategory for finer categorization"],
  },
  {
    title: "Tax identity",
    description: "GSTIN, state, fiscal year",
    fields: ["gstin", "state", "fiscal_year_start_month"],
    leftTitle: "Your tax identity",
    leftBody: "Your GSTIN unlocks GSTR-3B pre-fill. Your state sets the correct TCS rates on marketplace payouts.",
    leftBullets: ["GSTR-3B sections auto-filled", "All 36 Indian states & UTs", "April or custom fiscal year start"],
  },
  {
    title: "Sales channels",
    description: "Where and how you operate",
    fields: ["sales_channels", "primary_bank"],
    leftTitle: "Where do you sell?",
    leftBody: "Your bank tells us which CSV format to parse. Your channels tell us which settlement reports to reconcile.",
    leftBullets: ["HDFC · ICICI · Axis · SBI supported", "Amazon & Flipkart reconciliation", "Multi-channel businesses welcome"],
  },
  {
    title: "Review",
    description: "Confirm and launch",
    fields: [],
    leftTitle: "You're almost there",
    leftBody: "LedgerIQ starts learning your payment patterns the moment you upload your first bank statement.",
    leftBullets: ["First insights in under 2 minutes", "Change any setting later", "No credit card required"],
  },
];

// ─── Step Indicator ────────────────────────────────────────

function StepIndicator({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center">
      {Array.from({ length: total }, (_, i) => (
        <Fragment key={i}>
          <div className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-200",
            i <= current ? "bg-primary text-primary-foreground" : "border-2 border-border bg-background text-muted-foreground",
          )}>
            {i < current ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={cn("h-px flex-1 mx-1.5 transition-all duration-300", i < current ? "bg-primary" : "bg-border")} />
          )}
        </Fragment>
      ))}
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "",
      business_type: "" as OnboardingValues["business_type"],
      industry_subcategory: "",
      gstin: "",
      state: "",
      fiscal_year_start_month: 4,
      sales_channels: [],
      primary_bank: "",
    },
    mode: "onTouched",
  });

  async function next() {
    const ok = await form.trigger(STEPS[step].fields);
    if (ok) setStep((s) => s + 1);
  }

  function back() { setStep((s) => Math.max(0, s - 1)); }

  async function submit() {
    const ok = await form.trigger();
    if (!ok) { toast.error("Please review the highlighted fields"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form.getValues()),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setSubmitting(false); toast.error(json?.error?.message ?? "Could not save your business"); return; }
      toast.success("Business saved");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setSubmitting(false);
      toast.error("Network error — please try again");
    }
  }

  const current = STEPS[step];

  return (
    <div className="grid min-h-screen lg:grid-cols-[2fr_3fr]">
      {/* ── Left panel (desktop only) ── */}
      <div className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

        {/* Brand */}
        <div className="relative flex items-center gap-2 text-lg font-bold">
          <Landmark className="h-5 w-5" />
          LedgerIQ
        </div>

        {/* Step-aware content */}
        <div className="relative space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/60">
              Step {step + 1} of {STEPS.length}
            </p>
            <h2 className="text-2xl font-bold leading-snug tracking-tight">
              {current.leftTitle}
            </h2>
            <p className="text-sm leading-relaxed text-primary-foreground/70">
              {current.leftBody}
            </p>
          </div>

          <ul className="space-y-2.5">
            {current.leftBullets.map((b) => (
              <li key={b} className="flex items-center gap-2.5 text-sm text-primary-foreground/80">
                <Check className="h-3.5 w-3.5 shrink-0 text-primary-foreground/60" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom tagline */}
        <p className="relative text-xs text-primary-foreground/40">
          AI financial autopilot for Indian SMBs
        </p>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Step indicator */}
          <StepIndicator total={STEPS.length} current={step} />

          {/* Step header */}
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight">{current.title}</h1>
            <p className="text-sm text-muted-foreground">{current.description}</p>
          </div>

          {/* Step content */}
          <div>
            {step === 0 && <Step1Basics form={form} />}
            {step === 1 && <Step2TaxIdentity form={form} />}
            {step === 2 && <Step3ChannelsBank form={form} />}
            {step === 3 && <Step4Recap values={form.getValues()} />}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={back}
              disabled={step === 0 || submitting}
              className="flex-1"
            >
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={next} className="flex-1">
                Continue
              </Button>
            ) : (
              <Button type="button" onClick={submit} disabled={submitting} className="flex-1">
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Launch LedgerIQ"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
