# 04 — API Specification

> Read this section for: Next.js Route Handler contracts, request/response shapes, error codes.
> Cross-references: [02 — Architecture](02-architecture.md) for the route handler layer rules, [03 — Database](03-database.md) for the underlying tables.

Covers:
- All `/api/*` route handlers (Next.js App Router)
- Request/response JSON contracts
- Error codes and edge cases

---

## 12. API Specification

All API routes are Next.js Route Handlers. All authenticated routes require valid Supabase session.

### 12.1 `POST /api/upload`

Upload a bank statement or settlement CSV.

**Request:**
```
Content-Type: multipart/form-data
Body: { file: File, type: 'bank_statement' | 'amazon_settlement' | 'flipkart_settlement' }
```

**Response (200):**
```json
{
  "id": "uuid",
  "type": "bank_statement",
  "status": "parsing",
  "filename": "april2026.csv",
  "estimated_completion_seconds": 8
}
```

**Errors:**
- 400: invalid file format
- 409: duplicate file (hash already exists)
- 413: file too large (>10MB)

### 12.2 `POST /api/categorize`

Run categorization on uncategorized transactions for the user's business.

**Request:**
```json
{ "business_id": "uuid", "force_recategorize": false }
```

**Response (202 Accepted):**
```json
{
  "queued_transactions": 47,
  "estimated_completion_seconds": 12
}
```

### 12.3 `POST /api/reconcile`

Reconcile a settlement against bank transactions.

**Request:**
```json
{ "settlement_id": "uuid" }
```

**Response (200):**
```json
{
  "settlement_id": "uuid",
  "expected_total": 218400.00,
  "actual_total": 217440.00,
  "discrepancy": 960.00,
  "discrepancies": [
    {
      "id": "uuid",
      "type": "missing_commission_reversal",
      "amount": 160.00,
      "affected_order_ids": ["402-1234567-1234567", "..."],
      "explanation": "Amazon refunded ..."
    }
  ]
}
```

### 12.4 `GET /api/transactions`

List transactions with filters.

**Query params:**
- `start_date`, `end_date`
- `category`, `channel`
- `min_amount`, `max_amount`
- `limit`, `offset`

**Response (200):**
```json
{
  "transactions": [...],
  "total_count": 247,
  "filters_applied": {...}
}
```

### 12.5 `PATCH /api/transactions/:id`

Update a transaction (user override).

**Request:**
```json
{
  "category": "Software Subscriptions",
  "channel": "OPERATING_EXPENSE",
  "apply_to_similar": true
}
```

**Response (200):**
```json
{
  "transaction": {...},
  "similar_updated_count": 3
}
```

### 12.6 `POST /api/anomalies/detect`

Run anomaly detection.

**Request:**
```json
{ "business_id": "uuid", "period_start": "2026-04-01", "period_end": "2026-04-30" }
```

**Response (200):**
```json
{
  "anomalies": [...],
  "count_by_severity": { "high": 2, "medium": 5, "low": 3 }
}
```

### 12.7 `GET /api/reports/summary`

Get aggregated data for report rendering.

**Query params:**
- `period_start`, `period_end`

**Response (200):**
```json
{
  "business": {...},
  "period": { "start": "2026-04-01", "end": "2026-04-30" },
  "totals": {
    "total_revenue": 775000.00,
    "total_expenses": 480000.00,
    "net_income": 295000.00,
    "gst_liability": 47200.00,
    "itc_available": 12400.00
  },
  "by_category": [...],
  "by_channel": [...],
  "anomaly_count": 3,
  "reconciliation_summary": {...}
}
```

### 12.8 `POST /api/reports/narrative`

Generate AI executive summary for the report.

**Request:**
```json
{ "summary_data": {...} }
```

**Response (200):**
```json
{
  "narrative": "In April 2026, your business processed ₹7,75,000..."
}
```
