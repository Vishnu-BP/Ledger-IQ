# Tasks — LedgerIQ Hackathon Build

> Workflow log per [CLAUDE.md §Workflow](../CLAUDE.md). One in-progress item at a time. Mark items done as completed; never delete — move to "Completed Work Log" at the bottom.

---

## Pending Manual Setup (do these before the stage that needs them)

- [ ] **Verify before testing OAuth (any time)** — Supabase Dashboard → Authentication → URL Configuration: ensure `http://localhost:3000/auth/callback` is in the "Redirect URLs" allow-list. New projects usually have it; double-check before clicking Google/GitHub buttons.
- [ ] **OTP email templates (required for passwordless OTP login)** — Supabase Dashboard → Authentication → Emails → update BOTH templates ("Confirm signup" + "Magic Link") so the body uses `{{ .Token }}` instead of `{{ .ConfirmationURL }}`. Suggested body:
  ```html
  <h2>Your LedgerIQ sign-in code</h2>
  <p>Enter this 6-digit code to sign in:</p>
  <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; padding: 12px 0;">{{ .Token }}</p>
  <p>This code expires in 1 hour. If you didn't request this, you can ignore the email.</p>
  ```
  Both templates need updating because Supabase routes new emails through "Confirm signup" and returning emails through "Magic Link". Subjects can stay as-is.
- [x] ~~**Before stage 2.2** — Create private Supabase Storage bucket named `statements`.~~ **Done in Stage 2.2 via MCP `apply_migration`** (no manual Studio click needed). Bucket + 3 RLS policies on storage.objects deployed.
- [ ] **Before stage 5.8** — Add Vercel deploy URL to (a) Supabase Auth allow-list, (b) Google OAuth redirect URIs, (c) GitHub OAuth callback. Set all 6 env vars in Vercel project settings.

## Environment Notes

- **pnpm:** installed as user shim at `~/bin/pnpm` + `~/bin/pnpm.cmd` because admin install to `C:\Program Files\nodejs\` was blocked. Real binary lives in `%LOCALAPPDATA%\pnpm\.tools\pnpm-exe\10.33.2\pnpm.exe`. Works for this build; for cleanest setup, run `winget install pnpm` from an admin terminal post-build.
- **Database:** using Supabase transaction pooler URL for both runtime and Drizzle migrations. If migrations fail, switch to direct connection (port 5432, host `db.<ref>.supabase.co`).

---

## Active Stage

**Stage 2.4.5 — Basic dashboard (interim)** (complete — Layer 2 ready for commit + push)

Substeps:
- [x] Rewrite src/app/(app)/dashboard/page.tsx as RSC: 5 parallel Drizzle queries (statementCount, transactionCount, 30d inflow, 30d outflow, recent 5)
- [x] Layout: business name welcome → first-run EmptyState OR (4 stat cards + recent transactions list + Upload/View-all CTAs) → footer with email + visible SignOutButton
- [x] Inline `<StatCard>` helper (KpiTile extraction is Stage 4.1's job per PRD §10.1)
- [x] Smoke: typecheck = 0, lint = 0, /app/dashboard logged-out = 307 with redirect param

## Layer 2 — Foundation: complete, ready to commit

All five sub-stages done:
- 2.1 Upload UI ✓
- 2.2 /api/upload + Storage + dedup ✓
- 2.3 Bank statement parser (HDFC + ICICI) ✓
- 2.4 Transactions table + edit/delete ✓
- 2.4.5 Basic dashboard with stats + sign-out ✓

Awaiting user approval to commit + push as `layer-2-foundation`.

Substeps:
- [x] Apply migration `storage_statements_bucket` via MCP — creates private bucket + 3 RLS policies (insert/select/delete scoped to business folder)
- [x] Verify bucket: `storage.buckets` row exists, public=false, file_size_limit=10MB
- [x] Write src/lib/supabase/admin.ts (service-role client; `import "server-only"` enforces server-side use)
- [x] Update src/lib/supabase/index.ts barrel — exports admin client + cleans up the leftover `./` imports from the restructure pass
- [x] Write src/lib/storage/supabaseStorage.ts (`uploadStatementFile()` writes to `<business_id>/<file_hash>.csv`, throws StorageError) + barrel
- [x] Write src/lib/uploads/computeFileHash.ts (SHA-256 hex)
- [x] Write src/lib/uploads/uploadStatement.ts (orchestrator: hash → dedup check → Storage upload → INSERT statements row; throws DuplicateUploadError) + barrel
- [x] Write src/app/api/upload/route.ts (POST handler with auth → file shape → type slug → service call; maps errors to 400/401/403/409/413/501/500 with consistent `{error:{code,message}}` body)
- [x] Smoke (typecheck = 0, lint = 0, dev server live):
  - POST empty body → 400 invalid_request
  - POST with file no auth → 401 unauthorized
  - POST with file + amazon_settlement no auth → 401 (auth check before type check)
  - (manual: POST with auth + bank_statement → 200; same file twice → 409 dup)
- [ ] Manual test: log in → /onboarding → finish wizard → /app/dashboard → Upload sidebar → drop test.csv → toast "Upload received" + statements row appears in MCP query

---

## Upcoming Stages (per docs/initial-implementation-plan.md)

- 1.2 Drizzle + Supabase schema (~40 min)
- 1.3 Supabase clients + middleware (~25 min)
- 1.4 Auth flows (email + Google + GitHub OAuth) (~35 min)
- 1.5 Onboarding wizard (~30 min)
- 1.6 App shell + empty dashboard (~25 min) → **Layer 1 commit `layer-1-skeleton`**
- 2.1–2.4 Foundation: upload + parse + transactions table → **Layer 2 commit**
- 3.1–3.5 Intelligence: OpenRouter + categorization + GST + override UI → **Layer 3 commit**
- 4.1–4.4 Differentiator: dashboard + anomalies + reconciliation → **Layer 4 commit (HERO)**
- 5.1–5.8 Polish: GSTR-3B + PDF + Excel + panels + demo data + Vercel → **v1.0 tag**

---

## Completed Work Log

### Stage 1.1 — Project scaffold ✅ (2026-04-27)
- Next.js 14 App Router + TS strict + Tailwind + shadcn baseline (Slate / New York)
- 10 shadcn UI primitives installed (button, input, card, dialog, dropdown-menu, label, select, sonner, table, tabs)
- TanStack Query + sonner Toaster wired in providers
- Zod env validation in lib/env.ts; tagged logger in lib/logger.ts (13 subsystem tags)
- pnpm shim at `~/bin/pnpm` (user-space install — no admin)
- git init done, no commits yet (commits at end of layer)
- Smoke: typecheck ✓, dev server boots ✓, localhost:3000 renders placeholder ✓

### Stage 1.2 — Drizzle + Supabase schema ✅ (2026-04-27)
- Drizzle ORM + drizzle-kit + postgres-js + tsx + dotenv installed
- db/schema.ts: all 10 tables (8 business-scoped + businesses + gst_categories) verbatim from PRD §11
- db/migrations/0000_init.sql generated by drizzle-kit, hand-augmented with 3 transactions indexes + RLS on all 10 tables
- Applied via MCP apply_migration to project jmdlumtmuiqmcdddomwn (Ledger IQ only — Worknest untouched)
- db/seed.ts: 37 GST categories across 6 sections (Outward Supplies, ITC - Goods, ITC - Services, Capital Goods, Blocked ITC, Exempt)
- Verified: list_tables = 10, all rls_enabled, count(gst_categories) = 37, get_advisors security lints = 0, typecheck = 0 errors

### Stage 1.3 — Supabase clients + middleware ✅ (2026-04-27)
- @supabase/supabase-js + @supabase/ssr installed
- lib/supabase/{client,server,middleware,index}.ts wired (getAll/setAll cookie pattern, getUser-based session refresh)
- Root middleware.ts protects /app/*, /onboarding; redirects authenticated users away from /auth/login + /auth/signup
- Verified redirects: / → 200, /app/dashboard logged out → 307 to /auth/login?redirect=, /onboarding logged out → 307 to /auth/login?redirect=
- Typecheck = 0 errors

### Stage 1.4 — Auth flows ✅ (2026-04-27)
- react-hook-form + @hookform/resolvers installed
- /auth/login + /auth/signup: shadcn Card with OAuth buttons (Google custom SVG, GitHub from lucide) above email auth form
- **Switched email auth to passwordless OTP (Option B)** mid-stage at user's request:
  - Replaced LoginForm.tsx + SignupForm.tsx with single EmailOtpForm.tsx (two-stage: email entry → OTP entry)
  - Stage 1: signInWithOtp({ email, shouldCreateUser: true }) — Supabase routes to either "Confirm signup" or "Magic Link" template depending on returning vs new
  - Stage 2: verifyOtp({ email, token, type: 'email' }) → session set → router.push to ?redirect= or /onboarding
  - Same component used for both /auth/login and /auth/signup; Supabase auto-detects new vs returning
- OAuth callback at /auth/callback: exchangeCodeForSession → routes by business existence (→ /onboarding or /app/dashboard) or echoes error to /auth/login?error=
- lib/auth/getCurrentBusiness.ts: single helper joining auth.getUser + Drizzle businesses lookup
- Verified: /auth/login = 200, /auth/signup = 200, /auth/callback w/o code = 307 to /auth/login?error=missing_code, typecheck = 0
- User completed manual smoke test: 1 row in auth.users confirms OTP flow round-trips successfully
- Manual setup required: update both Supabase email templates with `{{ .Token }}` body (see "Pending Manual Setup" section)

### Stage 1.5 — Onboarding wizard ✅ (2026-04-27)
- shadcn checkbox component added
- lib/onboarding/{constants,schema}.ts: BUSINESS_TYPES (6), INDIAN_STATES (36), SALES_CHANNELS (6), BANKS (6), FISCAL_YEAR_MONTHS (12), GSTIN_REGEX, Zod schema shared by client + server
- lib/businesses/createBusiness.ts: auth check + one-business-per-user uniqueness + Drizzle insert; throws UnauthenticatedError / BusinessAlreadyExistsError
- POST /api/onboarding: Zod validate + call service + map errors to 400/401/409/500 with `{ error: { code, message } }`
- 4-step wizard: Step1Basics, Step2TaxIdentity, Step3ChannelsBank, Step4Recap with single shared useForm + per-step form.trigger validation
- /onboarding RSC: redirects to /auth/login if no auth, /app/dashboard if business exists, else renders wizard
- Verified: /onboarding logged-out = 307, POST /api/onboarding no-auth = 401, malformed JSON = 400, missing fields = 400

### Stage 1.6 — App shell + empty dashboard ✅ (2026-04-27)
- components/ui/EmptyState.tsx: reusable empty-state slot with icon + title + description + CTA
- components/shell/{Sidebar,Header,SignOutButton}.tsx: 5 nav items with active-route highlighting, business-name header, signOut → router.push('/')
- app/(app)/layout.tsx: RSC gate — getCurrentBusiness → redirect to /onboarding if no business → render shell
- 5 protected page stubs (dashboard/transactions/upload/reconciliation/reports) each with intent-appropriate empty state
- Bug fix: EmailOtpForm default redirect changed from /app/dashboard → /onboarding (handles new + returning via onboarding's own gate)
- Verified: typecheck = 0, all 5 /app/* logged-out = 307 with correct ?redirect=, /, /auth/login = 200

### Stage 1.6.5 — Code restructure: /src + @/ aliases ✅ (2026-04-27)
- 49 source files moved under src/; root reserved for configs + docs + tasks
- Configs updated: tsconfig paths (@/* → ./src/*), tailwind content (single ./src/** glob), drizzle.config schema/out, components.json css, package.json db:seed
- 10 sibling relative imports rewritten to @/ (CSS stays relative)
- 3 missing lib barrels added: src/lib/{auth,businesses,onboarding}/index.ts
- PRD §10.1 (docs/prd/02-architecture.md) updated to show src/-based layout + Layer 1 deviation note
- Verified: typecheck = 0, full curl smoke matrix passes, db:seed re-runs idempotently (37 rows preserved), MCP list_tables confirms 10 tables + RLS, DB untouched

### Layer 1 commit + GitHub push ✅ (2026-04-27)
- .eslintrc.json added (next/core-web-vitals) — `pnpm lint` = 0 warnings/errors
- Commit: e11ab2e "Layer 1 — Skeleton: auth + onboarding + app shell (src/ layout)"
- Branch master → main, remote https://github.com/Vishnu-BP/Ledger-IQ.git, pushed to origin/main
- 86 files committed; .env.local, .mcp.json, .claude/, node_modules/ correctly excluded

### Stage 2.1 — Upload page UI ✅ (2026-04-27)
- shadcn primitives added: progress + radio-group (Radix transitive deps)
- src/components/upload/{FileDropzone,UploadProgress,UploadTypeSelector,index}.tsx — drag/drop with .csv + 10 MB validation, fake-animated progress (0→90 during isPending, 100 on settle), 3-option radio selector
- src/lib/hooks/{useUpload,index}.ts — TanStack Query mutation (FormData POST to /api/upload, throws on non-2xx, parses `{error:{message}}` body for friendly toast)
- src/app/(app)/upload/page.tsx — replaces empty state with live upload card; toasts terminal state via sonner; "Upload another file" reset
- Verified: typecheck = 0, lint = 0, /app/upload logged-out = 307, POST /api/upload = 404 (stage 2.2's job)

### Stage 2.2 — POST /api/upload + Storage + dedup ✅ (2026-04-27)
- MCP migration `storage_statements_bucket` — private bucket (10 MB, CSV mime types) + 3 RLS policies on storage.objects scoping insert/select/delete to business folder
- src/lib/supabase/admin.ts — service-role client with `import "server-only"` guard
- src/lib/storage/supabaseStorage.ts — `uploadStatementFile()` writes to `<business_id>/<file_hash>.csv`
- src/lib/uploads/{computeFileHash,uploadStatement,index}.ts — orchestrator: hash → dedup → Storage → INSERT statements
- src/app/api/upload/route.ts — multipart parse → auth → file shape (.csv, ≤10 MB) → type slug → service; maps errors to 400/401/403/409/413/501/500
- Verified: typecheck = 0, lint = 0, all error paths via curl (400/401), bucket exists in storage.buckets

### Stage 2.3 — Bank statement CSV parser ✅ (2026-04-28)
- papaparse + @types/papaparse + date-fns installed
- src/types/transaction.ts — Drizzle-inferred Transaction / TransactionInsert
- src/lib/parsers/{types,amounts,formats/{hdfc,icici},bankStatementParser,index}.ts — header-signature dispatch, Indian-formatted number parsing, ParseError with code enum
- Extended uploadStatement to parse inline + bulk-insert transactions + advance status (uploaded → parsing → parsed | error)
- Route handler maps ParseError → 422 (file persisted, DB row in 'error' status with parse_error populated)
- Verified: typecheck = 0, lint = 0, error paths via curl

### Stage 2.4 — Transactions table page ✅ (2026-04-28)
- shadcn alert-dialog + badge added
- src/lib/transactions/{channels,listTransactions,updateTransaction,deleteTransaction,index}.ts — 10-channel enum + 3 services + TransactionNotFoundError
- GET /api/transactions (Zod-validated date/search/category/channel filters) + PATCH /api/transactions/[id] (auto user_overridden=true) + DELETE /api/transactions/[id]
- src/lib/hooks/{useTransactions (60s staleTime), useUpdateTransaction (optimistic — only allowed case), useDeleteTransaction}
- lib/utils.ts: formatINR (Intl en-IN, ₹) + formatDate
- src/components/transactions/{TransactionFilters,EditCategoryModal,TransactionRow,TransactionTable,index}.tsx — URL-synced filters, optimistic edits, AlertDialog delete confirm, "Awaiting AI" pills for NULL Layer-3 fields
- /app/transactions RSC: fetches gst_categories once, passes to client TransactionTable
- Verified: typecheck = 0, lint = 0, GET/PATCH/DELETE no-auth = 401, /app/transactions logged-out = 307
