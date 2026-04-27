# 11 — Future Roadmap & Glossary

> Read this section for: vision pitch (what we tell judges is "Phase 2+"), and term definitions for Indian SMB / GST / fintech vocabulary.
> Cross-references: [00 — Overview](00-overview.md) §3 for the long-term vision.

Covers:
- Future Roadmap (Phase 2 / Phase 3 / Phase 4)
- Glossary

---

## 21. Future Roadmap

These items are explicitly Phase 2 — pitched to judges as the believable expansion path, not built during hackathon.

### Phase 2 (next 6 months post-hackathon)

- **Live bank sync via Account Aggregator framework** — eliminates manual upload
- **PDF parsing for non-CSV bank statements** — supports any bank
- **OCR for scanned statements** — supports legacy paper-based businesses
- **Direct GSTR filing via GSP/ASP partnership** — closes the compliance loop
- **Meesho, JioMart, Myntra settlement support** — broader marketplace coverage
- **ONDC integration** — first-class support for India's open commerce network
- **Mobile app (React Native)** — native iOS/Android
- **Multi-business / CA dashboard** — accountants managing multiple clients

### Phase 3 (6–18 months)

- **Inventory module** — SKU management, stock levels, supplier reorder triggers
- **Vendor intelligence** — pricing benchmarks, supplier scorecards
- **Receivables collections** — automated payment reminders
- **Lending facilitation** — partner with NBFCs to offer credit based on cash flow data
- **Budgeting & forecasting** — predictive cash flow models
- **AI tax planning assistant** — proactive tax-saving recommendations

### Phase 4 (18+ months)

- **Autonomous CFO mode** — agent makes routine financial decisions (vendor payments, GST filing, receivables follow-up) with human approval
- **API platform** — third-party integrations
- **White-label for banks** — embed LedgerIQ in bank SMB portals

---

## 22. Glossary

| Term | Definition |
|---|---|
| **SMB / MSME** | Small and Medium Business / Micro, Small and Medium Enterprise. India's MSME category covers businesses with turnover up to ₹250 Cr. |
| **GST** | Goods and Services Tax. India's unified indirect tax regime. |
| **GSTIN** | Goods and Services Tax Identification Number. 15-character unique ID for GST-registered businesses. |
| **GSTR-3B** | Monthly summary GST return form. Most common filing for SMBs. |
| **ITC** | Input Tax Credit. GST paid on business purchases that can be offset against GST collected on sales. |
| **TCS** | Tax Collected at Source. 1% deducted by marketplaces (Amazon, Flipkart) on each sale, claimable by seller. |
| **TDS** | Tax Deducted at Source. Income tax deducted at the point of payment. |
| **NEFT / RTGS / IMPS / UPI** | Indian payment rails. NEFT/RTGS for large bank transfers, IMPS for instant, UPI for retail digital payments. |
| **Settlement Report** | A marketplace's transaction-level breakdown of a payout — what was paid, what was deducted, why. |
| **Reconciliation** | The process of matching expected payouts (from settlement reports) against actual bank credits. |
| **Account Aggregator** | India's regulated framework for sharing financial data between institutions with user consent. |
| **GSP / ASP** | GST Suvidha Provider / Application Service Provider. Licensed intermediaries authorized to file GST returns via API. |
| **Channel** | The path through which a business earns revenue — offline, online via marketplace, direct B2B, etc. |
| **Burn rate** | The rate at which a business is consuming cash, typically expressed monthly. |
| **Runway** | How long a business can operate at current burn rate before running out of cash. |
| **RLS** | Row-Level Security. Postgres feature for policy-based access control at the row level. |
