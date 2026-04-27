# 03 — Database Schema

> Read this section for: Drizzle table definitions, fields, relations, RLS policies.
> Cross-references: [02 — Architecture](02-architecture.md) for the data model overview, [04 — API](04-api.md) for how routes consume these tables.

Covers:
- All 8 business-scoped tables + 1 static seed table
- Drizzle schema definitions
- Indexes
- Row-Level Security (RLS) policies

---

## 11. Database Schema

Complete schema with all fields, types, constraints, and relations. Drizzle syntax.

### 11.1 `businesses`

```typescript
export const businesses = pgTable('businesses', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),

  // Onboarding data
  name: text('name').notNull(),
  business_type: text('business_type').notNull(),         // 'retail' | 'restaurant' | 'service' | 'ecommerce' | 'manufacturing' | 'other'
  industry_subcategory: text('industry_subcategory'),
  gstin: text('gstin'),                                    // optional, max 15 chars
  state: text('state'),                                    // 2-letter state code
  fiscal_year_start_month: integer('fiscal_year_start_month').default(4), // April default

  // Channels (JSON array)
  sales_channels: jsonb('sales_channels').notNull().default([]),
  // ['physical_store', 'amazon', 'flipkart', 'meesho', 'b2b_direct', 'other']

  primary_bank: text('primary_bank'),                      // 'hdfc' | 'icici' | 'sbi' | 'axis' | 'kotak' | 'other'

  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});
```

### 11.2 `statements`

```typescript
export const statements = pgTable('statements', {
  id: uuid('id').primaryKey().defaultRandom(),
  business_id: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),

  filename: text('filename').notNull(),
  storage_path: text('storage_path').notNull(),           // Supabase Storage URL
  file_hash: text('file_hash').notNull(),                 // SHA-256, for dedup
  file_size_bytes: integer('file_size_bytes'),

  bank: text('bank'),                                      // detected from format
  period_start: date('period_start'),
  period_end: date('period_end'),

  status: text('status').notNull().default('uploaded'),
  // 'uploaded' | 'parsing' | 'parsed' | 'categorizing' | 'complete' | 'error'

  total_transactions: integer('total_transactions').default(0),
  parse_error: text('parse_error'),

  uploaded_at: timestamp('uploaded_at').defaultNow(),
  completed_at: timestamp('completed_at'),
});
```

### 11.3 `transactions`

The central table. All fields exist from Layer 1 even if NULL until categorization runs.

```typescript
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  business_id: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  statement_id: uuid('statement_id').references(() => statements.id, { onDelete: 'cascade' }),

  // Raw parsed data
  transaction_date: date('transaction_date').notNull(),
  description: text('description').notNull(),             // raw narration
  reference_number: text('reference_number'),
  debit_amount: decimal('debit_amount', { precision: 14, scale: 2 }),
  credit_amount: decimal('credit_amount', { precision: 14, scale: 2 }),
  closing_balance: decimal('closing_balance', { precision: 14, scale: 2 }),

  // AI-derived fields (NULL until categorization runs)
  category: text('category'),                              // e.g., 'Software Subscriptions'
  channel: text('channel'),                                // see channel enum
  gst_head: text('gst_head'),                              // e.g., 'ITC - Services'
  gst_rate: decimal('gst_rate', { precision: 5, scale: 2 }),
  gst_amount: decimal('gst_amount', { precision: 14, scale: 2 }),
  tcs_amount: decimal('tcs_amount', { precision: 14, scale: 2 }),

  confidence_score: decimal('confidence_score', { precision: 4, scale: 3 }), // 0.000–1.000
  ai_reasoning: text('ai_reasoning'),
  model_used: text('model_used'),                          // 'llama-3.3-70b' | 'claude-sonnet-4.6' | 'rule-based'

  // User overrides
  user_overridden: boolean('user_overridden').default(false),
  override_category: text('override_category'),
  override_channel: text('override_channel'),

  // Vendor/client identification
  counterparty_name: text('counterparty_name'),            // extracted from description
  counterparty_type: text('counterparty_type'),            // 'vendor' | 'client' | 'platform' | 'self' | 'other'

  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Indexes
// idx_transactions_business_date on (business_id, transaction_date DESC)
// idx_transactions_business_category on (business_id, category)
// idx_transactions_business_channel on (business_id, channel)
```

### 11.4 `settlements`

```typescript
export const settlements = pgTable('settlements', {
  id: uuid('id').primaryKey().defaultRandom(),
  business_id: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),

  marketplace: text('marketplace').notNull(),              // 'amazon' | 'flipkart' | 'meesho' | 'other'
  filename: text('filename').notNull(),
  storage_path: text('storage_path').notNull(),
  file_hash: text('file_hash').notNull(),

  settlement_id_external: text('settlement_id_external'),  // Amazon's settlement-id
  period_start: date('period_start'),
  period_end: date('period_end'),
  deposit_date: date('deposit_date'),

  total_amount: decimal('total_amount', { precision: 14, scale: 2 }),
  currency: text('currency').default('INR'),

  status: text('status').notNull().default('uploaded'),
  // 'uploaded' | 'parsing' | 'parsed' | 'reconciling' | 'complete' | 'error'

  uploaded_at: timestamp('uploaded_at').defaultNow(),
});
```

### 11.5 `settlement_lines`

```typescript
export const settlement_lines = pgTable('settlement_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  settlement_id: uuid('settlement_id').notNull().references(() => settlements.id, { onDelete: 'cascade' }),

  order_id: text('order_id'),
  transaction_type: text('transaction_type'),              // 'order' | 'refund' | 'fee' | 'adjustment'
  amount_type: text('amount_type'),                        // 'principal' | 'commission' | 'shipping' | 'tax' | etc.
  amount_description: text('amount_description'),
  amount: decimal('amount', { precision: 14, scale: 2 }),
  posted_date: date('posted_date'),
  sku: text('sku'),
  quantity_purchased: integer('quantity_purchased'),
});
```

### 11.6 `reconciliations`

```typescript
export const reconciliations = pgTable('reconciliations', {
  id: uuid('id').primaryKey().defaultRandom(),
  business_id: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  settlement_id: uuid('settlement_id').notNull().references(() => settlements.id, { onDelete: 'cascade' }),

  expected_amount: decimal('expected_amount', { precision: 14, scale: 2 }).notNull(),
  actual_amount: decimal('actual_amount', { precision: 14, scale: 2 }).notNull(),
  discrepancy: decimal('discrepancy', { precision: 14, scale: 2 }).notNull(),

  matched_transaction_ids: jsonb('matched_transaction_ids').notNull().default([]), // array of transaction.id
  affected_order_ids: jsonb('affected_order_ids').notNull().default([]),

  discrepancy_type: text('discrepancy_type'),
  // 'missing_commission_reversal' | 'duplicate_fee' | 'unprocessed_refund' | 'fee_mismatch' | 'other'

  ai_explanation: text('ai_explanation'),

  status: text('status').notNull().default('open'),
  // 'open' | 'disputed' | 'accepted' | 'resolved'

  detected_at: timestamp('detected_at').defaultNow(),
});
```

### 11.7 `anomalies`

```typescript
export const anomalies = pgTable('anomalies', {
  id: uuid('id').primaryKey().defaultRandom(),
  business_id: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  transaction_id: uuid('transaction_id').references(() => transactions.id, { onDelete: 'cascade' }),

  type: text('type').notNull(),
  // 'duplicate' | 'missing_recurring' | 'spike' | 'vendor_pricing_creep' | 'new_large_payee'

  severity: text('severity').notNull(),                    // 'low' | 'medium' | 'high'
  title: text('title').notNull(),
  ai_explanation: text('ai_explanation'),

  metadata: jsonb('metadata').default({}),                 // type-specific extra data

  status: text('status').notNull().default('open'),        // 'open' | 'reviewed_ok' | 'dismissed'
  resolution_note: text('resolution_note'),

  detected_at: timestamp('detected_at').defaultNow(),
  resolved_at: timestamp('resolved_at'),
});
```

### 11.8 `reports`

```typescript
export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  business_id: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),

  type: text('type').notNull(),                            // 'monthly' | 'quarterly' | 'custom'
  period_start: date('period_start').notNull(),
  period_end: date('period_end').notNull(),

  format: text('format').notNull(),                        // 'pdf' | 'excel'
  storage_path: text('storage_path'),                      // path to generated file
  ai_narrative: text('ai_narrative'),

  generated_at: timestamp('generated_at').defaultNow(),
});
```

### 11.9 `category_overrides`

User correction history — used as a learning signal for future categorization.

```typescript
export const category_overrides = pgTable('category_overrides', {
  id: uuid('id').primaryKey().defaultRandom(),
  business_id: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),

  description_pattern: text('description_pattern').notNull(), // e.g., "ZOMATO"
  override_category: text('override_category').notNull(),
  override_channel: text('override_channel'),

  created_at: timestamp('created_at').defaultNow(),
});
```

### 11.10 `gst_categories` (static seed)

Reference table seeded once. Maps every category to GST treatment.

```typescript
export const gst_categories = pgTable('gst_categories', {
  category: text('category').primaryKey(),                 // e.g., 'Software Subscriptions'
  gst_section: text('gst_section').notNull(),              // 'ITC - Services' | etc.
  gst_rate: decimal('gst_rate', { precision: 5, scale: 2 }).notNull(),
  is_blocked_itc: boolean('is_blocked_itc').default(false),
  tcs_applicable: boolean('tcs_applicable').default(false),
  tcs_rate: decimal('tcs_rate', { precision: 5, scale: 2 }),
});
```

### 11.11 Row-Level Security (RLS) policies

All business-scoped tables enforce RLS so users can only see their own business's data.

```sql
-- Example for transactions
CREATE POLICY "users can view their own transactions"
  ON transactions FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "users can insert their own transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE user_id = auth.uid()
    )
  );

-- Same pattern for: businesses, statements, settlements, settlement_lines,
-- reconciliations, anomalies, reports, category_overrides
-- gst_categories is publicly readable (no RLS)
```
