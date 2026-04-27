# 00 — Overview

> Read this section for: product context, who it's for, what's in/out of scope.
> Always read this before any other PRD section.

Covers:
- Executive Summary
- Problem Statement
- Vision & Purpose
- Target Users & Personas
- Product Goals & Success Metrics
- Scope & Non-Goals

---

## 1. Executive Summary

LedgerIQ is an AI-powered financial autopilot for Indian small and medium businesses (SMBs). It ingests bank statements (CSV) and marketplace settlement reports (CSV from Amazon, Flipkart) and automatically delivers:

- **Categorized transactions** with channel tagging (online vs offline)
- **GST head mapping** with applicable rates
- **Live GST liability** calculation
- **Cash flow visualization** with runway estimation
- **Anomaly detection** for missing payments, duplicates, and unusual spending
- **Marketplace settlement reconciliation** that catches under-payments
- **Vendor and client intelligence**
- **Audit-ready PDF and Excel reports**
- **GSTR-3B pre-fill** mapping for tax filing

The product targets a market of ~14 million GST-registered MSMEs in India, with particular relevance for hybrid businesses that sell both offline (physical store, UPI, cash) and online (Amazon, Flipkart, Meesho).

**Core value proposition:** What a chartered accountant takes 40 hours to do, LedgerIQ does in 40 seconds — and catches errors the human accountant routinely misses.

---

## 2. Problem Statement

### 2.1 The financial chaos of Indian SMBs

A typical Indian small business owner — whether running a kirana store, an electronics shop, a boutique, a small restaurant, or a service business — operates with severe financial blindness. Their daily reality:

- **Multiple disconnected revenue streams:** cash, UPI (PhonePe, GPay, Paytm), card POS settlements, NEFT credits from B2B clients, NEFT payouts from Amazon/Flipkart/Meesho
- **Cryptic bank statements:** transaction descriptions like `UPI-PHONEPE-MERCHANT-XXXX9821-PAY` or `NEFT CR-AMAZON SELLER SVCS-N123456` that defy easy categorization
- **Complex GST regime:** different rates for goods vs services, ITC eligibility rules, blocked categories, TCS deducted by marketplaces, RCM applicability — all of which they get wrong without expert help
- **Marketplace settlement opacity:** Amazon and Flipkart deduct commissions, fees, advertising costs, and refund-related charges from gross sales before depositing net amounts to the seller's bank account. Errors in these deductions are common and silently cost sellers 3–7% of revenue
- **No real-time financial visibility:** owners can't answer basic questions like "what's my cash runway?", "which client owes me the most?", or "what's my GST liability this month?" without sitting down with their accountant

### 2.2 The cost of this chaos

| Pain point | Annualized cost to an average SMB |
|---|---|
| Manual bookkeeping (40 hrs/month at ₹500/hr opportunity cost) | ₹2,40,000 |
| Marketplace settlement under-payments (3–5% of online revenue) | ₹50,000–₹2,00,000 |
| Tax filing errors and penalties | ₹10,000–₹50,000 |
| Late payment tracking failures | ₹30,000–₹1,00,000 |
| Missed ITC claims due to miscategorization | ₹20,000–₹80,000 |
| **Total annual leakage per SMB** | **₹3,50,000–₹6,70,000** |

For a business operating on 8–15% net margins, this leakage often exceeds 50% of profit.

### 2.3 Why existing solutions fail

- **Tally** is powerful but requires accountant-level knowledge to operate. Owners outsource it entirely.
- **Zoho Books / QuickBooks** are accounting tools, not intelligence tools. They display data; they don't analyze or alert.
- **CA-led services** are slow (monthly cycle), expensive (₹15,000+/month), and reactive — they catch problems after they've cost money, not before.
- **Marketplace dashboards (Amazon Seller Central, Flipkart Seller Hub)** show seller their own data but don't reconcile it against bank inflows or detect under-payments.
- **None of these products understand the hybrid SMB** — the business that sells both offline and online and needs unified financial intelligence across both streams.

### 2.4 The gap LedgerIQ fills

LedgerIQ is the first AI-native financial brain that:

1. Treats categorization as a **reasoning task**, not a rule-matching task — handling ambiguous transactions through LLM judgment
2. Reconciles **marketplace settlements against bank credits** automatically, surfacing discrepancies sellers can dispute
3. Provides **plain-English explanations** for every flagged anomaly, making the AI's decisions auditable
4. Generates **filing-ready compliance reports** that map directly to GSTR-3B fields
5. Works across **all SMB categories** — retail, services, manufacturing, e-commerce — through configurable category taxonomies

---

## 3. Vision & Purpose

### 3.1 Long-term vision

LedgerIQ becomes the autonomous CFO for India's 14 million MSMEs. Owners spend zero time on financial operations: every transaction is categorized, every anomaly is caught, every tax liability is calculated, every report is filed-ready — all in real time, all without human input.

### 3.2 Hackathon-build purpose

In 17 build hours, demonstrate a working, polished product that proves the core thesis: **AI can do what an accountant does, faster and more accurately, for a fraction of the cost.**

The hackathon build delivers Tier 1 + Tier 2 + Tier 3 features (defined in [01 — Features](01-features.md)) — enough to show end-to-end value across ingestion, intelligence, and output. Stretch features and integrations are explicitly Phase 2.

### 3.3 Design philosophy

- **AI is the product, not a feature.** Every layer of the application reasons about the user's data — not just stores and displays it.
- **Polish over breadth.** Five features that work flawlessly beat fifteen features that feel half-built.
- **Auditable intelligence.** Every AI decision shows its reasoning. No black boxes for users handling tax-relevant data.
- **Generic but specific.** The product works for any SMB category but feels tailored — through configurable taxonomies and adaptive learning.
- **Trust through compliance.** All outputs are formatted to align with Indian GST forms (GSTR-3B specifically). The product is the bridge between messy reality and government-ready paperwork.

---

## 4. Target Users & Personas

### 4.1 Primary persona: The Hybrid SMB Owner

**Profile:** Runs a small business with both offline and online revenue streams. Examples:
- Electronics shop in a Tier-2 city that also sells on Amazon and Flipkart
- Boutique that takes walk-ins and lists on Meesho
- Bookshop with in-store sales plus website orders
- Service business (consultant, agency) with B2B clients paying via NEFT
- Restaurant with dine-in plus Swiggy/Zomato orders

**Demographics:**
- Age 28–55
- GST-registered or just below threshold
- Annual revenue ₹20L–₹5Cr
- 1–20 employees
- Located in Tier-1 to Tier-3 Indian cities
- Smartphone-native, comfortable with apps but not deeply technical

**Goals:**
- Get a clear view of business financial health
- Stop losing money to errors and oversight
- File taxes correctly and on time
- Spend less time on bookkeeping
- Make better decisions about pricing, vendors, channels

**Frustrations:**
- Bank statements are illegible
- Marketplace payouts feel like black boxes
- CA gives advice once a month, too late
- Multiple apps for inventory, accounting, GST — none talk to each other
- No idea if their margins are actually healthy

### 4.2 Secondary persona: The Chartered Accountant

CAs serving multiple SMB clients can use LedgerIQ as a force multiplier — auto-categorizing client data, generating reports, identifying issues to discuss with clients. Phase 2 multi-tenant support targets this user.

### 4.3 Anti-persona: enterprise finance teams

LedgerIQ is **not** designed for large companies with dedicated finance teams, ERPs, audit departments, or complex multi-entity structures. SAP, Oracle, and large-format Tally serve them.

---

## 5. Product Goals & Success Metrics

### 5.1 Hackathon-stage goals

1. **Demonstrate end-to-end functionality:** upload → categorize → reconcile → report, all working live with no manual intervention
2. **Showcase a memorable wow-moment:** the marketplace reconciliation feature that catches a quantified under-payment ("Amazon owes you ₹X")
3. **Communicate vision credibly:** Phase 2 roadmap that judges believe is achievable
4. **Ship a polished UI:** product feels designed, not thrown together
5. **Tell a clear story:** 3-minute demo with five distinct value beats

### 5.2 Production-stage goals (Phase 2+)

- Categorization accuracy >95% on Indian bank statements
- Reconciliation discrepancy detection precision >90%
- Time-to-first-value (signup → first categorized statement) <2 minutes
- Monthly active SMB users at 6 months: 1,000+
- Net Promoter Score: >50

### 5.3 Hackathon success metrics

- Demo runs end-to-end without crashes
- All Tier 1 + 2 + 3 features visibly functional
- Sample data tells a coherent story (real-feeling discrepancy caught)
- Deployed and accessible via public URL
- Pitch delivered in <3 minutes

---

## 6. Scope & Non-Goals

### 6.1 In scope (Tier 1 + Tier 2 + Tier 3)

**Ingestion**
- Bank statement CSV upload and parsing
- Marketplace settlement CSV upload (Amazon, Flipkart formats)
- Manual transaction entry (edit, delete)

**Intelligence**
- AI-powered transaction categorization (two-tier LLM)
- Channel tagging (Online / Offline / B2B / Vendor / Operating Expense / Personal)
- GST head mapping with applicable rates
- Anomaly detection (rule-based with AI explanations)
- Marketplace settlement reconciliation
- Vendor and client analytics

**Output**
- Live cash flow dashboard
- GST liability live tile
- GSTR-3B pre-fill view
- PDF audit report generation
- Excel multi-sheet export

**Authentication**
- Email/password signup
- Google OAuth
- GitHub OAuth
- Onboarding wizard for first-time business setup

### 6.2 Out of scope for hackathon

- Inventory management
- Stock tracking, SKU management
- Purchase order workflow
- Vendor invoice management
- Bank PDF parsing (CSV-only for hackathon; PDF is Layer 5 stretch)
- OCR for scanned statements
- Direct GST portal filing (output is filing-ready but not auto-submitted)
- Account Aggregator integration for live bank sync
- Marketplace API integration for live settlement sync
- Mobile app (responsive web only)
- Multi-tenant CA dashboard
- Email/WhatsApp notifications
- Recurring billing / subscriptions
- Razorpay / Stripe payment gateway integration
- Customer-facing invoicing
- Payroll
- ONDC, Meesho, JioMart settlement parsing (Amazon and Flipkart only)
- Multi-currency support
- Multi-language UI
- Dark mode (Phase 2 polish)

### 6.3 Explicit non-goals (forever)

- Replacing chartered accountants for complex tax planning
- Audit attestation (we generate audit-ready reports, we don't audit)
- Lending or credit facilitation
- Generic ERP capabilities (HR, project management, etc.)
