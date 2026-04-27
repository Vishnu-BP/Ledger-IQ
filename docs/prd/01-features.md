# 01 — Features & User Journeys

> Read this section for: feature scope (Tier 1/2/3), user flows, the demo wow-moment.
> Cross-references: [00 — Overview](00-overview.md), [09 — Build Plan](09-build-plan.md).

Covers:
- Feature Specification (Tier 1 / Tier 2 / Tier 3)
- User Journeys

---

## 7. Feature Specification

Features are organized into three tiers. All three tiers are in scope for the hackathon build.

### 7.1 Tier 1 — Core (must-ship foundation)

**F1. Smart Bank Statement Ingestion**
- Accept CSV upload (PDF as Layer 5 stretch)
- Parse into structured transactions: `date, description, debit, credit, balance`
- Detect duplicate uploads (same date range, same hash) and prompt user
- Store raw uploaded file in Supabase Storage
- Store parsed rows in `transactions` table

**F2. AI-Powered Transaction Categorization**
- Two-tier LLM pipeline:
  - First pass: cheap fast model (Llama 3.3 70B via OpenRouter) batches 20 transactions per call
  - Second pass: Claude Sonnet 4.6 reviews transactions with confidence < 0.85
- Each transaction receives: `category`, `confidence_score`, `ai_reasoning`
- Categorization runs asynchronously after upload

**F3. Channel Tagging**
- Each transaction tagged with one channel:
  - `OFFLINE_CASH` — physical cash deposits
  - `OFFLINE_UPI` — in-person UPI payments
  - `OFFLINE_CARD` — POS card settlements
  - `ONLINE_AMAZON` — Amazon marketplace payouts
  - `ONLINE_FLIPKART` — Flipkart marketplace payouts
  - `ONLINE_OTHER` — generic e-commerce
  - `B2B_DIRECT` — direct B2B NEFT/RTGS payments
  - `VENDOR_PAYMENT` — outflows to suppliers
  - `OPERATING_EXPENSE` — rent, utilities, salaries, software
  - `PERSONAL` — non-business, owner draws

**F4. GST Head Mapping**
- Each category mapped to a GST treatment via static lookup table:
  - `gst_section` — ITC Goods, ITC Services, Outward Supplies, Blocked ITC, Exempt
  - `gst_rate` — 0%, 5%, 12%, 18%, 28%
  - `tcs_applicable` — boolean
  - `tcs_rate` — numeric
- Output: every transaction has computed GST treatment

**F5. Transaction Review & Edit UI**
- Sortable, filterable table at `/app/transactions`
- Inline edit for category, channel, GST head
- Bulk-edit similar transactions
- User overrides stored as learning signals for future categorization

### 7.2 Tier 2 — Intelligence (the differentiator)

**F6. Marketplace Settlement Reconciliation** ⭐ *Hero feature*
- Accept settlement CSV upload (Amazon V2 Flat File or Flipkart format)
- Match each settlement period to corresponding bank credit
- Compute discrepancies row-by-row: missing commission reversals, duplicate fees, unprocessed refunds
- Surface discrepancies as actionable alerts: *"Amazon owes you ₹X across N orders"*
- LLM generates plain-English explanation for each discrepancy

**F7. Live Cash Flow Dashboard**
- 30/60/90-day rolling area chart of money in vs money out
- Burn rate calculation (rolling 30-day expense average)
- Runway estimate (current cash / burn rate)
- Channel-split overlay

**F8. Channel-Split Revenue Analytics**
- Donut chart: % offline vs % online
- Month-over-month growth per channel
- Concentration risk alerts: *"X% revenue from Amazon — single channel risk"*

**F9. Anomaly Detection Engine**
- Rule-based detection:
  - Duplicate transactions (same amount + vendor + day within 24hrs)
  - Missing recurring payments (rent/AWS/salary expected by day X, not appeared)
  - Unusual spend spikes (>3x category 90-day average)
  - Vendor pricing creep (avg invoice up >15% over 90 days)
  - Never-seen-before payees with large amounts
- Each anomaly receives Claude-generated explanation
- Anomalies surfaced on dashboard and a dedicated panel

**F10. Vendor & Client Intelligence**
- Top vendors panel: name, total YTD, payment frequency, last paid, avg cycle
- Top clients panel: name, total YTD, average payment delay, outstanding receivables
- Sortable by amount, frequency, recency

**F11. Receivables Tracking**
- Auto-detect unpaid invoices from transaction patterns
- Show overdue receivables with days outstanding

### 7.3 Tier 3 — Compliance & Output (the deliverable)

**F12. Live Tax Liability Tile**
- Always-visible dashboard widget showing computed GST liability for current period
- Updates in real-time as transactions are categorized

**F13. GSTR-3B Pre-Fill View**
- Computed aggregations mapped to GSTR-3B form fields:
  - Outward Taxable Supplies
  - Outward Supplies (Zero Rated)
  - Inward Supplies (Reverse Charge)
  - ITC Available (Goods, Services, Capital Goods)
  - ITC Reversed
  - Net Tax Payable
- Copy-to-clipboard buttons for each section

**F14. Audit-Ready PDF Report**
- One-click generation of monthly/quarterly report
- Contents:
  - Executive summary (Claude-generated narrative)
  - Period and company header
  - P&L summary
  - Category-wise breakdown
  - Channel split
  - GST liability summary
  - Anomaly log
  - Full transaction log (appendix)
- Generated client-side via react-pdf

**F15. Excel Export**
- Multi-sheet xlsx file:
  - Sheet 1: Transactions (all categorized data)
  - Sheet 2: Categories (totals per category)
  - Sheet 3: GST Summary
  - Sheet 4: Reconciliation (if marketplace data uploaded)
- Generated client-side via SheetJS

---

## 8. User Journeys

### 8.1 First-time user (signup → first value)

```
1. User lands on /
2. Reads tagline, clicks "Get Started"
3. Routes to /auth/signup
4. Chooses Email / Google / GitHub OAuth
5. Verifies email (if email signup) or returns from OAuth
6. Routes to /onboarding
7. 4-step wizard:
   Step 1: Business name + type
   Step 2: GSTIN (optional) + state + fiscal year
   Step 3: Sales channels (multi-select) + primary bank
   Step 4: Recap + "Upload first statement" CTA
8. Routes to /app/dashboard (empty state)
9. Empty state shows: "Upload your first bank statement to get started"
10. User clicks Upload, drops CSV
11. Parsing happens — progress indicator
12. Categorization runs — progress indicator
13. Dashboard auto-populates with KPIs, charts, anomalies
14. User sees value within 2 minutes of signup
```

### 8.2 Recurring user (monthly close)

```
1. User logs in
2. Lands on /app/dashboard — sees previous period's data
3. Clicks Upload, drops latest month's CSV
4. New transactions categorized
5. Anomalies surface (this month vs historical pattern)
6. User reviews anomalies, marks valid ones as "OK"
7. User uploads Amazon settlement CSV
8. Reconciliation panel surfaces under-payments
9. User clicks "Generate Report" → PDF downloads
10. User shares PDF with CA
```

### 8.3 The reconciliation wow-moment (demo flow)

```
1. User on dashboard with sample data already loaded
2. Clicks "Upload Settlement Report"
3. Drops Amazon settlement CSV
4. Reconciliation panel appears within 5 seconds:
   "Amazon paid ₹X to your account in this period.
    According to settlement report, they owe ₹X + ₹960.
    Discrepancy: 6 refunds where commission reversal was not processed."
5. User clicks to expand — sees the 6 affected order IDs
6. Each row has a Claude-generated explanation
7. User has the option to mark "Disputed" or "Accept loss"
```
