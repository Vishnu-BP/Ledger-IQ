# CLAUDE.md — LedgerIQ

> AI-powered financial autopilot for Indian small businesses.
> Single Next.js 14 App Router app: frontend + API routes + DB in one repo.
> Goal: Hackathon-winning project that demonstrates end-to-end AI financial intelligence — bank statement ingestion, two-tier LLM categorization, marketplace reconciliation, GST compliance, audit-ready reports.

> **Read the relevant PRD section before starting work.** The PRD is the canonical product spec, split into focused sections under [docs/prd/](docs/prd/). This document is the operational manual for *how* the codebase is built and modified.

---

## PRD Reference Map — read the matching section before working on an area

The PRD is split into 12 files under [docs/prd/](docs/prd/). Index: [docs/ledger-iq-prd.md](docs/ledger-iq-prd.md). Don't read all of them — read what's relevant.

| Working on... | Read first |
|---|---|
| Anything (always — for product context) | [00 — Overview](docs/prd/00-overview.md) |
| New feature, user flow, journey | [01 — Features & User Journeys](docs/prd/01-features.md) |
| Architecture, folder layout, subsystem boundaries | [02 — Architecture (HLD + LLD)](docs/prd/02-architecture.md) |
| Database schema, migrations, RLS, Drizzle models | [03 — Database](docs/prd/03-database.md) |
| Route handlers, request/response shapes | [04 — API](docs/prd/04-api.md) |
| OpenRouter, prompts, model selection, cost | [05 — AI Integration](docs/prd/05-ai-integration.md) |
| Categorization, reconciliation, anomaly logic | [06 — Algorithms](docs/prd/06-algorithms.md) |
| Pages, components, design tokens, empty/loading/error states | [07 — UI/UX](docs/prd/07-ui-ux.md) |
| Coding conventions, SOLID, package choices | [08 — Engineering & Tech Stack](docs/prd/08-engineering.md) |
| Sequencing work; deciding what's in/out for the current session | [09 — Build Plan](docs/prd/09-build-plan.md) |
| Demo prep, risk planning, fallback strategy | [10 — Risks & Demo](docs/prd/10-risks-demo.md) |
| Vision pitch, terminology lookup | [11 — Roadmap & Glossary](docs/prd/11-roadmap-glossary.md) |

> **If a request conflicts with the PRD or this file → flag it.** Do not proceed silently.

---

## Commands

```bash
# Development
pnpm dev                          # Start Next.js dev server (localhost:3000)
pnpm build                        # Production build (Next.js)
pnpm start                        # Run production build locally
pnpm typecheck                    # TypeScript check (tsc --noEmit)

# Database
pnpm db:generate                  # Generate Drizzle migration from schema diff
pnpm db:migrate                   # Apply migrations to Supabase
pnpm db:seed                      # Seed gst_categories + demo data
pnpm db:studio                    # Open Drizzle Studio (DB browser)

# Linting (defer to Layer 5 — install only if time permits)
pnpm lint                         # ESLint (Next.js default config)
```

> **Not yet wired up** (defer to Layer 5 polish or post-hackathon):
> - Vitest / Playwright — no automated tests in hackathon scope. Manual smoke tests only (see PRD §16.5).
> - Sentry — log errors to console only during build. Wire up in Phase 2.

---

## Tech Stack — USE ONLY THESE

**Framework:** Next.js 14 (App Router), React 18, TypeScript (strict)

**Styling:** Tailwind CSS, shadcn/ui, lucide-react (icons)

**Database & Auth:** Supabase (Postgres + Auth + Storage), Drizzle ORM, drizzle-kit

**AI:** OpenRouter (single gateway), `openai` npm package (OpenRouter is OpenAI-compatible)
- Llama 3.3 70B → bulk categorization
- Claude Sonnet 4.6 → edge cases, anomaly explanations, reconciliation reasoning, executive summaries
- Gemini Flash → fallback if Llama is rate-limited

**Data Processing:** papaparse (CSV), pdf-parse (Layer 5 stretch only), Zod (validation), date-fns (dates)

**UI Data:** TanStack Query (server state), Recharts (charts), react-hook-form + Zod (forms)

**Output:** @react-pdf/renderer (PDF reports), xlsx / SheetJS (Excel exports)

**Notifications:** sonner (toasts)

**Infra:** Vercel (deploy at end), GitHub (version control)

**NEVER use without explicit approval:**
Express, FastAPI, Prisma, Redux, MUI, Styled Components, MongoDB, Passport.js, NextAuth/Auth.js, LangChain, Tesseract, Puppeteer, Socket.io, Redis, Docker, or any package not listed above.

---



**Rules:**
- `NEXT_PUBLIC_*` prefix ONLY for non-sensitive values exposed to browser
- `SUPABASE_SERVICE_ROLE_KEY` and `OPENROUTER_API_KEY` are server-only — never imported in `'use client'` files
- Validate env vars at startup via Zod schema in `lib/env.ts`

---

## Architecture

### System Flow

```
Next.js 14 App Router (React Server Components + Client Components)
    ↕ HTTP (App Router Route Handlers)
Server Actions / Route Handlers (TypeScript + Zod)
    ↕ SQL via Drizzle ORM
Supabase PostgreSQL (RLS enforced, every business-scoped table)
    ↕ Supabase Storage (uploaded CSVs/PDFs)
    ↕ OpenRouter (Llama 3.3 + Claude Sonnet + Gemini Flash)
```

### Data Flow — NEVER skip layers

```
Page/Component → Hook (TanStack Query) → API Client (fetch wrapper)
  → Route Handler (/app/api/*)
  → Zod validation
  → Supabase auth check (getUser)
  → Business ownership check
  → Service function (lib/*)
  → Drizzle query
  → Postgres (RLS)
  → Response flows back
```

- Route Handlers ONLY parse requests, validate, and call services
- Services ONLY contain business logic — NO HTTP/Next awareness
- Services are the ONLY layer that talks to the database via Drizzle
- Components NEVER call APIs directly — always through hooks

### Layered Build Discipline

The build proceeds in 5 layers (see [09 — Build Plan](docs/prd/09-build-plan.md)). **Each layer must ship a working product before the next begins.**

| Layer | Delivers | Demoable as |
|---|---|---|
| 1 — Skeleton | Auth + onboarding + empty dashboard | "Working SaaS shell" |
| 2 — Foundation | CSV upload + parse + transactions table (uncategorized) | "Financial data ingestion tool" |
| 3 — Intelligence | Two-tier AI categorization + channel + GST | "AI auto-categorizer" |
| 4 — Differentiator | Dashboard + anomalies + marketplace reconciliation ⭐ | "AI catches Amazon under-payments" |
| 5 — Polish | Reports (PDF/Excel) + GSTR-3B + landing + demo data | "Production-quality fintech product" |

**Rules:**
- No layer is skipped to come back to. Each layer is complete before next starts.
- Polish stays in Layer 5. Don't beautify Layer 1's landing before Layer 2 starts.
- Bug found in earlier layer → fix only if blocking. Otherwise log for Layer 5.
- Each layer maps to one Claude Code session (mostly).

### State Management

| Data | Tool | Never... |
|---|---|---|
| Server data (API responses) | TanStack Query | ...put in component state long-term |
| UI state (modals, toggles) | React useState / useReducer | ...store server data here |
| Form inputs | React Hook Form | ...manage manually with useState |
| Derived data | Compute inline | ...store separately |
| URL state (filters, periods) | Next.js searchParams | ...duplicate in stores |
| Auth/session | Supabase client (`useUser` hook) | ...store JWT manually |

> **Note:** Unlike WorkNest, LedgerIQ does NOT use Zustand. Next.js Server Components + TanStack Query handle the surface area sufficiently for this build window. Adding Zustand is unjustified scope.

### TanStack Query Conventions

Query key factory per resource (exported for invalidation):

```typescript
export const transactionKeys = {
  all: ['transactions'] as const,
  byBusiness: (businessId: string) =>
    [...transactionKeys.all, businessId] as const,
  byPeriod: (businessId: string, start: string, end: string) =>
    [...transactionKeys.byBusiness(businessId), { start, end }] as const,
  detail: (txnId: string) => ['transaction', txnId] as const,
}
```

Stale times: business profile = long (10min), transactions = medium (60s), dashboard aggregates = short (30s).

Invalidation sources: mutation `onSuccess`, after upload completes, after categorization completes, after user override.


**Rules:**
- `app/` route handlers NEVER import from `db/` directly — always through `lib/* services`
- `components/` NEVER imports from `app/api/*` — use hooks via `lib/hooks/*`
- Feature components (`dashboard/*`) NEVER import from other features (`reconciliation/*`)
- `'use client'` files NEVER import server-only modules (`lib/supabase/server.ts`, `lib/openrouter/client.ts`)

### Multi-Tenancy

- Every business-scoped table has `business_id`. Every query filters by it.
- A user can have ONE business in hackathon scope (multi-business is Phase 2).
- `business_id` resolution: from authenticated user → `businesses.user_id` lookup → cached in route handler context.

### Three-Layer Auth

1. **Frontend:** Hide UI by auth state (cosmetic — middleware handles real protection)
2. **Next.js middleware (`middleware.ts`):** Verify Supabase session, redirect unauthenticated requests, route-protect `/app/*` and `/onboarding`
3. **Database RLS:** Enforce business-scoped data isolation (safety net — even if backend is compromised, users can't access others' data)

### Error Resilience

- **Isolated try/catch** — one categorization failure for one transaction never blocks the rest of the batch
- **Graceful degradation** — LLM rate-limited? Fall back to rule-based categorization. PDF parse fails? Show "use CSV instead" message. Reconciliation fails? Dashboard still works.
- **Retry with backoff** for OpenRouter calls — never retry 401/403/400
- **Centralized error handler** in route handlers — return consistent JSON `{ error: { code, message } }`
- **Global API error handling in `lib/api.ts`:**
  - 401 → redirect to `/auth/login`
  - 403 → toast "No permission"
  - 429 → toast "Rate limited, try again in a moment"
  - 500 → toast "Something went wrong" + log to console
- **Toast system:** `sonner` for all user-facing notifications

### Optimistic Updates — ONLY for:

User category overrides (instant feedback when changing a category in the table). Everything else uses normal loading states.

### Design Principles

**Write code like a senior engineer. Every file must be:**
- **Understandable** — someone new should read it and get it without asking
- **Scalable** — easy to extend without modifying existing code
- **Maintainable** — clear structure, comments where needed, no magic numbers
- **Properly commented** — explain WHY, not WHAT (code shows what)

**Pragmatic SOLID** (apply spirit, not ceremony):

- **Single Responsibility** — one file, one job. `bankStatementParser.ts` only parses. `categorize.ts` only categorizes. No file does multiple unrelated things.
- **Open/Closed** — new bank parsers added as new files in `lib/parsers/`, not by modifying existing parsers. Same for new marketplace settlement formats.
- **Liskov / Interface Segregation** — TypeScript interfaces for all service boundaries. `LLMClient` interface implemented by `openrouter/client.ts` — could be swapped for any provider.
- **Dependency Inversion** — high-level modules (categorization pipeline) depend on abstractions (`LLMClient` interface), not concrete implementations.

**Other principles:**

- **Separation of Concerns** — route handlers handle HTTP, services handle logic, Drizzle handles data. Never mix layers.
- **Defense in Depth** — three auth layers (middleware → service ownership check → RLS). No single point of failure.
- **Fail Gracefully** — if a non-critical service breaks (LLM, OCR), the app continues with reduced functionality, never crashes.
- **Composition over Inheritance** — small components composed together, no class hierarchies.
- **DRY** — shared types in `/types`, shared validation via Zod, barrel exports for reuse.
- **AI is the product, not a feature** — every layer reasons about user data; AI calls are first-class, not afterthoughts.

---

## Coding Standards — Apply to EVERY file

### File Headers

Every file > 20 lines MUST start with:

```typescript
/**
 * @file filename.ts — one-line purpose
 * @module lib/categorization | app/api/upload | components/dashboard | etc.
 *
 * 2-3 sentences: what it does, why it exists, its architectural role.
 *
 * @dependencies key external deps (e.g., OpenRouter, papaparse, Drizzle)
 * @related related files (e.g., lib/openrouter/client.ts, db/schema.ts)
 */
```

Optional on barrel `index.ts` re-exports.

### Section Separators

Files over 50 lines use:

```typescript
// ─── Types ─────────────────────────────────────────────────
// ─── Helpers ───────────────────────────────────────────────
// ─── Main Function ─────────────────────────────────────────
```


### Tagged Loggers — No raw `console.log`. Ever.

```typescript
import { createLogger } from '@/lib/logger'
const log = createLogger('CATEGORIZE')
log.info('Batched 20 transactions for Llama', { count: 20 })
log.warn('Low confidence on transaction', { id, score })
log.error('OpenRouter call failed', { error })
```

**Tags:** `AUTH`, `API`, `UPLOAD`, `PARSER`, `CATEGORIZE`, `RECONCILE`, `ANOMALY`, `GST`, `REPORT`, `DB`, `LLM`, `MW`, `UI`.

### Barrel Exports

Every folder with a public API gets an `index.ts`. Import from barrel, never internal files.

```typescript
// lib/categorization/index.ts
export { categorizeTransactions } from './categorize'
export { confidenceThreshold } from './confidenceThresholds'
export type { CategorizationResult } from './types'
```

### TypeScript

- `strict: true` — no exceptions
- No `any` — use `unknown` and narrow with type guards or Zod parse
- No `@ts-ignore` without a `// WHY:` comment explaining the unavoidable reason
- Explicit return types on all exported functions
- `import type` for type-only imports
- Zod schemas double as TS types via `z.infer<typeof schema>`

### Import Order

1. External libs (`react`, `next`, `zod`)
2. `@/types/*`
3. `@/lib/*`
4. `@/components/*`
5. Relative imports (max 2 levels: `../../` is the limit)
6. Type-only imports last (when grouped separately)

### File Size Limits

- Pages: 150 lines (extract to components if larger)
- Components: 150 lines
- Route handlers: 100 lines (extract to services)
- Services / lib: 200 lines
- Utilities: 150 lines

Split before exceeding. Refactor into smaller modules with single responsibilities.

### Comments

Explain WHY, not WHAT. Never reference refactoring history.

```typescript
// ❌ Bad
// Loop through transactions and categorize each one
for (const txn of transactions) { ... }

// ✅ Good
// Process in batches of 20 to stay under OpenRouter's per-call token budget
// and to enable partial success — one batch failing doesn't block others.
for (const batch of chunks(transactions, BATCH_SIZE)) { ... }
```

### Code Discipline

- **Reuse before creating** — search codebase first (e.g., a `formatCurrency` utility likely already exists)
- **File deletion** — allowed during hackathon (pre-deployment). Post-deployment: rename with `_DEPRECATED` suffix
- **Simplicity over cleverness** — readable > clever. No bit tricks, no array reduce when a for-loop is clearer
- **No magic numbers** — named constants in `lib/constants.ts` or feature-local `constants.ts`
- **No default exports** — named exports only (except for Next.js page/layout/route files where the framework requires default)
- **Isolated try/catch** — one failure never crashes another
- **File headers** required on all files > 20 lines

---

## Workflow

1. **Read the relevant PRD section first** — see the PRD Reference Map at the top of this file. The index lives at [docs/ledger-iq-prd.md](docs/ledger-iq-prd.md), sections under [docs/prd/](docs/prd/)
2. Read this file (`CLAUDE.md`) — operational manual
3. Read the task fully before writing any code
4. Write a plan to `tasks/todo.md` with a checklist
5. **STOP and wait for approval** before coding
6. Implement one item at a time, marking each done
7. After each step, explain what changed and why
8. Keep changes minimal — simplicity is key
9. Never delete completed work from `tasks/todo.md` — move to "Completed Work Log" section

**If ambiguous → ASK.** Do not assume.
**If it conflicts with this file or any PRD section → FLAG IT.** Do not proceed.

### Layer Discipline (CRITICAL for hackathon)

When working on Layer N:
- ✅ DO build everything Layer N specifies
- ❌ DO NOT add features from Layer N+1 because they "seem easy"
- ❌ DO NOT polish UI beyond functional during Layers 1-4
- ❌ DO NOT add features not in PRD without explicit user approval
- ✅ At end of layer: commit, smoke test, then proceed


## AI Integration Quick Reference

**Single gateway:** OpenRouter (one API key for all models)

**Two-tier categorization:**
1. **Llama 3.3 70B** — bulk pass, batches of 20 transactions, ~$0.0005/txn
2. **Claude Sonnet 4.6** — edge-case pass, only for confidence < 0.85, ~$0.005/call

**Other AI uses:**
- Claude Sonnet 4.6 → anomaly explanations (per anomaly)
- Claude Sonnet 4.6 → reconciliation discrepancy reasoning (per discrepancy)
- Claude Sonnet 4.6 → audit report executive summary (once per report)

**Total per typical demo run (200 txns):** ~$0.26

**Rules:**
- All LLM calls go through `lib/openrouter/client.ts` — never call OpenRouter directly from a route handler or component
- Prompts live in `lib/openrouter/prompts.ts` as named exports
- Never inline prompts in business logic files
- Always validate LLM response with Zod before using
- LLM call failure → fall back to rule-based categorization, log warning, continue
- Cache categorization results in DB. **Never re-categorize on render.** Re-categorize only on user request or on new upload.


---



**End of CLAUDE.md**
