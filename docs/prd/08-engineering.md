# 08 — Engineering Principles & Tech Stack

> Read this section for: SOLID application, code conventions, error handling, testing strategy, locked package list with versions.
> Cross-references: [`CLAUDE.md`](../../CLAUDE.md) is the operational manual that operationalizes these principles.

Covers:
- Pragmatic SOLID
- Code conventions (naming, types, comments, async, errors)
- Error handling
- What NOT to do
- Testing strategy
- Tech stack (locked packages + versions)
- Environment variables

---

## 16. Engineering Principles

### 16.1 Pragmatic SOLID

Apply the spirit, not the ceremony.

**Single Responsibility**
Each file has one job. `bankStatementParser.ts` only parses bank statements. `categorize.ts` only categorizes. No file does multiple unrelated things.

**Open/Closed**
New bank parsers are added as new files in `lib/parsers/`, not by modifying existing parsers. Same for new marketplace settlement formats. The categorization pipeline accepts pluggable rule sets.

**Liskov / Interface Segregation**
Use TypeScript interfaces for all service boundaries. The `LLMClient` interface is implemented by `openrouter/client.ts` — could be swapped for any other provider.

**Dependency Inversion**
High-level modules (categorization pipeline) depend on abstractions (LLMClient interface), not concrete implementations (OpenRouter SDK).

### 16.2 Code conventions

- **File naming:** camelCase for utilities (`bankStatementParser.ts`), PascalCase for React components (`KpiTile.tsx`)
- **Exports:** named exports preferred over default exports (except for pages/layouts where Next.js requires default)
- **Types:** colocated with code if narrow scope; in `/types` if shared
- **Comments:** explain *why*, not *what*. Code shows what.
- **Async:** use async/await, never raw promises
- **Errors:** never swallow. Either handle meaningfully or propagate.

### 16.3 Error handling

- API routes return proper HTTP status codes (400, 401, 404, 500) with JSON error body
- Frontend catches all API errors, shows toast notification
- LLM failures fall back to rule-based categorization, never crash
- Parse failures surface specific error to user (not "something went wrong")
- All errors logged to console (server-side) — no remote logging in hackathon scope

### 16.4 What NOT to do

- ❌ Don't use Server Actions for things that aren't form mutations
- ❌ Don't put secrets in client-side code (`NEXT_PUBLIC_*` only for non-sensitive)
- ❌ Don't run categorization in API request thread for >1 statement (use background pattern)
- ❌ Don't use `any` in TypeScript — use `unknown` if truly unknown
- ❌ Don't add new dependencies without justification — every package is build-time risk
- ❌ Don't optimize prematurely — ship working code first
- ❌ Don't skip RLS policies — every business-scoped table must have them
- ❌ Don't store raw passwords or tokens — Supabase handles auth

### 16.5 Testing strategy

For hackathon scope: manual smoke testing only. No automated tests — the time investment doesn't pay back in 17 hours. Smoke checklist after each layer:

- Layer 1: signup → onboarding → empty dashboard works
- Layer 2: upload CSV → see uncategorized transactions in table
- Layer 3: upload CSV → see categorized + channel-tagged transactions
- Layer 4: upload settlement → see reconciliation discrepancy
- Layer 5: click "Generate Report" → PDF downloads correctly

---

## 17. Tech Stack

Detailed list with versions and rationale.

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Framework | Next.js | 14 (App Router) | Single deployable, Server Components, familiarity |
| Language | TypeScript | 5.6+ | Type safety for financial data |
| Styling | Tailwind CSS | 3.4+ | Utility-first, no CSS files to manage |
| Components | shadcn/ui | Latest | Production-quality, copy-pasteable, owned code |
| Database | Postgres (Supabase) | Latest | Bundled with auth + storage |
| ORM | Drizzle | 0.33+ | TS-native, no codegen step |
| Migrations | drizzle-kit | 0.24+ | Generates SQL from schema |
| Auth | Supabase Auth | Latest | Email + OAuth in one config |
| Storage | Supabase Storage | Latest | Bundled, simple API |
| AI Gateway | OpenRouter | API | One key, all models |
| AI SDK | openai (npm) | 4.65+ | OpenRouter is OpenAI-compatible |
| CSV Parser | papaparse | 5.4+ | Bulletproof, streams, typed output |
| PDF Parser | pdf-parse | 1.1+ | Layer 5 stretch only |
| Charts | Recharts | 2.12+ | React-native, themable |
| PDF Export | @react-pdf/renderer | 4.0+ | Client-side PDF generation |
| Excel Export | xlsx (SheetJS) | 0.18+ | Industry standard |
| Validation | Zod | 3.23+ | Runtime + compile-time safety |
| Forms | react-hook-form | 7.53+ | Multi-step wizard support |
| Date | date-fns | 3.6+ | Tree-shakeable date math |
| Icons | lucide-react | 0.445+ | shadcn default |
| Deploy | Vercel | — | At end of build (local-first during build) |

### 17.1 Environment variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenRouter
OPENROUTER_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
