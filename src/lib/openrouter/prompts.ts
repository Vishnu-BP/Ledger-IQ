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
