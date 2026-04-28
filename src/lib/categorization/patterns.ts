/**
 * @file patterns.ts — Deterministic vendor + marketplace recognition rules.
 * @module lib/categorization
 *
 * Each rule maps a regex (case-insensitive) to a `(category, channel)` tuple
 * from the seeded `gst_categories` + the `CHANNELS` enum. Rules are ordered
 * most-specific-first; `applyRulesToBatch` short-circuits on first match.
 *
 * **Inclusion criterion:** a rule is added ONLY when both the category AND
 * the channel are confidently determinable from the description alone. Pure
 * payment-rail tokens (`UPI-`, `NEFT-`, `IMPS-`) are intentionally excluded
 * — they tell us the rail, not the purpose. The LLM bulk pass handles those.
 *
 * `direction` (optional): when set, the rule matches only debit or credit
 * rows. Used to disambiguate vendors that flow both ways (e.g., Razorpay
 * payouts vs. Razorpay fees).
 *
 * @related ruleBased.ts, lib/transactions/channels.ts, db/seed.ts
 */

import type { Channel } from "@/lib/transactions/channels";

export type Direction = "debit" | "credit";

export interface Rule {
  /** Short identifier surfaced in `ai_reasoning`. */
  name: string;
  regex: RegExp;
  category: string;
  channel: Channel;
  direction?: Direction;
}

// Marketplace inflows (credit only — these are seller payouts).
const MARKETPLACE: Rule[] = [
  {
    name: "amazon-seller-payout",
    regex: /\bAMAZON\s*(SELLER\s*S(VCS|ERVICES)|PAY\s*MERCHANT|SELLER)\b/i,
    category: "Marketplace Settlement - Amazon",
    channel: "ONLINE_AMAZON",
    direction: "credit",
  },
  {
    name: "flipkart-seller-payout",
    regex: /\bFLIPKART\s*(INTERNET|INDIA|SELLER|PAYMENTS?)\b/i,
    category: "Marketplace Settlement - Flipkart",
    channel: "ONLINE_FLIPKART",
    direction: "credit",
  },
  {
    name: "meesho-payout",
    regex: /\bMEESHO\b/i,
    category: "Marketplace Settlement - Other",
    channel: "ONLINE_OTHER",
    direction: "credit",
  },
];

// Cloud / SaaS subscriptions (debit only — outgoing payments).
const SAAS: Rule[] = [
  {
    name: "aws",
    regex: /\b(AMAZON\s*WEB\s*SERVICES|\bAWS\b)\b/i,
    category: "Software Subscriptions",
    channel: "OPERATING_EXPENSE",
    direction: "debit",
  },
  {
    name: "google-cloud",
    regex: /\bGOOGLE\s*(CLOUD|WORKSPACE|GSUITE|G\s*SUITE)\b/i,
    category: "Software Subscriptions",
    channel: "OPERATING_EXPENSE",
    direction: "debit",
  },
  {
    name: "microsoft",
    regex: /\b(MICROSOFT|OFFICE\s*365|AZURE|MSFT)\b/i,
    category: "Software Subscriptions",
    channel: "OPERATING_EXPENSE",
    direction: "debit",
  },
  {
    name: "zoho",
    regex: /\bZOHO\b/i,
    category: "Software Subscriptions",
    channel: "OPERATING_EXPENSE",
    direction: "debit",
  },
  {
    name: "freshworks-tally",
    regex: /\b(FRESHWORKS|FRESHDESK|TALLY\s*SOL|TALLYSOL)\b/i,
    category: "Software Subscriptions",
    channel: "OPERATING_EXPENSE",
    direction: "debit",
  },
  {
    name: "dev-saas",
    regex: /\b(GITHUB|GITLAB|VERCEL|NETLIFY|SUPABASE|HEROKU|DIGITALOCEAN)\b/i,
    category: "Software Subscriptions",
    channel: "OPERATING_EXPENSE",
    direction: "debit",
  },
  {
    name: "collab-saas",
    regex: /\b(SLACK|NOTION|FIGMA|ATLASSIAN|JIRA|CONFLUENCE|LINEAR\.APP|ZOOM)\b/i,
    category: "Software Subscriptions",
    channel: "OPERATING_EXPENSE",
    direction: "debit",
  },
  {
    name: "ai-saas",
    regex: /\b(OPENAI|ANTHROPIC|OPENROUTER|REPLICATE|HUGGING\s*FACE)\b/i,
    category: "Software Subscriptions",
    channel: "OPERATING_EXPENSE",
    direction: "debit",
  },
  {
    name: "adobe",
    regex: /\b(ADOBE|CREATIVE\s*CLOUD)\b/i,
    category: "Software Subscriptions",
    channel: "OPERATING_EXPENSE",
    direction: "debit",
  },
];

// Telecom + utilities.
const UTILITIES: Rule[] = [
  {
    name: "telecom",
    regex: /\b(AIRTEL|JIO\b|VODAFONE|VI\s*POSTPAID|BSNL|MTNL|TATA\s*TELE)\b/i,
    category: "Internet & Telephone",
    channel: "OPERATING_EXPENSE",
    direction: "debit",
  },
  {
    name: "electricity",
    regex: /\b(BESCOM|TANGEDCO|MSEB|ADANI\s*ELEC|TPCL|TPDDL|TORRENT\s*POWER|ELECTRIC(ITY)?\s*BOARD|KSEB|APSPDCL|TSSPDCL)\b/i,
    category: "Utilities - Electricity",
    channel: "OPERATING_EXPENSE",
    direction: "debit",
  },
];

// Insurance.
const INSURANCE: Rule[] = [
  {
    name: "insurance-premium",
    regex: /\b(LIC\s*OF\s*INDIA|LIC\s*PREM|HDFC\s*LIFE|ICICI\s*PRUDENTIAL|SBI\s*LIFE|MAX\s*LIFE|TATA\s*AIA|BAJAJ\s*ALLIANZ|STAR\s*HEALTH|RELIGARE\s*HEALTH)\b/i,
    category: "Insurance Premium",
    channel: "OPERATING_EXPENSE",
    direction: "debit",
  },
];

// Marketing.
const MARKETING: Rule[] = [
  {
    name: "online-ads",
    regex: /\b(GOOGLE\s*ADS|GOOGLE\s*ADWORDS|FACEBOOK\s*ADS|META\s*ADS|LINKEDIN\s*ADS|TWITTER\s*ADS|X\s*ADS)\b/i,
    category: "Marketing & Advertising",
    channel: "OPERATING_EXPENSE",
    direction: "debit",
  },
];

// Bank-charges family. Indian banks pepper statements with these acronyms.
const BANK_CHARGES: Rule[] = [
  {
    name: "bank-charges",
    regex: /\b(CHRG|CHQ\s*RTN\s*CHG|SMS\s*ALERT\s*CHRG|GST\s*ON\s*CHARGES|MIN\s*BAL\s*CHARGES|NEFT\s*CHRG|IMPS\s*CHRG|RTGS\s*CHRG|ATM\s*WDL\s*CHRG|ANNUAL\s*MAINT\s*CHARGE|AMC\s*CHRG)\b/i,
    category: "Bank Charges",
    channel: "OPERATING_EXPENSE",
    direction: "debit",
  },
];

// Statutory payments.
const STATUTORY: Rule[] = [
  {
    name: "gst-payment",
    regex: /\b(GST\s*PMT|GSTN\s*PAYMENT|PMT_GSTIN|GSTPMT|PMT[-_]GST)\b/i,
    category: "GST Payment",
    channel: "OPERATING_EXPENSE",
    direction: "debit",
  },
  {
    name: "tds-payment",
    regex: /\b(TDS\s*PAYMENT|TDS\s*CHALLAN|TAX\s*DEDUCTED)\b/i,
    category: "TDS Payment",
    channel: "OPERATING_EXPENSE",
    direction: "debit",
  },
  {
    name: "income-tax",
    regex: /\b(INCOME\s*TAX|IT\s*PMT|INCOMETAX|ITR\s*REFUND)\b/i,
    category: "Income Tax Payment",
    channel: "OPERATING_EXPENSE",
    direction: "debit",
  },
];

// Loan repayment (description usually contains EMI / LOAN explicitly).
const LOAN: Rule[] = [
  {
    name: "loan-emi",
    regex: /\b(EMI|LOAN\s*REPAY|HOMELOAN|HOME\s*LOAN|CARLOAN|CAR\s*LOAN|PERSONAL\s*LOAN|BUSINESS\s*LOAN)\b/i,
    category: "Loan Repayment",
    channel: "OPERATING_EXPENSE",
    direction: "debit",
  },
];

// Payroll.
const PAYROLL: Rule[] = [
  {
    name: "salary",
    regex: /\b(SALARY|SALPAY|PAYROLL|WAGES|STAFF\s*SAL|EMPLOYEE\s*SAL)\b/i,
    category: "Salaries & Wages",
    channel: "VENDOR_PAYMENT",
    direction: "debit",
  },
];

// Food (Zomato/Swiggy: blocked ITC by GST rules).
const FOOD: Rule[] = [
  {
    name: "food-delivery",
    regex: /\b(ZOMATO|SWIGGY|EATSURE|FAASOS)\b/i,
    category: "Food & Beverage",
    channel: "OPERATING_EXPENSE",
    direction: "debit",
  },
];

export const RULES: readonly Rule[] = Object.freeze([
  ...MARKETPLACE,
  ...SAAS,
  ...UTILITIES,
  ...INSURANCE,
  ...MARKETING,
  ...BANK_CHARGES,
  ...STATUTORY,
  ...LOAN,
  ...PAYROLL,
  ...FOOD,
]);
