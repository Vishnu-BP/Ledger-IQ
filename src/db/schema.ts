/**
 * @file schema.ts — Drizzle ORM schema for LedgerIQ Postgres database.
 * @module db
 *
 * Defines all 10 tables: 8 business-scoped (statements, transactions,
 * settlements, settlement_lines, reconciliations, anomalies, reports,
 * category_overrides) plus the businesses parent and the static gst_categories
 * lookup. Schema is the source of truth — drizzle-kit generates SQL migrations
 * from this file and the runtime app queries through the typed exports.
 *
 * RLS policies and table indexes are NOT defined here (Drizzle has no DSL for
 * them) — they are appended to the generated migration SQL by hand and applied
 * via Supabase MCP. See db/migrations/0000_init.sql.
 *
 * Schema mirrors PRD §11.1–§11.10 verbatim.
 *
 * @dependencies drizzle-orm/pg-core
 * @related drizzle.config.ts, db/migrations/, docs/prd/03-database.md
 */

import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgSchema,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

// ─── Auth schema reference ─────────────────────────────────────
// Supabase Auth owns the `auth.users` table. We reference it by id from every
// business-scoped table. We declare a thin reference here so Drizzle can emit
// foreign keys against `auth.users(id)` without needing to manage that table.

const authSchema = pgSchema("auth");

const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

// ─── 1. businesses ─────────────────────────────────────────────

export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  business_type: text("business_type").notNull(),
  industry_subcategory: text("industry_subcategory"),
  gstin: text("gstin"),
  state: text("state"),
  fiscal_year_start_month: integer("fiscal_year_start_month").default(4),

  sales_channels: jsonb("sales_channels")
    .notNull()
    .default([])
    .$type<string[]>(),
  primary_bank: text("primary_bank"),

  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// ─── 2. statements ─────────────────────────────────────────────

export const statements = pgTable("statements", {
  id: uuid("id").primaryKey().defaultRandom(),
  business_id: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),

  filename: text("filename").notNull(),
  storage_path: text("storage_path").notNull(),
  file_hash: text("file_hash").notNull(),
  file_size_bytes: integer("file_size_bytes"),

  bank: text("bank"),
  period_start: date("period_start"),
  period_end: date("period_end"),

  status: text("status").notNull().default("uploaded"),

  total_transactions: integer("total_transactions").default(0),
  parse_error: text("parse_error"),

  uploaded_at: timestamp("uploaded_at").defaultNow(),
  completed_at: timestamp("completed_at"),
});

// ─── 3. transactions ───────────────────────────────────────────

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  business_id: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  statement_id: uuid("statement_id").references(() => statements.id, {
    onDelete: "cascade",
  }),

  // Raw parsed data
  transaction_date: date("transaction_date").notNull(),
  description: text("description").notNull(),
  reference_number: text("reference_number"),
  debit_amount: numeric("debit_amount", { precision: 14, scale: 2 }),
  credit_amount: numeric("credit_amount", { precision: 14, scale: 2 }),
  closing_balance: numeric("closing_balance", { precision: 14, scale: 2 }),

  // AI-derived fields (NULL until categorization runs)
  category: text("category"),
  channel: text("channel"),
  gst_head: text("gst_head"),
  gst_rate: numeric("gst_rate", { precision: 5, scale: 2 }),
  gst_amount: numeric("gst_amount", { precision: 14, scale: 2 }),
  tcs_amount: numeric("tcs_amount", { precision: 14, scale: 2 }),

  confidence_score: numeric("confidence_score", { precision: 4, scale: 3 }),
  ai_reasoning: text("ai_reasoning"),
  model_used: text("model_used"),

  // User overrides
  user_overridden: boolean("user_overridden").default(false),
  override_category: text("override_category"),
  override_channel: text("override_channel"),

  // Counterparty identification
  counterparty_name: text("counterparty_name"),
  counterparty_type: text("counterparty_type"),

  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// ─── 4. settlements ────────────────────────────────────────────

export const settlements = pgTable("settlements", {
  id: uuid("id").primaryKey().defaultRandom(),
  business_id: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),

  marketplace: text("marketplace").notNull(),
  filename: text("filename").notNull(),
  storage_path: text("storage_path").notNull(),
  file_hash: text("file_hash").notNull(),

  settlement_id_external: text("settlement_id_external"),
  period_start: date("period_start"),
  period_end: date("period_end"),
  deposit_date: date("deposit_date"),

  total_amount: numeric("total_amount", { precision: 14, scale: 2 }),
  currency: text("currency").default("INR"),

  status: text("status").notNull().default("uploaded"),

  uploaded_at: timestamp("uploaded_at").defaultNow(),
});

// ─── 5. settlement_lines ───────────────────────────────────────

export const settlement_lines = pgTable("settlement_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  settlement_id: uuid("settlement_id")
    .notNull()
    .references(() => settlements.id, { onDelete: "cascade" }),

  order_id: text("order_id"),
  transaction_type: text("transaction_type"),
  amount_type: text("amount_type"),
  amount_description: text("amount_description"),
  amount: numeric("amount", { precision: 14, scale: 2 }),
  posted_date: date("posted_date"),
  sku: text("sku"),
  quantity_purchased: integer("quantity_purchased"),
});

// ─── 6. reconciliations ────────────────────────────────────────

export const reconciliations = pgTable("reconciliations", {
  id: uuid("id").primaryKey().defaultRandom(),
  business_id: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  settlement_id: uuid("settlement_id")
    .notNull()
    .references(() => settlements.id, { onDelete: "cascade" }),

  expected_amount: numeric("expected_amount", {
    precision: 14,
    scale: 2,
  }).notNull(),
  actual_amount: numeric("actual_amount", {
    precision: 14,
    scale: 2,
  }).notNull(),
  discrepancy: numeric("discrepancy", { precision: 14, scale: 2 }).notNull(),

  matched_transaction_ids: jsonb("matched_transaction_ids")
    .notNull()
    .default([])
    .$type<string[]>(),
  affected_order_ids: jsonb("affected_order_ids")
    .notNull()
    .default([])
    .$type<string[]>(),

  discrepancy_type: text("discrepancy_type"),
  ai_explanation: text("ai_explanation"),

  status: text("status").notNull().default("open"),

  detected_at: timestamp("detected_at").defaultNow(),
});

// ─── 7. anomalies ──────────────────────────────────────────────

export const anomalies = pgTable("anomalies", {
  id: uuid("id").primaryKey().defaultRandom(),
  business_id: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  transaction_id: uuid("transaction_id").references(() => transactions.id, {
    onDelete: "cascade",
  }),

  type: text("type").notNull(),
  severity: text("severity").notNull(),
  title: text("title").notNull(),
  ai_explanation: text("ai_explanation"),

  metadata: jsonb("metadata").default({}).$type<Record<string, unknown>>(),

  status: text("status").notNull().default("open"),
  resolution_note: text("resolution_note"),

  detected_at: timestamp("detected_at").defaultNow(),
  resolved_at: timestamp("resolved_at"),
});

// ─── 8. reports ────────────────────────────────────────────────

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  business_id: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),

  type: text("type").notNull(),
  period_start: date("period_start").notNull(),
  period_end: date("period_end").notNull(),

  format: text("format").notNull(),
  storage_path: text("storage_path"),
  ai_narrative: text("ai_narrative"),

  generated_at: timestamp("generated_at").defaultNow(),
});

// ─── 9. category_overrides ─────────────────────────────────────

export const category_overrides = pgTable(
  "category_overrides",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    business_id: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),

    description_pattern: text("description_pattern").notNull(),
    override_category: text("override_category").notNull(),
    override_channel: text("override_channel"),

    created_at: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    businessPatternUniq: unique("category_overrides_business_id_pattern_uniq").on(
      t.business_id,
      t.description_pattern,
    ),
  }),
);

// ─── 10. gst_categories (static seed, public-readable) ─────────

export const gst_categories = pgTable("gst_categories", {
  category: text("category").primaryKey(),
  gst_section: text("gst_section").notNull(),
  gst_rate: numeric("gst_rate", { precision: 5, scale: 2 }).notNull(),
  is_blocked_itc: boolean("is_blocked_itc").default(false),
  tcs_applicable: boolean("tcs_applicable").default(false),
  tcs_rate: numeric("tcs_rate", { precision: 5, scale: 2 }),
});
