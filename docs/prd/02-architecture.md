# 02 — Architecture (HLD + LLD)

> Read this section for: system architecture, subsystem boundaries, folder structure, data flow.
> Cross-references: [03 — Database](03-database.md), [04 — API](04-api.md), [08 — Engineering](08-engineering.md).

Covers:
- High-Level Design (HLD) — system architecture, components, data flow
- Low-Level Design (LLD) — folder structure, data model overview

---

## 9. High-Level Design (HLD)

### 9.1 System architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      USER (Browser)                         │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              NEXT.JS 14 APPLICATION (Vercel/Local)          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  App Router (Pages)                                  │   │
│  │   /  /auth/*  /onboarding  /app/*                    │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Route Handlers (API)                                │   │
│  │   /api/upload  /api/categorize  /api/reconcile       │   │
│  │   /api/anomalies  /api/reports                       │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Server Components + Client Components               │   │
│  │  shadcn/ui · Tailwind · Recharts · react-pdf         │   │
│  └──────────────────────────────────────────────────────┘   │
└──────┬──────────────────┬───────────────────────┬───────────┘
       │                  │                       │
       ▼                  ▼                       ▼
┌──────────────┐  ┌────────────────┐  ┌─────────────────────┐
│   SUPABASE   │  │   OPENROUTER   │  │  Client-side libs   │
│              │  │                │  │                     │
│  • Postgres  │  │  • Claude 4.6  │  │  • papaparse        │
│  • Auth      │  │  • Llama 3.3   │  │  • react-pdf        │
│  • Storage   │  │  • Gemini Flash│  │  • SheetJS          │
│  • RLS       │  │                │  │  • Recharts         │
└──────────────┘  └────────────────┘  └─────────────────────┘
```

### 9.2 Component decomposition

The application is decomposed into seven major subsystems, each with clear responsibility boundaries:

**1. Auth Subsystem**
Handles user signup, login, OAuth flows, session management. Built on Supabase Auth. Exposes hooks (`useUser`) and middleware for route protection.

**2. Onboarding Subsystem**
Multi-step wizard collecting business profile data. Writes to `businesses` table. One-shot flow, only runs for first-time users.

**3. Ingestion Subsystem**
File upload, CSV parsing, validation, deduplication. Writes parsed rows to `transactions` table. Stores raw files in Supabase Storage.

**4. Intelligence Subsystem**
The AI brain. Two-tier categorization, channel tagging, GST mapping, anomaly detection, reconciliation. Mostly server-side. Reads `transactions`, writes `transactions.category/channel/gst_head`, writes `anomalies`, writes `reconciliations`.

**5. Analytics Subsystem**
Computes aggregations: cash flow, channel split, vendor totals, client analytics, GST liability. Pure read operations on categorized data.

**6. Output Subsystem**
GSTR-3B view, PDF generation, Excel export. Client-side rendering of pre-aggregated data.

**7. Dashboard Subsystem**
The main UI shell. Orchestrates all panels (KPI tiles, charts, anomaly list, transaction preview). Handles routing inside `/app/*`.

### 9.3 Data flow — three critical journeys

**Journey A: Bank statement upload**

```
User uploads CSV
  → Frontend reads file, sends to /api/upload
  → API: validates CSV, stores file in Supabase Storage
  → API: parses rows via papaparse
  → API: writes raw transactions to `transactions` (category=NULL)
  → API: triggers /api/categorize asynchronously
  → /api/categorize: batches 20 rows, sends to OpenRouter (Llama)
  → For low-confidence rows, second pass to Claude Sonnet
  → Updates `transactions.category, channel, gst_head, confidence`
  → Frontend polls or subscribes to changes, updates UI
```

**Journey B: Marketplace reconciliation**

```
User uploads settlement CSV
  → Frontend sends to /api/reconcile
  → API: parses settlement rows
  → API: writes to `settlements` and `settlement_lines`
  → API: identifies expected bank credits from settlement totals
  → API: queries `transactions` for matching credits in date range
  → API: computes discrepancies (sum of settlement vs sum of bank credits)
  → For each discrepancy, Claude generates explanation
  → Writes to `reconciliations` table
  → Frontend renders reconciliation panel
```

**Journey C: Report generation**

```
User clicks "Generate Report"
  → Frontend calls /api/reports/summary (returns aggregated JSON)
  → Frontend renders react-pdf component with data
  → Claude generates executive summary narrative (separate API call)
  → react-pdf renders document client-side
  → User downloads PDF
  → For Excel: SheetJS builds workbook from same JSON
```

### 9.4 Tech stack rationale (summary)

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 App Router | Single deployable, Server Components, Vishnu's familiarity |
| Language | TypeScript | Type safety critical for financial data |
| Database | Supabase (Postgres) | Bundles DB + Auth + Storage in one service |
| ORM | Drizzle | TS-native, faster than Prisma, no codegen friction |
| Styling | Tailwind + shadcn/ui | Production-quality components, minimal CSS overhead |
| AI Gateway | OpenRouter | One key for all models, automatic fallback |
| Charts | Recharts | Theme-able, React-native, well-documented |
| PDF | react-pdf | Client-side generation, no Python backend needed |
| Excel | SheetJS | Industry standard, simple API |
| Validation | Zod | Runtime + compile-time type safety |
| Forms | react-hook-form | Multi-step wizard support, plays with Zod |

Detailed stack reasoning is in [08 — Engineering](08-engineering.md).

---

## 10. Low-Level Design (LLD)

### 10.1 Folder structure

All application source lives under `src/`. Configs, docs, and env files stay at the project root. Path alias `@/*` resolves to `./src/*`. Every cross-folder import uses `@/`; CSS imports use a relative path. Every `lib/` feature folder has an `index.ts` barrel — import from the barrel, never the internal file.

```
ledgeriq/
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── page.tsx                      # Landing page (public)
│   │   ├── layout.tsx                    # Root layout
│   │   ├── providers.tsx                 # TanStack Query + Toaster
│   │   ├── globals.css                   # Tailwind base
│   │   │
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── callback/route.ts         # OAuth + magic-link callback
│   │   │
│   │   ├── onboarding/
│   │   │   └── page.tsx                  # 4-step wizard host
│   │   │
│   │   ├── (app)/                        # Protected route group
│   │   │   ├── layout.tsx                # Sidebar + header shell
│   │   │   ├── dashboard/page.tsx        # Home: KPIs, charts, anomalies
│   │   │   ├── transactions/page.tsx     # Categorized transaction table
│   │   │   ├── upload/page.tsx           # File upload UI
│   │   │   ├── reconciliation/page.tsx   # Marketplace recon view
│   │   │   └── reports/page.tsx          # GSTR-3B + PDF/Excel export
│   │   │
│   │   └── api/
│   │       ├── onboarding/route.ts       # POST: create business
│   │       ├── upload/route.ts
│   │       ├── categorize/route.ts
│   │       ├── reconcile/route.ts
│   │       ├── anomalies/route.ts
│   │       └── reports/
│   │           ├── summary/route.ts
│   │           ├── gstr3b/route.ts
│   │           └── narrative/route.ts    # AI executive summary
│   │
│   ├── components/
│   │   ├── ui/                           # shadcn primitives (button, dialog, etc.)
│   │   ├── auth/                         # OAuthButtons, EmailOtpForm
│   │   ├── onboarding/                   # OnboardingWizard + Step1–4
│   │   ├── shell/                        # Sidebar, Header, SignOutButton
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── upload/
│   │   ├── reconciliation/
│   │   └── reports/
│   │
│   ├── lib/                              # Each feature folder has index.ts barrel
│   │   ├── env.ts                        # Server-only Zod env validation
│   │   ├── logger.ts                     # Tagged logger factory
│   │   ├── utils.ts                      # shadcn cn helper
│   │   ├── supabase/                     # client.ts, server.ts, middleware.ts, index.ts
│   │   ├── auth/                         # getCurrentBusiness, index.ts
│   │   ├── businesses/                   # createBusiness, index.ts
│   │   ├── onboarding/                   # constants.ts, schema.ts, index.ts
│   │   ├── openrouter/                   # client.ts, prompts.ts, index.ts
│   │   ├── parsers/                      # bank + marketplace CSV parsers
│   │   ├── categorization/               # categorize.ts, ruleBased.ts, ...
│   │   ├── reconciliation/               # matchSettlements.ts, ...
│   │   ├── anomalies/                    # detectors + explainers
│   │   ├── gst/                          # categoryMapping, computeLiability, gstr3bAggregator
│   │   ├── analytics/                    # cashFlow, channelSplit, vendor + client
│   │   ├── reports/                      # pdfTemplate, excelBuilder
│   │   └── demo-data/                    # Sample CSVs (Layer 5)
│   │
│   ├── db/
│   │   ├── schema.ts                     # Drizzle schema (10 tables)
│   │   ├── client.ts                     # Drizzle runtime client
│   │   ├── load-env.ts                   # tsx env loader for seed
│   │   ├── seed.ts                       # gst_categories seed
│   │   └── migrations/                   # Generated SQL
│   │
│   ├── types/                            # Shared types not coupled to a feature
│   │   ├── transaction.ts
│   │   ├── settlement.ts
│   │   ├── anomaly.ts
│   │   └── report.ts
│   │
│   └── middleware.ts                     # Next.js middleware (auth gate)
│
├── docs/
│   ├── ledger-iq-prd.md                  # PRD index
│   ├── prd/                              # PRD sections (this file lives here)
│   └── initial-implementation-plan.md    # Phased build plan
├── tasks/
│   └── todo.md                           # Stage tracker
├── CLAUDE.md                             # Operational manual
├── .env.local                            # Secrets (gitignored)
├── .env.example
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json                         # paths: { "@/*": ["./src/*"] }
├── tailwind.config.ts                    # content: ["./src/**/*.{ts,tsx}"]
├── drizzle.config.ts                     # schema: "./src/db/schema.ts"
├── components.json                       # shadcn (css: "src/app/globals.css")
├── postcss.config.js
└── next.config.js
```

> **Layer-1 deviation note:** PRD originally placed source at the project root. The build switched to `src/` as part of Stage 1.6.5 (see `docs/initial-implementation-plan.md`) to cleanly separate source from configs. All path references in this PRD that mention `app/`, `lib/`, `db/`, `components/`, or `middleware.ts` should be read with an implicit `src/` prefix.

### 10.2 Data model overview

Eight core tables. Defined in detail in [03 — Database](03-database.md).

```
users (Supabase Auth)
  └── businesses (1:N)
        ├── statements (1:N)         — uploaded bank statement files
        ├── transactions (1:N)       — parsed + categorized rows
        ├── settlements (1:N)        — uploaded marketplace reports
        │     └── settlement_lines (1:N)
        ├── reconciliations (1:N)    — discrepancies detected
        ├── anomalies (1:N)          — flagged transactions
        ├── reports (1:N)            — generated PDF/Excel exports
        └── category_overrides (1:N) — user corrections (learning signal)

gst_categories (static lookup)       — seeded reference data
```
