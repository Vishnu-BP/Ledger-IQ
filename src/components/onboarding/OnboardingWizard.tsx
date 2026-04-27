"use client";

/**
 * @file OnboardingWizard.tsx — 4-step business setup wizard.
 * @module components/onboarding
 *
 * Single react-hook-form instance spans all steps; each step calls
 * form.trigger(stepFields) before advancing so partial validation runs
 * inline. Submit POSTs to /api/onboarding and routes to /dashboard.
 *
 * @dependencies react-hook-form, zod, @hookform/resolvers, sonner
 * @related app/onboarding/page.tsx, app/api/onboarding/route.ts,
 *   lib/onboarding/schema.ts
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  onboardingSchema,
  type OnboardingValues,
} from "@/lib/onboarding/schema";
import { Step1Basics } from "@/components/onboarding/Step1Basics";
import { Step2TaxIdentity } from "@/components/onboarding/Step2TaxIdentity";
import { Step3ChannelsBank } from "@/components/onboarding/Step3ChannelsBank";
import { Step4Recap } from "@/components/onboarding/Step4Recap";

interface StepDef {
  title: string;
  description: string;
  fields: FieldPath<OnboardingValues>[];
}

const STEPS: StepDef[] = [
  {
    title: "Business basics",
    description: "Tell us about your business",
    fields: ["name", "business_type", "industry_subcategory"],
  },
  {
    title: "Tax identity",
    description: "GSTIN, state, fiscal year",
    fields: ["gstin", "state", "fiscal_year_start_month"],
  },
  {
    title: "Sales channels & banking",
    description: "How and where you operate",
    fields: ["sales_channels", "primary_bank"],
  },
  {
    title: "Ready to go",
    description: "Review and submit",
    fields: [],
  },
];

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

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  async function submit() {
    const ok = await form.trigger();
    if (!ok) {
      toast.error("Please review the highlighted fields");
      return;
    }
    setSubmitting(true);
    const values = form.getValues();
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSubmitting(false);
        toast.error(json?.error?.message ?? "Could not save your business");
        return;
      }

      toast.success("Business saved");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setSubmitting(false);
      toast.error("Network error — please try again");
    }
  }

  const current = STEPS[step];
  const progress = `Step ${step + 1} of ${STEPS.length}`;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{current.title}</CardTitle>
        <CardDescription>
          {current.description} • {progress}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 0 && <Step1Basics form={form} />}
        {step === 1 && <Step2TaxIdentity form={form} />}
        {step === 2 && <Step3ChannelsBank form={form} />}
        {step === 3 && <Step4Recap values={form.getValues()} />}

        <div className="flex justify-between gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={back}
            disabled={step === 0 || submitting}
          >
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={next}>
              Next
            </Button>
          ) : (
            <Button type="button" onClick={submit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                "Finish setup"
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
