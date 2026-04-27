# 05 — AI Integration

> Read this section for: OpenRouter setup, model selection, prompt templates, cost budget, fallback strategy.
> Cross-references: [06 — Algorithms](06-algorithms.md) for the categorization pipeline, [02 — Architecture](02-architecture.md) for the AI subsystem boundary.

Covers:
- Provider & model selection
- Two-tier categorization design
- Prompt templates (bulk, anomaly, reconciliation)
- Cost & rate-limit strategy

---

## 13. AI Integration Specification

### 13.1 Provider

OpenRouter is the single AI gateway. One API key, three models.

### 13.2 Model selection

| Model | Used for | Cost (approximate) |
|---|---|---|
| Llama 3.3 70B Instruct | Bulk categorization (first pass) | ~$0.0005 per transaction |
| Claude Sonnet 4.6 | Edge-case categorization, anomaly explanations, reconciliation reasoning, executive summaries | ~$0.005 per call |
| Gemini Flash (fallback) | If Llama is rate-limited | Comparable to Llama |

### 13.3 Two-tier categorization

**Tier 1 — Bulk (Llama)**

Batched: 20 transactions per call. Prompt asks for JSON array of categorizations. Each transaction gets `category, channel, gst_head, confidence, reasoning`.

If `confidence < 0.85`, transaction is queued for Tier 2.

**Tier 2 — Edge case (Claude)**

One transaction per call, with extended context: similar past transactions, business profile, vendor history. Returns reasoned categorization.

### 13.4 Prompt template — bulk categorization

```
You are a financial transaction classifier for Indian small businesses.

Business context:
- Business type: {business_type}
- Sales channels: {channels}
- State: {state}
- GST registered: {gstin ? 'Yes' : 'No'}

Categorize each transaction below. Return ONLY a JSON array.

Categories:
{list of valid categories from gst_categories}

Channels:
{list of valid channels}

Transactions:
1. Date: {date}, Description: "{description}", Amount: {amount} {debit/credit}
2. ...

For each, return:
{
  "index": <number>,
  "category": "<category from list>",
  "channel": "<channel from list>",
  "gst_head": "<derived from category>",
  "confidence": <0.0 to 1.0>,
  "reasoning": "<one-line explanation>"
}
```

### 13.5 Prompt template — anomaly explanation

```
This anomaly was detected by rule-based logic. Generate a one-paragraph
plain-English explanation suitable for a small business owner.

Anomaly type: {type}
Details: {metadata}
Business context: {business_type}

Explanation should:
- State what was detected in plain language
- Provide quantitative context (how unusual it is)
- Suggest a next action (verify, dispute, ignore)
- Be 2-3 sentences max
```

### 13.6 Prompt template — reconciliation discrepancy

```
A discrepancy was found between an Amazon settlement report and the bank credit.

Expected payout (from settlement): ₹{expected}
Actual bank credit: ₹{actual}
Gap: ₹{discrepancy}

Settlement details:
- {N} successful orders totaling ₹{X}
- {M} refunds totaling ₹{Y}
- Commissions deducted: ₹{Z}
- Refund commission reversals: {A} expected, {B} actual

Affected order IDs: {list}

Generate a clear explanation for the seller including:
1. What's likely causing the discrepancy
2. How much they should be owed
3. What action to take (dispute via Seller Central, etc.)

Keep under 4 sentences.
```

### 13.7 Cost & rate limit strategy

For a typical user with 200 transactions per upload:
- 10 batched calls to Llama → $0.10
- ~20 individual Claude calls for edge cases → $0.10
- 5 anomaly explanations → $0.025
- 3 reconciliation explanations → $0.015
- 1 executive summary → $0.02
- **Total per upload: ~$0.26**

With Claude Code Max plan and OpenRouter free credits, demo and testing budget is comfortably <$10 across the entire build.

If OpenRouter rate-limits Llama, fall back to Gemini Flash automatically (configured in OpenRouter routing rules).
