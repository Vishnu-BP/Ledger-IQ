# 10 — Risks, Constraints & Demo Strategy

> Read this section for: build risks and mitigations, demo script, fallback plan.
> Cross-references: [09 — Build Plan](09-build-plan.md) for layer sequencing, [01 — Features](01-features.md) §8.3 for the wow-moment.

Covers:
- Build risks & mitigations
- Demo risks & mitigations
- Constraints
- 3-minute demo flow
- Demo data design
- Backup plan

---

## 19. Risks, Constraints & Mitigations

### 19.1 Build risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Categorization fails to produce sensible results on demo data | Medium | High | Pre-seed demo data with descriptions known to categorize cleanly; have rule-based fallback for known patterns |
| OpenRouter rate limits during demo | Low | High | Pre-categorize demo data once, store in DB, never re-categorize live during demo |
| PDF parsing breaks on uploaded statement | High (skipped to Layer 5) | Medium | CSV-only path is primary; PDF is bonus |
| OAuth callback fails | Medium | High | Test all three providers in Layer 1; have email/password as guaranteed fallback |
| Reconciliation math doesn't reconcile cleanly with demo data | Medium | High | Generate demo data that's mathematically guaranteed to produce ₹960 discrepancy |
| react-pdf rendering breaks at hour 20 | Medium | Medium | Build PDF template early in Layer 5, test before adding all sections |
| Drizzle migration fails on Supabase | Low | High | Test migration locally first; have schema-as-SQL backup |
| Vercel deploy fails at end | Medium | Medium | Run `pnpm build` locally before each commit; have clean working tree |
| Time runs out before Layer 5 | Medium | Medium | Layer 4 already wins; Layer 5 is polish on top |

### 19.2 Demo risks

| Risk | Mitigation |
|---|---|
| Live demo crashes mid-presentation | Pre-record video backup; have screenshots |
| Wifi fails during demo | Run on local server; pre-load all data |
| Judges don't understand the wow moment | Demo script practiced 3 times with timing |
| Sample data feels fake | Use real bank/marketplace schemas (already documented in conversation) |

### 19.3 Constraints

- **Time:** 17 productive hours of build time
- **Solo developer:** Vishnu, orchestrating multiple Claude Code sessions
- **Budget:** Claude Code Max + OpenRouter free credits = ~$0 marginal cost
- **Deployment:** Local-first; Vercel only at end
- **Authentication:** Full Supabase auth required (Email + Google + GitHub)
- **Data:** Mock data only; no real PII at any point

---

## 20. Demo Strategy

### 20.1 The 3-minute demo flow

```
[0:00–0:20]  Problem framing
  "Indian small businesses lose 5–15% of revenue to silent
   financial errors they never catch — marketplace under-payments,
   miscategorized expenses, missing recurring payments, GST mistakes.
   Their accountants charge ₹15K/month to do work an AI can do
   in 30 seconds, and still miss the things AI catches automatically."

[0:20–0:35]  Setup
  Sign in with Google → Already onboarded → land on dashboard
  Show: empty state → "Let me upload my March bank statement"

[0:35–1:10]  Upload + categorization (Layer 1+2+3)
  Drop bank_statement.csv → 5 seconds → 47 transactions appear
  All categorized, channel-tagged, GST-mapped
  "Watch how it separates online from offline revenue,
   tags every transaction, calculates GST treatment per row."

[1:10–1:50]  Dashboard intelligence (Layer 4)
  Cash flow chart populates
  Channel split: 62% offline / 38% online
  KPI tiles: ₹47K GST liability, 47-day runway
  Anomaly panel: 3 flagged
  "Missing rent, duplicate AWS charge — caught automatically."

[1:50–2:30]  The wow moment (Layer 4) ⭐
  "Now watch this. Here's the seller's Amazon settlement report."
  Drop amazon_settlement.csv
  Reconciliation panel appears: "Amazon owes you ₹960
   across 6 disputed orders"
  Click expand → shows the 6 order IDs with explanations
  "Money that was silently missing. CA wouldn't catch it.
   We caught it in 5 seconds."

[2:30–2:50]  Output (Layer 5)
  Click "Generate Audit Report" → PDF downloads
  Show GSTR-3B pre-fill with copy buttons
  "Filing-ready compliance, one click."

[2:50–3:00]  Vision close
  "This is Phase 1 — financial intelligence on top of bank data.
   Phase 2 brings live Account Aggregator integration, ONDC,
   inventory and supplier intelligence — all on the same AI engine.
   We're building the autonomous CFO for India's 14 million MSMEs."

[End]  Q&A
```

### 20.2 Demo data design

Three CSV files crafted to tell the story:

1. **HDFC bank statement** (90 days, 150 transactions)
   - Mix of UPI, POS, cash, marketplace NEFT, vendor RTGS
   - Recurring rent (5th of month) — missing in current month for anomaly
   - Recurring AWS subscription (14th) — duplicated this month
   - Sharma Suppliers — pricing creeping up 18% over 90 days
   - Total Amazon NEFT inflows = settlement total - ₹960

2. **Amazon settlement** (V2 schema, 1 settlement period)
   - 25 orders, 4 refunds, ad spend, FBA fees
   - 6 refunds with `Commission Reversal = ₹0` (the bug)
   - Total under-payment: ₹960

3. **Flipkart settlement** (smaller, clean — to show product handles non-error cases)
   - 15 orders, 2 returns, 1 SPF credit
   - Reconciles perfectly (no discrepancy)

### 20.3 Backup plan

- Pre-recorded 3-minute screen recording of the demo, edited to be smooth
- Hosted on Vercel and on a USB drive
- Available as fallback if live demo fails for any reason
