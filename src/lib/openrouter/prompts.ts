/**
 * @file prompts.ts — Prompt builders for the categorization pipeline.
 * @module lib/openrouter
 *
 * Pure functions — no I/O. Each builder returns a ChatMessage[] ready to
 * hand to LLMClient.chat. Prompts adapted from PRD §13.4 (bulk) and §13.3
 * (edge case). Anomaly + reconciliation prompts ship with their respective
 * Layer 4 stages.
 *
 * @related types.ts, models.ts, lib/categorization/bulkLlama.ts
 */

import type { ChatMessage } from "./types";

export interface BusinessContext {
  business_type: string;
  channels: string[];
  state: string;
  has_gstin: boolean;
}

export interface BulkTransaction {
  index: number;
  date: string;
  description: string;
  amount: string;
  direction: "debit" | "credit";
}

const SYSTEM_BULK = `You are a financial transaction classifier for Indian small businesses.
You return ONLY a JSON object that strictly conforms to the schema described in the user message.
Never include explanatory prose, code fences, or trailing commentary.`;

export function buildBulkCategorizationPrompt(
  business: BusinessContext,
  txns: BulkTransaction[],
  validCategories: string[],
  validChannels: readonly string[],
): ChatMessage[] {
  const txnLines = txns
    .map(
      (t) =>
        `${t.index}. Date: ${t.date}, Description: "${t.description}", Amount: ${t.amount} (${t.direction})`,
    )
    .join("\n");

  const user = `Business context:
- Business type: ${business.business_type}
- Sales channels: ${business.channels.join(", ") || "none specified"}
- State: ${business.state}
- GST registered: ${business.has_gstin ? "Yes" : "No"}

Categorize each transaction. Return JSON of shape:
{ "results": [
    { "index": <number>, "category": "<one of valid categories>", "channel": "<one of valid channels>", "confidence": <0.0-1.0>, "reasoning": "<one-line explanation>" }
] }

Valid categories:
${validCategories.map((c) => `- ${c}`).join("\n")}

Valid channels:
${validChannels.map((c) => `- ${c}`).join("\n")}

Transactions:
${txnLines}`;

  return [
    { role: "system", content: SYSTEM_BULK },
    { role: "user", content: user },
  ];
}

const SYSTEM_EDGE = `You are a senior accounts reviewer for an Indian small business.
A bulk classifier was uncertain about the transaction below. Use the additional
context (business profile + similar past transactions) to decide.
Return ONLY a JSON object — no prose, no fences.`;

export interface EdgeCaseTransaction extends BulkTransaction {
  /** Optional bank reference / counterparty hint. */
  reference?: string | null;
}

export interface SimilarPastTransaction {
  date: string;
  description: string;
  amount: string;
  category: string | null;
  channel: string | null;
}

export function buildEdgeCasePrompt(
  business: BusinessContext,
  txn: EdgeCaseTransaction,
  similarPast: SimilarPastTransaction[],
  validCategories: string[],
  validChannels: readonly string[],
): ChatMessage[] {
  const similarLines =
    similarPast.length === 0
      ? "(none)"
      : similarPast
          .map(
            (s) =>
              `- ${s.date} | "${s.description}" | ${s.amount} | category=${s.category ?? "?"}, channel=${s.channel ?? "?"}`,
          )
          .join("\n");

  const user = `Business:
- Type: ${business.business_type}
- Channels: ${business.channels.join(", ") || "none"}
- State: ${business.state}
- GST registered: ${business.has_gstin ? "Yes" : "No"}

Transaction to classify:
- Date: ${txn.date}
- Description: "${txn.description}"
- Amount: ${txn.amount} (${txn.direction})
- Reference: ${txn.reference ?? "(none)"}

Similar past transactions for this business:
${similarLines}

Valid categories:
${validCategories.map((c) => `- ${c}`).join("\n")}

Valid channels:
${validChannels.map((c) => `- ${c}`).join("\n")}

Return JSON:
{ "category": "<one of valid categories>", "channel": "<one of valid channels>", "confidence": <0.0-1.0>, "reasoning": "<2-3 sentence justification>" }`;

  return [
    { role: "system", content: SYSTEM_EDGE },
    { role: "user", content: user },
  ];
}

// ─── Anomaly explanation ────────────────────────────────────────

const SYSTEM_ANOMALY = `You are a financial advisor explaining anomalies in simple language to an Indian small business owner.
Return ONLY a JSON object — no prose, no fences.`;

export interface AnomalyContext {
  type: string;
  metadata: Record<string, unknown>;
  business_type: string;
}

export function buildAnomalyExplanationPrompt(
  ctx: AnomalyContext,
): ChatMessage[] {
  const user = `Anomaly type: ${ctx.type}
Business type: ${ctx.business_type}
Details: ${JSON.stringify(ctx.metadata, null, 2)}

Generate a plain-English explanation for this anomaly. Return JSON:
{ "explanation": "<2-3 sentences: what was detected, why it matters, suggested next action>" }`;

  return [
    { role: "system", content: SYSTEM_ANOMALY },
    { role: "user", content: user },
  ];
}

// ─── Reconciliation discrepancy ─────────────────────────────────

const SYSTEM_RECON = `You are a financial reconciliation expert explaining Amazon seller payout discrepancies to an Indian small business owner.
Return ONLY a JSON object — no prose, no fences.`;

export interface ReconciliationContext {
  expected_amount: string;
  actual_amount: string;
  discrepancy: string;
  discrepancy_type: string;
  affected_order_ids: string[];
  settlement_details: Record<string, unknown>;
}

export function buildReconciliationPrompt(
  ctx: ReconciliationContext,
): ChatMessage[] {
  const user = `Expected payout (from settlement): ₹${ctx.expected_amount}
Actual bank credit: ₹${ctx.actual_amount}
Gap: ₹${ctx.discrepancy}
Discrepancy type: ${ctx.discrepancy_type}
Affected orders: ${ctx.affected_order_ids.slice(0, 6).join(", ")}
Settlement details: ${JSON.stringify(ctx.settlement_details, null, 2)}

Generate a clear explanation for the seller. Return JSON:
{ "explanation": "<3-4 sentences: likely cause, amount owed, recommended action (e.g. raise dispute via Amazon Seller Central)>" }`;

  return [
    { role: "system", content: SYSTEM_RECON },
    { role: "user", content: user },
  ];
}
