/**
 * @file hdfc.ts — HDFC Bank CSV format detector + row normalizer.
 * @module lib/parsers/formats
 *
 * HDFC's standard net-banking CSV export columns (case-insensitive):
 *   Date, Narration, Chq./Ref.No., Value Dt, Withdrawal Amt., Deposit Amt., Closing Balance
 *
 * Date format is dd/MM/yy (HDFC uses 2-digit year by default; we also accept
 * 4-digit as fallback). Amounts are Indian-formatted ("1,23,456.78"), with
 * the inactive side blank.
 *
 * @related lib/parsers/bankStatementParser.ts
 */

import { parse } from "date-fns";

import { parseAmount, parseBalance } from "@/lib/parsers/amounts";
import { ParseError, type ParsedTransaction } from "@/lib/parsers/types";

const DATE_FORMATS = ["dd/MM/yy", "dd/MM/yyyy", "dd-MM-yy", "dd-MM-yyyy"];

const REQUIRED_HEADERS_LOWER = [
  "narration",
  "withdrawal amt.",
  "deposit amt.",
  "closing balance",
];

export function isHdfcHeader(headers: string[]): boolean {
  const set = new Set(headers.map((h) => h.trim().toLowerCase()));
  return REQUIRED_HEADERS_LOWER.every((req) => set.has(req));
}

export function parseHdfcRow(
  row: Record<string, string>,
): ParsedTransaction | null {
  const dateRaw = (row["Date"] ?? "").trim();
  if (!dateRaw) return null;

  const date = tryParseDate(dateRaw);
  if (!date) {
    throw new ParseError(
      "invalid_date",
      `HDFC: unparseable date "${dateRaw}"`,
    );
  }

  return {
    transaction_date: date.toISOString().slice(0, 10),
    description: (row["Narration"] ?? "").trim(),
    reference_number: (row["Chq./Ref.No."] ?? "").trim() || null,
    debit_amount: parseAmount(row["Withdrawal Amt."]),
    credit_amount: parseAmount(row["Deposit Amt."]),
    closing_balance: parseBalance(row["Closing Balance"]),
  };
}

function tryParseDate(raw: string): Date | null {
  for (const fmt of DATE_FORMATS) {
    const d = parse(raw, fmt, new Date());
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}
