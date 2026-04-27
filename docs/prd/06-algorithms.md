# 06 — Key Algorithms

> Read this section for: pseudocode for the AI brain — categorization pipeline, reconciliation matching, anomaly detection, cash flow.
> Cross-references: [05 — AI Integration](05-ai-integration.md) for prompts, [03 — Database](03-database.md) for the tables read/written.

Covers:
- Two-tier categorization pipeline
- Reconciliation matching
- Anomaly detection (missing recurring, duplicates)
- Cash flow + runway calculation

---

## 14. Key Algorithms

### 14.1 Two-tier categorization pipeline

```
function categorizeTransactions(business_id):
  txns = fetchUncategorizedTransactions(business_id)

  # Step 1: rule-based pre-categorization (instant, no LLM)
  for txn in txns:
    if txn.description matches knownPattern (e.g., "ZOMATO"):
      txn.category = patternCategory
      txn.confidence = 1.0
      txn.model_used = 'rule-based'

  # Step 2: bulk LLM for unmatched
  unmatched = txns where category is NULL
  for batch in chunks(unmatched, 20):
    response = openrouter.complete(
      model='llama-3.3-70b',
      prompt=buildBulkPrompt(batch, business_context)
    )
    parsed = parseJSON(response)
    for item in parsed:
      txn = batch[item.index]
      txn.category = item.category
      txn.channel = item.channel
      txn.confidence = item.confidence
      txn.ai_reasoning = item.reasoning
      txn.model_used = 'llama-3.3-70b'

  # Step 3: edge-case review for low confidence
  lowConfidence = txns where confidence < 0.85
  for txn in lowConfidence:
    context = fetchSimilarPastTransactions(txn, business_id)
    response = openrouter.complete(
      model='claude-sonnet-4.6',
      prompt=buildEdgeCasePrompt(txn, context, business_context)
    )
    update txn with response
    txn.model_used = 'claude-sonnet-4.6'

  # Step 4: GST mapping (deterministic lookup)
  for txn in txns:
    gst = gst_categories.find(category=txn.category)
    txn.gst_head = gst.gst_section
    txn.gst_rate = gst.gst_rate
    txn.gst_amount = computeGstAmount(txn.amount, gst.gst_rate)

  saveAll(txns)
```

### 14.2 Reconciliation matching

```
function reconcile(settlement_id):
  settlement = fetchSettlement(settlement_id)
  lines = fetchSettlementLines(settlement_id)

  # Sum settlement by transaction type
  expected_payout = sum(lines where transaction_type = 'order') -
                    sum(lines where amount_type IN ('commission', 'shipping', 'fees')) -
                    sum(lines where transaction_type = 'refund')

  # Find matching bank credits in date range
  bank_credits = fetchTransactions(
    business_id=settlement.business_id,
    channel=ONLINE_AMAZON,
    date_range=[settlement.period_start, settlement.deposit_date + 5 days]
  )
  actual_payout = sum(bank_credits.credit_amount)

  discrepancy = expected_payout - actual_payout

  if abs(discrepancy) > 10:  # ignore rounding noise
    # Identify which lines caused the gap
    discrepancies = analyzeDiscrepancies(lines, bank_credits)

    for d in discrepancies:
      explanation = claude.explainDiscrepancy(d, settlement)
      saveReconciliation({
        settlement_id,
        expected_amount: d.expected,
        actual_amount: d.actual,
        discrepancy: d.gap,
        affected_order_ids: d.orders,
        discrepancy_type: d.type,
        ai_explanation: explanation
      })

  return discrepancies
```

### 14.3 Anomaly detection — missing recurring

```
function detectMissingRecurring(business_id, period_end):
  # Find transactions that recurred in past 90 days
  recurring_patterns = SQL: """
    SELECT counterparty_name, AVG(debit_amount) as expected_amount,
           AVG(EXTRACT(DAY FROM transaction_date)) as expected_day,
           COUNT(*) as occurrences
    FROM transactions
    WHERE business_id = $1
      AND transaction_date BETWEEN period_end - 90 days AND period_end - 1 day
      AND counterparty_name IS NOT NULL
    GROUP BY counterparty_name
    HAVING COUNT(*) >= 3 AND STDDEV(EXTRACT(DAY FROM transaction_date)) < 5
  """

  for pattern in recurring_patterns:
    expected_date_this_period = period_end with day = pattern.expected_day
    if today > expected_date_this_period + 3 day grace:
      # Check if it appeared this period
      this_period_match = SQL: """
        SELECT * FROM transactions
        WHERE counterparty_name = $1
          AND transaction_date >= period_start
          AND debit_amount BETWEEN $2 * 0.8 AND $2 * 1.2
      """, pattern.counterparty_name, pattern.expected_amount

      if not this_period_match:
        createAnomaly({
          type: 'missing_recurring',
          severity: 'high',
          title: f"Missing recurring payment to {pattern.counterparty_name}",
          metadata: {
            expected_amount: pattern.expected_amount,
            expected_day: pattern.expected_day,
            historical_consistency: pattern.occurrences,
            days_overdue: today - expected_date_this_period
          }
        })
```

### 14.4 Anomaly detection — duplicate

```
function detectDuplicates(business_id):
  duplicates = SQL: """
    SELECT t1.id, t2.id
    FROM transactions t1
    JOIN transactions t2 ON
      t1.business_id = t2.business_id AND
      t1.id < t2.id AND
      t1.debit_amount = t2.debit_amount AND
      t1.counterparty_name = t2.counterparty_name AND
      ABS(EXTRACT(EPOCH FROM (t2.transaction_date - t1.transaction_date))) < 86400
    WHERE t1.business_id = $1
  """

  for (t1, t2) in duplicates:
    createAnomaly({
      type: 'duplicate',
      severity: 'medium',
      transaction_id: t2.id,
      title: f"Possible duplicate charge",
      metadata: { original_id: t1.id, amount: t1.debit_amount }
    })
```

### 14.5 Cash flow + runway calculation

```
function computeCashFlow(business_id, days_back=90):
  daily = SQL: """
    SELECT transaction_date,
           SUM(credit_amount) as inflow,
           SUM(debit_amount) as outflow
    FROM transactions
    WHERE business_id = $1
      AND transaction_date >= CURRENT_DATE - $2
    GROUP BY transaction_date
    ORDER BY transaction_date
  """, business_id, days_back

  current_balance = mostRecentTransaction(business_id).closing_balance
  avg_daily_burn = AVG(daily.outflow - daily.inflow) over last 30 days

  runway_days = current_balance / max(avg_daily_burn, 1)

  return { daily, current_balance, avg_daily_burn, runway_days }
```
