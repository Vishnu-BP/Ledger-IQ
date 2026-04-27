import "@/db/load-env";

/**
 * @file seed.ts — Seeds gst_categories with Indian SMB GST treatments.
 * @module db
 *
 * Idempotent: uses onConflictDoNothing so re-runs are safe. Run via
 * `pnpm db:seed`. Loaded once after the initial migration; re-run only
 * when the category list changes.
 *
 * The category set covers the typical Indian SMB chart of GST heads:
 * outward supplies (sales), ITC on goods/services, capital goods, blocked
 * ITC, and exempt/out-of-GST categories. The two-tier LLM categorizer
 * picks from this list at runtime.
 *
 * @dependencies drizzle-orm, postgres, dotenv
 * @related db/schema.ts, db/client.ts, docs/prd/03-database.md §11.10
 */

import { createLogger } from "@/lib/logger";
import { db } from "@/db/client";
import { gst_categories } from "@/db/schema";

const log = createLogger("DB");

interface SeedRow {
  category: string;
  gst_section: string;
  gst_rate: string;
  is_blocked_itc?: boolean;
  tcs_applicable?: boolean;
  tcs_rate?: string | null;
}

// ─── Seed data ─────────────────────────────────────────────────

const seeds: SeedRow[] = [
  // ─── Outward Supplies (sales) ────────────────────────────────
  { category: "Sales - Goods 5%", gst_section: "Outward Supplies", gst_rate: "5.00" },
  { category: "Sales - Goods 12%", gst_section: "Outward Supplies", gst_rate: "12.00" },
  { category: "Sales - Goods 18%", gst_section: "Outward Supplies", gst_rate: "18.00" },
  { category: "Sales - Goods 28%", gst_section: "Outward Supplies", gst_rate: "28.00" },
  { category: "Sales - Services", gst_section: "Outward Supplies", gst_rate: "18.00" },
  { category: "Marketplace Settlement - Amazon", gst_section: "Outward Supplies", gst_rate: "18.00", tcs_applicable: true, tcs_rate: "1.00" },
  { category: "Marketplace Settlement - Flipkart", gst_section: "Outward Supplies", gst_rate: "18.00", tcs_applicable: true, tcs_rate: "1.00" },
  { category: "Marketplace Settlement - Other", gst_section: "Outward Supplies", gst_rate: "18.00", tcs_applicable: true, tcs_rate: "1.00" },

  // ─── ITC — Goods (inventory purchases) ───────────────────────
  { category: "Inventory Purchase - Goods 5%", gst_section: "ITC - Goods", gst_rate: "5.00" },
  { category: "Inventory Purchase - Goods 12%", gst_section: "ITC - Goods", gst_rate: "12.00" },
  { category: "Inventory Purchase - Goods 18%", gst_section: "ITC - Goods", gst_rate: "18.00" },
  { category: "Inventory Purchase - Goods 28%", gst_section: "ITC - Goods", gst_rate: "28.00" },

  // ─── ITC — Services (operating expenses) ─────────────────────
  { category: "Software Subscriptions", gst_section: "ITC - Services", gst_rate: "18.00" },
  { category: "Professional Services", gst_section: "ITC - Services", gst_rate: "18.00" },
  { category: "Accounting & Tax Filing", gst_section: "ITC - Services", gst_rate: "18.00" },
  { category: "Marketing & Advertising", gst_section: "ITC - Services", gst_rate: "18.00" },
  { category: "Internet & Telephone", gst_section: "ITC - Services", gst_rate: "18.00" },
  { category: "Office Supplies", gst_section: "ITC - Services", gst_rate: "18.00" },
  { category: "Bank Charges", gst_section: "ITC - Services", gst_rate: "18.00" },
  { category: "Insurance Premium", gst_section: "ITC - Services", gst_rate: "18.00" },
  { category: "Rent - Commercial", gst_section: "ITC - Services", gst_rate: "18.00" },
  { category: "Utilities - Electricity", gst_section: "ITC - Services", gst_rate: "18.00" },
  { category: "Travel & Transport", gst_section: "ITC - Services", gst_rate: "5.00" },

  // ─── Capital Goods ───────────────────────────────────────────
  { category: "Computers & Hardware", gst_section: "Capital Goods", gst_rate: "18.00" },
  { category: "Furniture & Fixtures", gst_section: "Capital Goods", gst_rate: "18.00" },

  // ─── Blocked ITC ─────────────────────────────────────────────
  { category: "Food & Beverage", gst_section: "Blocked ITC", gst_rate: "5.00", is_blocked_itc: true },
  { category: "Motor Vehicles", gst_section: "Blocked ITC", gst_rate: "28.00", is_blocked_itc: true },
  { category: "Personal Expenses", gst_section: "Blocked ITC", gst_rate: "0.00", is_blocked_itc: true },

  // ─── Exempt / Out of GST ─────────────────────────────────────
  { category: "Salaries & Wages", gst_section: "Exempt", gst_rate: "0.00" },
  { category: "GST Payment", gst_section: "Exempt", gst_rate: "0.00" },
  { category: "TDS Payment", gst_section: "Exempt", gst_rate: "0.00" },
  { category: "Income Tax Payment", gst_section: "Exempt", gst_rate: "0.00" },
  { category: "Loan Repayment", gst_section: "Exempt", gst_rate: "0.00" },
  { category: "Loan Interest", gst_section: "Exempt", gst_rate: "0.00" },
  { category: "Owner Drawings", gst_section: "Exempt", gst_rate: "0.00" },
  { category: "Inter-bank Transfer", gst_section: "Exempt", gst_rate: "0.00" },
  { category: "Uncategorized", gst_section: "Exempt", gst_rate: "0.00" },
];

// ─── Main ──────────────────────────────────────────────────────

async function main() {
  log.info(`Seeding ${seeds.length} GST categories`);

  for (const row of seeds) {
    await db.insert(gst_categories).values(row).onConflictDoNothing();
  }

  log.info("Seed complete");
  process.exit(0);
}

main().catch((err) => {
  log.error("Seed failed", { err: String(err) });
  process.exit(1);
});
