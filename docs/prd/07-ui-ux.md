# 07 — UI/UX Specification

> Read this section for: pages, layouts, design tokens, empty/loading/error states.
> Cross-references: [01 — Features](01-features.md) for what each page does, [08 — Engineering](08-engineering.md) for component conventions.

Covers:
- Page inventory (routes + auth)
- Onboarding wizard steps
- Dashboard layout
- Design tokens
- Empty / loading / error states

---

## 15. UI/UX Specification

### 15.1 Page inventory

| Route | Purpose | Auth |
|---|---|---|
| `/` | Landing page | Public |
| `/auth/login` | Sign in | Public |
| `/auth/signup` | Sign up | Public |
| `/auth/callback` | OAuth return | Public |
| `/onboarding` | First-time wizard | Authenticated |
| `/app/dashboard` | Home (KPIs + charts + anomalies) | Authenticated + onboarded |
| `/app/transactions` | Transaction table | Authenticated |
| `/app/upload` | Upload UI | Authenticated |
| `/app/reconciliation` | Marketplace recon | Authenticated |
| `/app/reports` | GSTR-3B + PDF/Excel export | Authenticated |

### 15.2 Onboarding wizard steps

**Step 1: Business basics**
- Business name (text, required)
- Business type (select: Retail, Restaurant, Service, E-commerce, Manufacturing, Other)
- Industry subcategory (text, optional)

**Step 2: Tax identity**
- GSTIN (text, optional, validated format if provided)
- State (select, all 28 Indian states + 8 UTs)
- Fiscal year start (default April, optional change)

**Step 3: Sales channels & banking**
- Where do you sell? (multi-select checkboxes)
  - Physical store
  - Amazon
  - Flipkart
  - Meesho
  - Direct B2B
  - Other (text)
- Primary bank (select: HDFC, ICICI, SBI, Axis, Kotak, Other)

**Step 4: Ready to go**
- Recap of entered data
- Two CTAs:
  - "Upload your first bank statement" → `/app/upload`
  - "Try with sample data" → loads pre-seeded demo data, routes to `/app/dashboard`

### 15.3 Dashboard layout

```
┌─────────────────────────────────────────────────────────────┐
│  Sidebar                  │  Header                         │
│  ─────────                │  Business Name · Period · User  │
│  • Dashboard ●            ├─────────────────────────────────┤
│  • Transactions           │  ┌──────┬──────┬──────┬──────┐  │
│  • Upload                 │  │Total │ GST  │ Cash │Anom- │  │
│  • Reconciliation         │  │ Rev  │ Liab │ Run  │ alies│  │
│  • Reports                │  └──────┴──────┴──────┴──────┘  │
│                           │  ┌─────────────┬──────────────┐ │
│  ─────────                │  │ Cash Flow   │ Channel Split│ │
│  Settings                 │  │ Chart       │ Donut        │ │
│  Sign Out                 │  └─────────────┴──────────────┘ │
│                           │  ┌──────────────────────────────┐ │
│                           │  │ Recent Anomalies (3)         │ │
│                           │  └──────────────────────────────┘ │
│                           │  ┌──────────────────────────────┐ │
│                           │  │ Recent Transactions (10)     │ │
│                           │  └──────────────────────────────┘ │
└───────────────────────────┴─────────────────────────────────┘
```

### 15.4 Design tokens (default shadcn baseline)

- Font: Inter (sans-serif), system fallback
- Primary: shadcn default (slate)
- Spacing: Tailwind default scale (4px base)
- Radius: 8px default, 12px for cards
- Shadow: shadcn default

Custom design system (Editorial-feeling) is Layer 5 polish if time permits. Default shadcn looks professional out of the box.

### 15.5 Empty states

Every page has a designed empty state:

- Dashboard before any upload: "No data yet — upload your first bank statement to begin"
- Transactions before upload: "Your transactions will appear here once you upload a statement"
- Reconciliation before settlement upload: "Upload an Amazon or Flipkart settlement report to see reconciliation"
- Reports before any data: "Reports will be available once you have categorized transactions"

### 15.6 Loading states

- Categorization: skeleton rows in transaction table, "AI is analyzing your transactions..." with progress count
- Upload: progress bar with file name
- Charts: skeleton chart area with shimmer
- Buttons: spinner inside button, disabled state

### 15.7 Error states

- Upload fails: clear error message + retry button
- Parse error: "We couldn't parse this file. Make sure it's a CSV exported from your bank's net banking."
- API error: friendly message + retry, never raw error codes shown to user
