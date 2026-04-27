# LedgerIQ — Product Requirements Document

**Version:** 1.0
**Date:** April 27, 2026
**Status:** Locked for hackathon build
**Build window:** ~17 productive hours (24-hour hackathon)

---

## Document Purpose

This is the canonical product specification for LedgerIQ, split into focused sections under [prd/](prd/). Every engineering, design, and scope decision flows from these documents.

This is **not** the operational manual for Claude Code — that lives in [`CLAUDE.md`](../CLAUDE.md). This document defines the *product*; CLAUDE.md defines *how the codebase is structured and modified*.

---

## How to use this PRD

Don't read all 12 sections every time. **Read the sections relevant to the work area:**

| Working on... | Read |
|---|---|
| Anything (always) | [00 — Overview](prd/00-overview.md) for product context |
| New feature, user flow, or journey | [01 — Features & User Journeys](prd/01-features.md) |
| Architecture, folder layout, subsystem boundaries | [02 — Architecture (HLD + LLD)](prd/02-architecture.md) |
| Database schema, migrations, RLS, Drizzle models | [03 — Database Schema](prd/03-database.md) |
| Route handlers, request/response shapes | [04 — API Specification](prd/04-api.md) |
| OpenRouter, prompts, model selection | [05 — AI Integration](prd/05-ai-integration.md) |
| Categorization, reconciliation, anomaly logic | [06 — Key Algorithms](prd/06-algorithms.md) |
| Pages, components, design tokens, empty/loading/error states | [07 — UI/UX Specification](prd/07-ui-ux.md) |
| Coding conventions, SOLID, package choices | [08 — Engineering Principles & Tech Stack](prd/08-engineering.md) |
| Sequencing work; deciding what's in/out for the current session | [09 — Layered Build Plan](prd/09-build-plan.md) |
| Demo prep, risk planning, fallback strategy | [10 — Risks & Demo Strategy](prd/10-risks-demo.md) |
| Vision pitch, terminology lookup | [11 — Future Roadmap & Glossary](prd/11-roadmap-glossary.md) |

---

## Table of Contents

1. [Overview — Executive Summary, Problem, Vision, Personas, Goals, Scope](prd/00-overview.md)
2. [Features & User Journeys](prd/01-features.md)
3. [Architecture — HLD + LLD](prd/02-architecture.md)
4. [Database Schema (8 tables + RLS)](prd/03-database.md)
5. [API Specification](prd/04-api.md)
6. [AI Integration (OpenRouter, prompts, two-tier pipeline)](prd/05-ai-integration.md)
7. [Key Algorithms (categorization, reconciliation, anomalies, cash flow)](prd/06-algorithms.md)
8. [UI/UX Specification](prd/07-ui-ux.md)
9. [Engineering Principles & Tech Stack](prd/08-engineering.md)
10. [Layered Build Plan (5 layers, ~17h)](prd/09-build-plan.md)
11. [Risks, Constraints & Demo Strategy](prd/10-risks-demo.md)
12. [Future Roadmap & Glossary](prd/11-roadmap-glossary.md)

---

**End of PRD index**

This document is the canonical source of truth for the LedgerIQ product. Engineering decisions reference these documents. Scope debates reference these documents. [`CLAUDE.md`](../CLAUDE.md) implements what these documents specify.
