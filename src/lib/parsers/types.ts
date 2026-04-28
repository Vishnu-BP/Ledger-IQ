/**
 * @file types.ts — Bank statement parser shared types.
 * @module lib/parsers
 *
 * `ParsedTransaction` is the format-agnostic shape every per-bank normalizer
 * outputs. The orchestrator (`bankStatementParser.ts`) then maps these onto
 * `transactions` table inserts. Numeric values are stored as strings because
 * postgres-js round-trips numeric/decimal columns as strings to preserve
 * precision — matches db/schema.ts.
 *
 * @related lib/parsers/bankStatementParser.ts, db/schema.ts
 */

export type BankFormat = "hdfc" | "icici" | "universal";

export interface ParsedTransaction {
  /** ISO date 'YYYY-MM-DD' */
  transaction_date: string;
  description: string;
  reference_number: string | null;
  /** Numeric as string with 2 decimal places, or null if no debit on this row. */
  debit_amount: string | null;
  /** Numeric as string with 2 decimal places, or null if no credit on this row. */
  credit_amount: string | null;
  /** Numeric as string with 2 decimal places, or null if missing. */
  closing_balance: string | null;
}

export interface ParserResult {
  bank: BankFormat;
  transactions: ParsedTransaction[];
  /** ISO date of the earliest transaction. */
  period_start: string | null;
  /** ISO date of the latest transaction. */
  period_end: string | null;
}

export class ParseError extends Error {
  constructor(
    public readonly code: ParseErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ParseError";
  }
}

export type ParseErrorCode =
  | "empty_csv"
  | "malformed_csv"
  | "unknown_format"
  | "no_transactions"
  | "invalid_date"
  | "invalid_row";

// ─── Settlement types ───────────────────────────────────────────

export interface ParsedSettlementLine {
  order_id: string | null;
  transaction_type: string | null;
  amount_type: string | null;
  amount_description: string | null;
  /** Signed numeric string: positive = credit to seller, negative = debit. */
  amount: string | null;
  posted_date: string | null; // ISO YYYY-MM-DD
  sku: string | null;
  quantity_purchased: number | null;
}

export interface ParsedSettlement {
  settlement_id_external: string;
  period_start: string | null;
  period_end: string | null;
  deposit_date: string | null;
  /** Absolute net disbursement amount. */
  total_amount: string;
  currency: string;
  lines: ParsedSettlementLine[];
}
