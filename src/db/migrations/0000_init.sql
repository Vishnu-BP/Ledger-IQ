CREATE TABLE "anomalies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"transaction_id" uuid,
	"type" text NOT NULL,
	"severity" text NOT NULL,
	"title" text NOT NULL,
	"ai_explanation" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"status" text DEFAULT 'open' NOT NULL,
	"resolution_note" text,
	"detected_at" timestamp DEFAULT now(),
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"business_type" text NOT NULL,
	"industry_subcategory" text,
	"gstin" text,
	"state" text,
	"fiscal_year_start_month" integer DEFAULT 4,
	"sales_channels" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"primary_bank" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "category_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"description_pattern" text NOT NULL,
	"override_category" text NOT NULL,
	"override_channel" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gst_categories" (
	"category" text PRIMARY KEY NOT NULL,
	"gst_section" text NOT NULL,
	"gst_rate" numeric(5, 2) NOT NULL,
	"is_blocked_itc" boolean DEFAULT false,
	"tcs_applicable" boolean DEFAULT false,
	"tcs_rate" numeric(5, 2)
);
--> statement-breakpoint
CREATE TABLE "reconciliations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"settlement_id" uuid NOT NULL,
	"expected_amount" numeric(14, 2) NOT NULL,
	"actual_amount" numeric(14, 2) NOT NULL,
	"discrepancy" numeric(14, 2) NOT NULL,
	"matched_transaction_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"affected_order_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"discrepancy_type" text,
	"ai_explanation" text,
	"status" text DEFAULT 'open' NOT NULL,
	"detected_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"type" text NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"format" text NOT NULL,
	"storage_path" text,
	"ai_narrative" text,
	"generated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "settlement_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"settlement_id" uuid NOT NULL,
	"order_id" text,
	"transaction_type" text,
	"amount_type" text,
	"amount_description" text,
	"amount" numeric(14, 2),
	"posted_date" date,
	"sku" text,
	"quantity_purchased" integer
);
--> statement-breakpoint
CREATE TABLE "settlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"marketplace" text NOT NULL,
	"filename" text NOT NULL,
	"storage_path" text NOT NULL,
	"file_hash" text NOT NULL,
	"settlement_id_external" text,
	"period_start" date,
	"period_end" date,
	"deposit_date" date,
	"total_amount" numeric(14, 2),
	"currency" text DEFAULT 'INR',
	"status" text DEFAULT 'uploaded' NOT NULL,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "statements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"storage_path" text NOT NULL,
	"file_hash" text NOT NULL,
	"file_size_bytes" integer,
	"bank" text,
	"period_start" date,
	"period_end" date,
	"status" text DEFAULT 'uploaded' NOT NULL,
	"total_transactions" integer DEFAULT 0,
	"parse_error" text,
	"uploaded_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"statement_id" uuid,
	"transaction_date" date NOT NULL,
	"description" text NOT NULL,
	"reference_number" text,
	"debit_amount" numeric(14, 2),
	"credit_amount" numeric(14, 2),
	"closing_balance" numeric(14, 2),
	"category" text,
	"channel" text,
	"gst_head" text,
	"gst_rate" numeric(5, 2),
	"gst_amount" numeric(14, 2),
	"tcs_amount" numeric(14, 2),
	"confidence_score" numeric(4, 3),
	"ai_reasoning" text,
	"model_used" text,
	"user_overridden" boolean DEFAULT false,
	"override_category" text,
	"override_channel" text,
	"counterparty_name" text,
	"counterparty_type" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "anomalies" ADD CONSTRAINT "anomalies_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anomalies" ADD CONSTRAINT "anomalies_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_overrides" ADD CONSTRAINT "category_overrides_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_settlement_id_settlements_id_fk" FOREIGN KEY ("settlement_id") REFERENCES "public"."settlements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_lines" ADD CONSTRAINT "settlement_lines_settlement_id_settlements_id_fk" FOREIGN KEY ("settlement_id") REFERENCES "public"."settlements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statements" ADD CONSTRAINT "statements_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_statement_id_statements_id_fk" FOREIGN KEY ("statement_id") REFERENCES "public"."statements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- ─── Indexes (per PRD §11.3) ──────────────────────────────────────
CREATE INDEX "idx_transactions_business_date" ON "transactions" ("business_id", "transaction_date" DESC);--> statement-breakpoint
CREATE INDEX "idx_transactions_business_category" ON "transactions" ("business_id", "category");--> statement-breakpoint
CREATE INDEX "idx_transactions_business_channel" ON "transactions" ("business_id", "channel");--> statement-breakpoint

-- ─── Row-Level Security (per PRD §11.11) ──────────────────────────
-- Enable RLS on every business-scoped table; gst_categories gets RLS + public SELECT only.

ALTER TABLE "businesses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "statements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "settlements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "settlement_lines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reconciliations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "anomalies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "category_overrides" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "gst_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- businesses: user owns rows where user_id = auth.uid()
CREATE POLICY "users_manage_own_businesses" ON "businesses"
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());--> statement-breakpoint

-- statements: business_id must belong to the current user's business
CREATE POLICY "users_manage_own_statements" ON "statements"
  FOR ALL TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));--> statement-breakpoint

-- transactions
CREATE POLICY "users_manage_own_transactions" ON "transactions"
  FOR ALL TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));--> statement-breakpoint

-- settlements
CREATE POLICY "users_manage_own_settlements" ON "settlements"
  FOR ALL TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));--> statement-breakpoint

-- settlement_lines: no business_id column — JOIN through settlements
CREATE POLICY "users_manage_own_settlement_lines" ON "settlement_lines"
  FOR ALL TO authenticated
  USING (settlement_id IN (
    SELECT s.id FROM settlements s
    INNER JOIN businesses b ON s.business_id = b.id
    WHERE b.user_id = auth.uid()
  ))
  WITH CHECK (settlement_id IN (
    SELECT s.id FROM settlements s
    INNER JOIN businesses b ON s.business_id = b.id
    WHERE b.user_id = auth.uid()
  ));--> statement-breakpoint

-- reconciliations
CREATE POLICY "users_manage_own_reconciliations" ON "reconciliations"
  FOR ALL TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));--> statement-breakpoint

-- anomalies
CREATE POLICY "users_manage_own_anomalies" ON "anomalies"
  FOR ALL TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));--> statement-breakpoint

-- reports
CREATE POLICY "users_manage_own_reports" ON "reports"
  FOR ALL TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));--> statement-breakpoint

-- category_overrides
CREATE POLICY "users_manage_own_category_overrides" ON "category_overrides"
  FOR ALL TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));--> statement-breakpoint

-- gst_categories: public read-only (anyone authenticated can SELECT, no writes)
CREATE POLICY "authenticated_read_gst_categories" ON "gst_categories"
  FOR SELECT TO authenticated
  USING (true);