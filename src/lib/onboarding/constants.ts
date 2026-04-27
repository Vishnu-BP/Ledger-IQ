/**
 * @file constants.ts — Onboarding form options (business types, states, channels, banks).
 * @module lib/onboarding
 *
 * Single source of truth for the dropdowns and checkboxes in the onboarding
 * wizard. Values mirror the storage format expected by db/schema.ts:
 * lowercase slugs for business_type and primary_bank, lowercase identifiers
 * for sales_channels, and 2-letter Indian state codes for state.
 *
 * @related components/onboarding/OnboardingWizard.tsx, db/schema.ts
 */

export const BUSINESS_TYPES = [
  { value: "retail", label: "Retail" },
  { value: "restaurant", label: "Restaurant" },
  { value: "service", label: "Service" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "other", label: "Other" },
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number]["value"];

// Indian states + UTs, keyed by 2-letter codes used in GSTIN.
export const INDIAN_STATES = [
  { value: "AN", label: "Andaman & Nicobar Islands" },
  { value: "AP", label: "Andhra Pradesh" },
  { value: "AR", label: "Arunachal Pradesh" },
  { value: "AS", label: "Assam" },
  { value: "BR", label: "Bihar" },
  { value: "CH", label: "Chandigarh" },
  { value: "CG", label: "Chhattisgarh" },
  { value: "DN", label: "Dadra & Nagar Haveli and Daman & Diu" },
  { value: "DL", label: "Delhi" },
  { value: "GA", label: "Goa" },
  { value: "GJ", label: "Gujarat" },
  { value: "HR", label: "Haryana" },
  { value: "HP", label: "Himachal Pradesh" },
  { value: "JK", label: "Jammu & Kashmir" },
  { value: "JH", label: "Jharkhand" },
  { value: "KA", label: "Karnataka" },
  { value: "KL", label: "Kerala" },
  { value: "LA", label: "Ladakh" },
  { value: "LD", label: "Lakshadweep" },
  { value: "MP", label: "Madhya Pradesh" },
  { value: "MH", label: "Maharashtra" },
  { value: "MN", label: "Manipur" },
  { value: "ML", label: "Meghalaya" },
  { value: "MZ", label: "Mizoram" },
  { value: "NL", label: "Nagaland" },
  { value: "OD", label: "Odisha" },
  { value: "PY", label: "Puducherry" },
  { value: "PB", label: "Punjab" },
  { value: "RJ", label: "Rajasthan" },
  { value: "SK", label: "Sikkim" },
  { value: "TN", label: "Tamil Nadu" },
  { value: "TS", label: "Telangana" },
  { value: "TR", label: "Tripura" },
  { value: "UP", label: "Uttar Pradesh" },
  { value: "UK", label: "Uttarakhand" },
  { value: "WB", label: "West Bengal" },
] as const;

export const SALES_CHANNELS = [
  { value: "physical_store", label: "Physical store" },
  { value: "amazon", label: "Amazon" },
  { value: "flipkart", label: "Flipkart" },
  { value: "meesho", label: "Meesho" },
  { value: "b2b_direct", label: "Direct B2B" },
  { value: "other", label: "Other" },
] as const;

export type SalesChannel = (typeof SALES_CHANNELS)[number]["value"];

export const BANKS = [
  { value: "hdfc", label: "HDFC Bank" },
  { value: "icici", label: "ICICI Bank" },
  { value: "sbi", label: "State Bank of India" },
  { value: "axis", label: "Axis Bank" },
  { value: "kotak", label: "Kotak Mahindra Bank" },
  { value: "other", label: "Other" },
] as const;

export type Bank = (typeof BANKS)[number]["value"];

export const FISCAL_YEAR_MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April (default)" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
] as const;

// GSTIN format: 2-digit state code + 5-letter PAN prefix + 4-digit PAN sequence
// + 1-letter PAN check + 1-digit entity + 1 alphanumeric + literal Z + 1 alphanumeric.
export const GSTIN_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9][A-Z0-9]Z[0-9A-Z]$/;
