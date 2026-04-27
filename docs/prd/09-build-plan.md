# 09 — Layered Build Plan

> Read this section for: layer scope, sequencing, what to build vs defer.
> **READ THIS BEFORE STARTING ANY CODING SESSION** — it tells you what's in scope for the current layer and what to skip.
> Cross-references: [01 — Features](01-features.md) for feature definitions, [10 — Risks & Demo](10-risks-demo.md) for the demo arc.

Covers:
- All 5 layers (~17 hours total)
- What each layer delivers
- Layer rules (no skipping, polish in Layer 5 only, etc.)

---

## 18. Layered Build Plan

The build proceeds in five layers. Each layer ships a functional product. Stopping at any layer leaves a demoable artifact.

### Layer 1 — Skeleton (3 hours)

Working web app with auth and empty dashboard.

**Delivers:**
- Next.js project initialized with all dependencies
- Supabase project live with full schema deployed
- All 8 tables created with RLS policies
- `gst_categories` seeded
- Auth working: email signup, Google OAuth, GitHub OAuth
- Onboarding 4-step wizard collects business data, writes to DB
- Empty dashboard with sidebar shell, empty state CTAs
- All routes scaffolded, route protection working
- Local dev server runs without errors

**Demoable as:** "Working SaaS shell with auth and onboarding."

### Layer 2 — Foundation (4 hours)

Data flows in and out.

**Delivers:**
- Upload page accepts CSV file
- File stored in Supabase Storage
- Bank statement CSV parser (handles HDFC/ICICI standard format)
- Parsed rows written to `transactions` table
- Transactions page shows table with sortable columns, basic filters
- Edit/delete buttons (manual override capability)
- Empty AI fields visible (category, channel, GST all NULL — placeholder text)

**Demoable as:** "Financial data ingestion tool. Upload + view + edit."

### Layer 3 — Intelligence (4 hours)

The AI brain works.

**Delivers:**
- OpenRouter integration with two-tier categorization pipeline
- Llama 3.3 bulk categorization
- Claude Sonnet edge-case review
- Channel tagging
- GST head mapping (deterministic from category)
- Confidence scores visible in UI
- Low-confidence rows highlighted for review
- User overrides save to `category_overrides` and apply to similar future transactions

**Demoable as:** "AI auto-categorizer for bank statements."

### Layer 4 — Differentiator (3 hours)

The wow moment exists.

**Delivers:**
- Dashboard fully wired with live data
- KPI tiles: Total Revenue, GST Liability, Cash Runway, Anomaly Count
- Cash flow area chart (Recharts)
- Channel split donut
- Anomaly detection engine running (duplicates, missing recurring, spikes)
- Anomaly explanations via Claude
- Marketplace settlement upload page
- Amazon CSV parser
- Reconciliation engine matching settlements to bank credits
- Reconciliation result view with discrepancy details + AI explanations

**Demoable as:** "AI financial brain that catches Amazon under-paying you in 5 seconds." ⭐ **This is the minimum-winning version.**

### Layer 5 — Polish & Output (3 hours)

Production-feeling product.

**Delivers:**
- GSTR-3B pre-fill view with copy-to-clipboard for each section
- PDF report generation (react-pdf) with executive summary
- Excel export (multi-sheet xlsx)
- Vendor & client intelligence panels
- Receivables tracking
- Polished empty/loading/error states everywhere
- Mobile-responsive checks
- Landing page upgraded with hero, features, screenshots
- Demo data seed CSVs created and loadable via "Try with sample data" button
- Final visual polish pass

**Demoable as:** "Production-quality fintech product."

### Layer rules

1. No layer is skipped to come back to. Each layer must be complete before the next starts.
2. Each layer ends with a git commit and a smoke test.
3. Polish stays in Layer 5. Don't make Layer 1's landing page beautiful before Layer 2 starts.
4. Bug found in earlier layer? Fix only if blocking; otherwise log for Layer 5.
5. Each layer maps to one Claude Code session.
