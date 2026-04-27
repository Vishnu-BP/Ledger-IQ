/**
 * @file schema.ts — Zod schema for the onboarding wizard.
 * @module lib/onboarding
 *
 * Single shared schema used by both the client wizard (per-step `trigger`
 * validation via react-hook-form) and the API route (server-side validation
 * before DB insert). Keeping one schema means client + server stay in lockstep.
 *
 * @dependencies zod
 * @related components/onboarding/OnboardingWizard.tsx, app/api/onboarding/route.ts
 */

import { z } from "zod";
import { GSTIN_REGEX } from "@/lib/onboarding/constants";

export const onboardingSchema = z.object({
  // Step 1
  name: z.string().min(1, "Business name is required").max(120),
  business_type: z.enum([
    "retail",
    "restaurant",
    "service",
    "ecommerce",
    "manufacturing",
    "other",
  ]),
  industry_subcategory: z.string().max(120).optional().or(z.literal("")),

  // Step 2
  gstin: z
    .string()
    .transform((s) => s.trim().toUpperCase())
    .refine(
      (s) => s === "" || GSTIN_REGEX.test(s),
      "Enter a valid 15-character GSTIN or leave blank",
    )
    .optional()
    .or(z.literal("")),
  state: z.string().min(2, "Select a state").max(2),
  fiscal_year_start_month: z.number().int().min(1).max(12),

  // Step 3
  sales_channels: z
    .array(z.string())
    .min(1, "Select at least one sales channel"),
  primary_bank: z.string().min(1, "Select a primary bank"),
});

export type OnboardingValues = z.infer<typeof onboardingSchema>;
