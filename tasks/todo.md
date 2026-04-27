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
- [ ] **Before stage 2.2** — Create private Supabase Storage bucket named `statements` via Supabase Studio → Storage → New bucket → name `statements` → uncheck "Public bucket".
- [ ] **Before stage 5.8** — Add Vercel deploy URL to (a) Supabase Auth allow-list, (b) Google OAuth redirect URIs, (c) GitHub OAuth callback. Set all 6 env vars in Vercel project settings.

## Environment Notes

- **pnpm:** installed as user shim at `~/bin/pnpm` + `~/bin/pnpm.cmd` because admin install to `C:\Program Files\nodejs\` was blocked. Real binary lives in `%LOCALAPPDATA%\pnpm\.tools\pnpm-exe\10.33.2\pnpm.exe`. Works for this build; for cleanest setup, run `winget install pnpm` from an admin terminal post-build.
- **Database:** using Supabase transaction pooler URL for both runtime and Drizzle migrations. If migrations fail, switch to direct connection (port 5432, host `db.<ref>.supabase.co`).

---

## Active Stage

**Stage 1.6.5 — Code restructure: /src + @/ aliases** (complete — Layer 1 ready for commit)

Substeps:
- [x] Stop dev server on port 3000
- [x] mv app/, components/, db/, lib/, middleware.ts → src/
- [x] Update tsconfig paths (@/* → ./src/*), tailwind content (single ./src/** glob), drizzle.config schema/out, components.json css path, package.json db:seed script
- [x] Rewrite 10 sibling relative imports to @/ (CSS imports stay relative): app/layout, db/seed (3), db/client, lib/onboarding/schema, components/onboarding/OnboardingWizard (4), components/shell/Sidebar
- [x] Add 3 missing lib barrels: src/lib/auth/index.ts, src/lib/businesses/index.ts, src/lib/onboarding/index.ts
- [x] Update PRD §10.1 (docs/prd/02-architecture.md) — new src/-based folder layout + Layer 1 deviation note
- [x] Clear stale .next cache + run typecheck (0 errors)
- [x] Restart dev server, full route smoke matrix passes: /, /auth/{login,signup} = 200; /auth/callback no-code = 307 to login error; all 5 /app/* logged-out = 307 with correct ?redirect=; /onboarding logged-out = 307; POST /api/onboarding empty body = 400 (Zod), valid body no auth = 401
- [x] pnpm db:seed re-runs from src/db/seed.ts cleanly (37 categories, idempotent via onConflictDoNothing)
- [x] MCP list_tables confirms 10 tables, all rls_enabled, gst_categories rows = 37; DB untouched by restructure
- [ ] Layer 1 commit `layer-1-skeleton` pending user approval

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
