# LedgerIQ — Initial Implementation Plan

> The canonical execution plan for building LedgerIQ from scratch. Read alongside [CLAUDE.md](../CLAUDE.md) (operational manual — the "bible") and the [PRD](ledger-iq-prd.md) (canonical product spec).

## Context

We are building **LedgerIQ** from scratch at `c:\projects\Ledger IQ\`. The directory currently contains only documentation: `CLAUDE.md` (operational manual), `docs/ledger-iq-prd.md` (PRD index), and twelve PRD section files under `docs/prd/`.

**Goal:** Ship a polished, demoable AI financial autopilot for Indian SMBs in ~17 productive hours. The build proceeds through 5 layers per [PRD §18](prd/09-build-plan.md), broken here into phase-by-phase sub-tasks. Every sub-phase ships a verifiable thing; layer discipline is mandatory (no work pulled forward from later layers).

**Demo target (the win condition):** upload bank CSV → AI categorizes → dashboard fills with KPIs/charts/anomalies → upload Amazon settlement CSV → reconciliation panel surfaces "Amazon owes you ₹960" → generate audit-ready PDF. Layer 4 alone clears this bar; Layers 1–3 build the substrate, Layer 5 is polish.

**Locked stack** (no substitutions without user approval): Next.js 14 App Router · TypeScript strict · Tailwind + shadcn/ui · Supabase (Postgres + Auth + Storage) · Drizzle ORM · OpenRouter (Llama 3.3 70B + Claude Sonnet 4.6 + Gemini Flash) via `openai` SDK · papaparse · Zod · react-hook-form · TanStack Query · Recharts · @react-pdf/renderer · xlsx · sonner · lucide-react · date-fns. Package manager: **pnpm**.

**Forbidden:** Express, Prisma, NextAuth, LangChain, Zustand, Tesseract, Puppeteer, Redis, Docker, MUI.

---

## Execution model — stage-gated, with permission per stage

Implement **stage by stage**, not layer by layer. After each stage:
1. Report what was achieved (concrete deliverables, files touched, smoke test result).
2. **Ask permission before proceeding to the next stage.** Do not auto-advance.

A "stage" is a single sub-phase from this plan (e.g. `1.1 — Project scaffold` is one stage; `1.2 — Drizzle schema` is the next). User approves each stage individually. If the user grants batched permission ("go ahead with the next 3 stages"), advance until the batch completes, then ask again.

---

## Resolved decisions (carried into the plan)

| # | Question | Decision |
|---|---|---|
| D1 | Phase 0 prerequisites | **All confirmed done.** Supabase project, OpenRouter key, Google + GitHub OAuth all set up. Skip Phase 0 walkthrough. |
| D2 | Categorization status updates | **Polling every 2s** via TanStack Query `refetchInterval` against `GET /api/statements/:id`. Realtime is Phase 2+ polish. |
| D3 | Vercel deploy | **In scope** at Phase 5.8 (~20 min). Public URL for judges. |
| D4 | Parser/categorize execution | **Parsing inline** in upload route handler (papaparse on <500 rows finishes <1s). **Categorization async** via non-awaited promise; frontend polls `statements.status`. No queue, no Redis. |
| D5 | OpenRouter rate-limit handling | **Code-level retry with exponential backoff** (max 3, never on 4xx) + **code-level Gemini Flash fallback** on persistent Llama 429/5xx. Dashboard routing rules optional passive safety net. |
| D6 | Storage bucket creation | **Manual one-time** via Supabase Studio (private bucket `statements`). Documented in `tasks/todo.md`. |
| D7 | Claude model slug | Pin to **whatever Sonnet is GA on OpenRouter at build time** (likely `anthropic/claude-sonnet-4.5`). Verify slug at start of Phase 3.1. |
| D8 | Onboarding API route | **Add `POST /api/onboarding`** even though [PRD §12](prd/04-api.md) doesn't list it. All writes flow through service layer per CLAUDE.md. |
| D9 | PDF generation runtime | **Client-side only** via `@react-pdf/renderer`. No server `app/api/reports/pdf/route.ts`. |
| D10 | Period selector default | **Current month** with dropdown: This month / Last month / FY YTD / Custom. |

---

## Sub-phase template

Every sub-phase below specifies:
- **Deliverable** — concrete output
- **Files** — exact paths from [PRD §10.1](prd/02-architecture.md) folder structure
- **Smoke test** — manual check that proves done
- **Deps** — earlier sub-phases required
- **Time** — wall-clock minutes

After every sub-phase: update `tasks/todo.md`, mark item done. After every **layer (phase X.x complete)**: smoke test full layer + git commit.

---

## Phase 1 — Skeleton (~3 h)

Working SaaS shell with auth, onboarding, empty dashboard, route protection. **No data ingestion.**

### 1.1 — Project scaffold (~25 min)
- **Deliverable:** Next.js 14 App Router with TS strict, Tailwind, shadcn baseline, env validation, tagged logger.
- **Files:** `package.json`, `pnpm-lock.yaml`, `tsconfig.json` (strict), `next.config.js`, `tailwind.config.ts`, `postcss.config.js`, `.env.local`, `.env.example`, `.gitignore`, `app/layout.tsx`, `app/page.tsx` (placeholder), `app/globals.css`, `app/providers.tsx` (TanStack Query + Toaster), `components/ui/*` (shadcn: button, input, card, dialog, dropdown-menu, label, select, sonner, table, tabs, toast), `lib/env.ts`, `lib/logger.ts`, `lib/utils.ts`, `tasks/todo.md`.
- **Smoke:** `pnpm dev` → localhost:3000 renders. `pnpm typecheck` passes. Importing missing env var throws at boot.
- **Deps:** Phase 0 (confirmed done).
- **Note:** `pnpm dlx shadcn@latest init` is interactive — run manually first. Also `git init` here.

### 1.2 — Drizzle + Supabase schema (~40 min)
- **Deliverable:** All 9 tables deployed, indexes, RLS on all 8 business-scoped tables, `gst_categories` seeded with ~30 categories.
- **Files:** `drizzle.config.ts`, `db/schema.ts` (tables verbatim from [PRD §11.1–§11.10](prd/03-database.md)), `db/migrations/0000_init.sql` (generated, then append RLS + indexes from [PRD §11.11](prd/03-database.md)), `db/seed.ts` (categories: Software Subscriptions, Rent, Salaries, Utilities, Inventory Purchase 5/12/18/28%, Marketing/Ads, Professional Services, Bank Charges, GST Paid, etc.), `package.json` scripts: `db:generate`, `db:migrate`, `db:seed`, `db:studio`.
- **Smoke:** `pnpm db:migrate` succeeds. `SELECT count(*) FROM gst_categories` ≥ 25. `pnpm db:studio` opens.
- **Deps:** 1.1.

### 1.3 — Supabase clients + middleware (~25 min)
- **Deliverable:** Browser client, server client (RSC + route handler variants), Next.js middleware enforcing route protection.
- **Files:** `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`, `middleware.ts` (root), `lib/supabase/index.ts`.
- **Smoke:** Visit `/app/dashboard` logged out → redirect to `/auth/login`. Visit `/` → no redirect.
- **Deps:** 1.2.

### 1.4 — Auth flows (~35 min)
- **Deliverable:** Email/password signup + login, Google OAuth, GitHub OAuth, callback route routes by business existence.
- **Files:** `app/auth/login/page.tsx`, `app/auth/signup/page.tsx`, `app/auth/callback/route.ts`, `components/auth/LoginForm.tsx`, `components/auth/SignupForm.tsx`, `components/auth/OAuthButtons.tsx`, `lib/auth/getCurrentBusiness.ts`.
- **Smoke:** All three providers reach `/onboarding` for a new user. Existing user → `/app/dashboard`. Logout works.
- **Deps:** 1.3.

### 1.5 — Onboarding wizard (~30 min)
- **Deliverable:** 4-step wizard per [PRD §15.2](prd/07-ui-ux.md), writes `businesses` row, redirects to dashboard.
- **Files:** `app/onboarding/page.tsx` (RSC: redirects if business exists), `components/onboarding/OnboardingWizard.tsx`, `components/onboarding/Step1Basics.tsx`, `Step2TaxIdentity.tsx`, `Step3ChannelsBank.tsx`, `Step4Recap.tsx`, `app/api/onboarding/route.ts` (POST), `lib/businesses/createBusiness.ts`.
- **Smoke:** New user → wizard → submit → row in `businesses` → lands on dashboard. Refresh `/onboarding` after submission redirects.
- **Deps:** 1.4.

### 1.6 — App shell + empty dashboard (~25 min)
- **Deliverable:** `(app)` route group with sidebar + header, all 5 protected pages reachable as empty stubs.
- **Files:** `app/(app)/layout.tsx`, `app/(app)/dashboard/page.tsx`, `transactions/page.tsx`, `upload/page.tsx`, `reconciliation/page.tsx`, `reports/page.tsx`, `components/shell/Sidebar.tsx`, `Header.tsx`, `SignOutButton.tsx`, `components/ui/EmptyState.tsx`.
- **Smoke:** Sign up → onboard → dashboard → click each sidebar link → each page shows empty state. Sign out → `/`.
- **Deps:** 1.5.

**Phase 1 exit:** all three auth flows + onboarding + sidebar nav work end-to-end. **Commit `layer-1-skeleton`**.

---

## Phase 2 — Foundation (~4 h)

Bank statement CSV ingestion + transactions table viewer with manual override. **No AI yet.**

### 2.1 — Upload page UI (~30 min)
- **Files:** `app/(app)/upload/page.tsx` (replace empty state), `components/upload/FileDropzone.tsx`, `UploadProgress.tsx`, `UploadTypeSelector.tsx`, `lib/hooks/useUpload.ts`.
- **Smoke:** Drop CSV → progress bar → toast.
- **Deps:** 1.6.

### 2.2 — `POST /api/upload` + Storage + dedup (~45 min)
- **Deliverable:** Multipart form, SHA-256 hash, 409 on duplicate `file_hash`, Storage upload to `statements/` bucket, `statements` row inserted.
- **Files:** `app/api/upload/route.ts`, `lib/uploads/uploadStatement.ts`, `lib/uploads/computeFileHash.ts`, `lib/storage/supabaseStorage.ts`.
- **One-time setup:** Create private `statements` bucket via Supabase Studio. Note in `tasks/todo.md`.
- **Smoke:** Upload twice → second is 409. Storage bucket has the file. `statements` table has row.
- **Deps:** 2.1.

### 2.3 — Bank statement CSV parser (~50 min)
- **Deliverable:** HDFC + ICICI parser dispatched by header signature. Parses inline after Storage write, batch-inserts into `transactions`, advances `statements.status: parsing → parsed`, sets period_start/end.
- **Files:** `lib/parsers/bankStatementParser.ts`, `lib/parsers/formats/hdfc.ts`, `formats/icici.ts`, `lib/parsers/types.ts`, `lib/parsers/index.ts`, `types/transaction.ts`. Extend `lib/uploads/uploadStatement.ts`.
- **Smoke:** Upload sample HDFC + ICICI → both parse. Malformed CSV → 400 + `statements.status='error'` with `parse_error`.
- **Deps:** 2.2.

### 2.4 — Transactions table page (~55 min)
- **Deliverable:** Sortable, filterable table. Filters: date range, search by description (channel/category filters stubbed). Edit (manual select) + delete. NULL AI fields render as "Awaiting AI" pill.
- **Files:** `app/(app)/transactions/page.tsx`, `components/transactions/TransactionTable.tsx`, `TransactionRow.tsx`, `EditCategoryModal.tsx`, `TransactionFilters.tsx`, `app/api/transactions/route.ts` (GET), `app/api/transactions/[id]/route.ts` (PATCH, DELETE), `lib/transactions/listTransactions.ts`, `updateTransaction.ts`, `deleteTransaction.ts`, `lib/hooks/useTransactions.ts`, `useUpdateTransaction.ts` (optimistic update — only allowed case per CLAUDE.md).
- **Smoke:** After upload, table fills. Filter narrows. Edit → optimistic update. Delete → row gone.
- **Deps:** 2.3.

**Phase 2 exit:** upload CSV → transactions appear, sortable/editable. **Commit `layer-2-foundation`**.

---

## Phase 3 — Intelligence (~4 h)

AI categorization + channel + GST live. User overrides flow into `category_overrides`.

### 3.1 — OpenRouter client + prompts (~30 min)
- **Deliverable:** Typed `LLMClient` interface (DI pattern). OpenRouter impl via `openai` SDK against `https://openrouter.ai/api/v1`. Retry-with-backoff (max 3, exponential, never on 4xx). Five prompts as named exports.
- **Files:** `lib/openrouter/client.ts`, `lib/openrouter/types.ts` (`LLMClient` interface), `lib/openrouter/prompts.ts` (`BULK_CATEGORIZATION_PROMPT`, `EDGE_CASE_CATEGORIZATION_PROMPT`, `ANOMALY_EXPLANATION_PROMPT`, `RECONCILIATION_DISCREPANCY_PROMPT`, `EXECUTIVE_SUMMARY_PROMPT`), `lib/openrouter/parseResponse.ts`, `lib/openrouter/index.ts`.
- **Verify slug:** before writing client, hit `https://openrouter.ai/api/v1/models` to confirm Sonnet slug.
- **Smoke:** Tiny test script returns parseable JSON. 401 → throws non-retryable.
- **Deps:** 2.4.

### 3.2 — Rule-based pre-categorization (~25 min)
- **Deliverable:** Deterministic pre-pass: regex map for Indian payment rails (UPI-PHONEPE, AMAZON SELLER SVCS, FLIPKART, RAZORPAY, etc.) + user's prior `category_overrides` applied as exact-match. Sets `confidence=1.0`, `model_used='rule-based'`.
- **Files:** `lib/categorization/ruleBased.ts`, `lib/categorization/patterns.ts`, `lib/categorization/applyUserOverrides.ts`, `lib/categorization/types.ts`.
- **Smoke:** Standalone run on `description='AMAZON SELLER SVCS-NEFT-CR'` → `channel='ONLINE_AMAZON'`.
- **Deps:** 3.1.

### 3.3 — Two-tier LLM pipeline (~75 min)
- **Deliverable:** `categorizeTransactions(business_id)` per [PRD §14.1](prd/06-algorithms.md). Llama bulk batches of 20 on rule-unmatched rows. Claude pass on `confidence < 0.85`. Per-batch try/catch (one failure logs, continues). Failed transactions get fallback category. Triggered after parse via non-awaited promise; route returns 202.
- **Files:** `lib/categorization/categorize.ts` (orchestrator), `bulkLlama.ts`, `edgeCaseClaude.ts`, `confidenceThresholds.ts` (`EDGE_CASE_THRESHOLD = 0.85`), `lib/categorization/index.ts`, `app/api/categorize/route.ts`. Extend `lib/uploads/uploadStatement.ts`. Add `app/api/statements/[id]/route.ts` (GET status). Add `lib/hooks/useStatementStatus.ts` (TanStack Query `refetchInterval: 2000` while `status='categorizing'`).
- **Smoke:** Upload sample CSV → status flips to `categorizing` → frontend polls → ~15s later complete, all rows categorized. OpenRouter outage → fallback path runs, no crash.
- **Deps:** 3.2.

### 3.4 — GST head mapping (~20 min)
- **Deliverable:** Deterministic step at end of `categorizeTransactions`: join each row against `gst_categories`, write `gst_head`, `gst_rate`, computed `gst_amount`, `tcs_amount` (1% on `ONLINE_AMAZON`/`ONLINE_FLIPKART` credits).
- **Files:** `lib/gst/categoryMapping.ts`, `computeGstAmount.ts`, `computeTcsAmount.ts`, `lib/gst/index.ts`. Extend `categorize.ts`.
- **Smoke:** Software subscription → `gst_head='ITC - Services'`, `gst_rate=18`. Amazon credits → `tcs_amount` ≈ 1%.
- **Deps:** 3.3.

### 3.5 — Confidence + override UI (~30 min)
- **Deliverable:** Confidence pill (high/med/low color), "Needs review" filter (`confidence < 0.85`), edit modal becomes select-from-categories dropdown + "Apply to all similar" checkbox. Override writes `category_overrides` row + bulk-updates similar.
- **Files:** `components/transactions/ConfidenceBadge.tsx`, `EditCategoryModal.tsx` (rewrite), `AiReasoningTooltip.tsx`, `lib/transactions/applyOverrideToSimilar.ts`. Extend `app/api/transactions/[id]/route.ts` and `TransactionFilters.tsx`.
- **Smoke:** Low-confidence row distinct → modal preloads → change + apply-to-similar → toast "Updated 3 similar" → all 3 reflect.
- **Deps:** 3.4.

**Phase 3 exit:** upload CSV → 60–120s → every row has category/channel/GST/confidence/reasoning. Override → similar update. **Commit `layer-3-intelligence`**.

---

## Phase 4 — Differentiator (~3 h)

The wow moment. Dashboard alive, anomalies, marketplace reconciliation.

### 4.1 — Dashboard data wiring (~50 min)
- **Deliverable:** Live KPIs (Total Revenue, GST Liability, Cash Runway, Open Anomalies count), cash flow area chart (90-day rolling), channel split donut, recent transactions list.
- **Files:** `app/(app)/dashboard/page.tsx`, `components/dashboard/KpiTile.tsx`, `CashFlowChart.tsx`, `ChannelSplitDonut.tsx`, `RecentTransactions.tsx`, `AnomalyPanel.tsx` (stub for 4.2), `app/api/reports/summary/route.ts`, `lib/analytics/cashFlow.ts` (per [PRD §14.5](prd/06-algorithms.md)), `channelSplit.ts`, `totals.ts`, `lib/analytics/index.ts`, `lib/hooks/useDashboardSummary.ts`.
- **Smoke:** Numbers match raw `SELECT sum(...)`. Cash flow 90 days. Donut sums 100%.
- **Deps:** 3.5.

### 4.2 — Anomaly engine (~40 min)
- **Deliverable:** Four detectors (duplicates, missing recurring, spikes, vendor pricing creep) writing to `anomalies` with Claude explanations. Runs at end of `categorizeTransactions` + on demand.
- **Files:** `lib/anomalies/detectDuplicates.ts` (per [PRD §14.4](prd/06-algorithms.md)), `detectMissingRecurring.ts` (per [PRD §14.3](prd/06-algorithms.md)), `detectSpikes.ts`, `detectVendorCreep.ts`, `explainAnomaly.ts` (Claude per [PRD §13.5](prd/05-ai-integration.md); template fallback on LLM fail), `runAllDetectors.ts`, `lib/anomalies/index.ts`, `app/api/anomalies/detect/route.ts`, `app/api/anomalies/[id]/route.ts` (PATCH). Full impl of `AnomalyPanel.tsx`.
- **Smoke:** Demo data with engineered anomalies → 3 anomalies on dashboard with Claude text. Mark OK → row gone, status `reviewed_ok`.
- **Deps:** 4.1.

### 4.3 — Marketplace settlement upload + Amazon parser (~30 min)
- **Deliverable:** Upload supports `amazon_settlement` type. Amazon V2 Flat File parser writes `settlements` + `settlement_lines`.
- **Files:** `lib/parsers/amazonSettlementParser.ts`, `flipkartSettlementParser.ts` (skeleton), `lib/uploads/uploadSettlement.ts`. Extend `app/api/upload/route.ts` and `UploadTypeSelector.tsx`.
- **Smoke:** Drop Amazon CSV → `settlements` row + `settlement_lines` count matches.
- **Deps:** 4.2.

### 4.4 — Reconciliation engine + Claude + view (~50 min) ⭐ HERO
- **Deliverable:** Match settlement against bank credits per [PRD §14.2 + §12.3](prd/06-algorithms.md), classify discrepancies, Claude per-discrepancy explanation per [PRD §13.6](prd/05-ai-integration.md), `reconciliations` rows, reconciliation page with "Amazon owes you ₹X" headline.
- **Files:** `lib/reconciliation/matchSettlements.ts`, `analyzeDiscrepancies.ts` (classifies: missing_commission_reversal, duplicate_fee, unprocessed_refund, fee_mismatch), `discrepancyExplainer.ts`, `lib/reconciliation/index.ts`, `app/api/reconcile/route.ts`, `app/(app)/reconciliation/page.tsx`, `components/reconciliation/ReconciliationView.tsx`, `SettlementCard.tsx`, `lib/hooks/useReconciliation.ts`. Auto-trigger reconcile after settlement upload.
- **Smoke:** Upload Amazon CSV engineered for ₹960 → within 5s, page shows "Amazon owes you ₹960 across 6 disputed orders" with per-row Claude explanations.
- **Deps:** 4.3.

**Phase 4 exit:** full demo arc per [PRD §20.1](prd/10-risks-demo.md) works. **Minimum-winning version. Commit `layer-4-differentiator`**.

---

## Phase 5 — Polish & Output (~3 h)

GSTR-3B, PDF/Excel, panels, polish, demo data, deploy.

### 5.1 — GSTR-3B pre-fill view (~25 min)
- **Files:** `lib/gst/gstr3bAggregator.ts`, `components/reports/Gstr3bView.tsx`, `CopyButton.tsx`, `app/(app)/reports/page.tsx` (tabs: GSTR-3B | PDF | Excel), `app/api/reports/gstr3b/route.ts`.
- **Smoke:** Every field populated; copy works; total reconciles with dashboard GST tile.
- **Deps:** 4.4.

### 5.2 — PDF report (~40 min)
- **Files:** `components/reports/PdfReport.tsx` (`'use client'`, `@react-pdf/renderer`), `PdfExportButton.tsx`, `app/api/reports/narrative/route.ts` (POST, Claude exec summary per [PRD §12.8](prd/04-api.md)), `lib/reports/pdfTemplate.tsx`, `lib/hooks/useGenerateReport.ts`.
- **Smoke:** Click → PDF downloads with all sections.
- **Deps:** 5.1.

### 5.3 — Excel export (~20 min)
- **Files:** `components/reports/ExcelExportButton.tsx`, `lib/reports/excelBuilder.ts` (4 sheets).
- **Smoke:** xlsx downloads, totals match dashboard.
- **Deps:** 5.1.

### 5.4 — Vendor/client/receivables panels (~25 min)
- **Files:** `lib/analytics/vendorAnalytics.ts`, `clientAnalytics.ts`, `receivables.ts`, `components/dashboard/VendorPanel.tsx`, `ClientPanel.tsx`, `ReceivablesPanel.tsx`. Mount on dashboard.
- **Smoke:** Top 5 vendors/clients listed; ≥1 overdue receivable on demo data.
- **Deps:** 5.3.

### 5.5 — Empty/loading/error state polish (~20 min)
- **Files:** `components/ui/SkeletonChart.tsx`, `SkeletonTable.tsx`, `app/error.tsx`, `app/not-found.tsx`, `app/(app)/error.tsx`. Audit all 5 protected pages against [PRD §15.5–§15.7](prd/07-ui-ux.md).
- **Smoke:** Network unplugged → graceful error toast + retry. Empty data → no broken charts.
- **Deps:** 5.4.

### 5.6 — Demo data seed CSVs + "Try sample data" CTA (~25 min)
- **Files:** `lib/demo-data/sample_bank_statement.csv` (90-day HDFC, engineered anomalies + Amazon NEFT inflows = settlement total – ₹960), `sample_amazon_settlement.csv` (V2, 6 refunds with `Commission Reversal=0`), `sample_flipkart_settlement.csv` (clean), `lib/demo-data/loadDemoData.ts`, `app/api/demo-data/route.ts`. Extend `Step4Recap.tsx` + `EmptyDashboard.tsx`.
- **Smoke:** Brand-new account → click button → 60s → dashboard fully loaded with ₹960 discrepancy.
- **Deps:** 5.5.

### 5.7 — Landing page upgrade (~25 min)
- **Files:** `app/page.tsx` (replace placeholder), `components/landing/Hero.tsx`, `FeatureGrid.tsx`, `Footer.tsx`.
- **Smoke:** Loads <2s, looks designed, CTA → `/auth/signup`.
- **Deps:** 5.6.

### 5.8 — Vercel deploy (~20 min)
- **Files:** none (deploy via Vercel UI or `pnpm dlx vercel`).
- **External steps:** add Vercel URL `https://<vercel>.vercel.app/auth/callback` to (a) Supabase Auth allow-list, (b) Google OAuth redirect URIs, (c) GitHub OAuth callback. Set all env vars in Vercel project settings.
- **Pre-flight:** `pnpm build` must pass locally first per [PRD §19.1](prd/10-risks-demo.md).
- **Smoke (final):** Open Vercel URL incognito → sign in with Google → onboard → "Try sample data" → dashboard → upload Amazon settlement → ₹960 discrepancy → generate PDF. **Commit + tag `v1.0`**.
- **Deps:** 5.7.

---

## Critical files (high blast radius — touch with care)

- `db/schema.ts` — every layer reads/writes through it (defined in 1.2, never re-defined)
- `lib/openrouter/client.ts` — single AI gateway (3.1)
- `lib/categorization/categorize.ts` — orchestrator (3.3, extended in 3.4)
- `lib/reconciliation/matchSettlements.ts` — core of demo wow-moment (4.4)
- `app/api/upload/route.ts` — entry point for bank statements + settlements (2.2, extended in 4.3)

---

## Verification / end-to-end test plan

**Per-layer smoke tests** (mirror [PRD §16.5](prd/08-engineering.md)):
- Layer 1: signup → onboarding → empty dashboard works for all 3 auth providers
- Layer 2: upload CSV → uncategorized transactions in table, sortable/filterable
- Layer 3: upload CSV → 60–120s → categorized + channel-tagged + GST-mapped
- Layer 4: upload Amazon settlement → reconciliation discrepancy panel
- Layer 5: click "Generate Report" → PDF downloads correctly

**Final end-to-end (Phase 5.8 acceptance — the demo arc):**
1. Open Vercel URL incognito
2. Sign in with Google → land on `/onboarding`
3. Complete 4-step wizard → land on dashboard (empty state)
4. Click "Try sample data" → wait 60s → dashboard fully populated
5. Verify: KPI tiles show numbers, cash flow chart renders 90 days, channel split donut, ≥3 anomalies in panel
6. Navigate to `/app/upload` → drop Amazon settlement CSV (or it's already loaded)
7. Reconciliation page shows "Amazon owes you ₹960 across 6 disputed orders" with Claude explanations
8. Click "Generate Report" → PDF downloads with all sections
9. Open `/app/reports` → GSTR-3B view populated, copy buttons work, Excel export downloads

If all 9 steps pass on production URL: ship. Tag `v1.0`. Record backup screen capture per [PRD §20.3](prd/10-risks-demo.md).

---

## Discipline reminders (lifted from CLAUDE.md)

- **No layer skipping.** Each layer is complete before next starts. Bug found in earlier layer → fix only if blocking; else log for Layer 5.
- **No package outside the locked stack** without explicit user approval.
- **Service role key + OpenRouter key are server-only** — never imported in `'use client'` files.
- **RLS on every business-scoped table.** No exceptions.
- **Route handlers ONLY parse + validate + call services.** Services own DB access. Components never call APIs directly — always through hooks.
- **File headers required** on every file >20 lines (per CLAUDE.md §"File Headers").
- **Tagged loggers, no `console.log`** ever.
- **Commit at end of each layer** with smoke test passed.
