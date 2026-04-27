/**
 * @file icici.ts — ICICI Bank CSV format detector + row normalizer.
 * @module lib/parsers/formats
 *
 * ICICI's standard CSV export columns (case-insensitive):
 *   S No., Value Date, Transaction Date, Cheque Number, Transaction Remarks,
 *   Withdrawal Amount (INR), Deposit Amount (INR), Balance (INR)
 *
 * Date format is dd-MM-yyyy (sometimes dd/MM/yyyy). Amounts are
 * Indian-formatted with explicit "(INR)" suffix on column headers.
 *
 * @related lib/parsers/bankStatementParser.ts
 */

import { parse } from "date-fns";

import { parseAmount, parseBalance } from "@/lib/parsers/amounts";
import { ParseError, type ParsedTransaction } from "@/lib/parsers/types";

const DATE_FORMATS = ["dd-MM-yyyy", "dd/MM/yyyy", "dd-MM-yy", "dd/MM/yy"];

const REQUIRED_HEADERS_LOWER = [
  "transaction remarks",
  "withdrawal amount (inr)",
  "deposit amount (inr)",
  "balance (inr)",
];

export function isIciciHeader(headers: string[]): boolean {
  const set = new Set(headers.map((h) => h.trim().toLowerCase()));
  return REQUIRED_HEADERS_LOWER.every((req) => set.has(req));
}

export function parseIciciRow(
  row: Record<string, string>,
): ParsedTransaction | null {
  // Prefer Transaction Date; fall back to Value Date.
  const dateRaw =
    (row["Transaction Date"] ?? "").trim() ||
    (row["Value Date"] ?? "").trim();
  if (!dateRaw) return null;

  const date = tryParseDate(dateRaw);
  if (!date) {
    throw new ParseError(
      "invalid_date",
      `ICICI: unparseable date "${dateRaw}"`,
    );
  }

  return {
    transaction_date: date.toISOString().slice(0, 10),
    description: (row["Transaction Remarks"] ?? "").trim(),
    reference_number: (row["Cheque Number"] ?? "").trim() || null,
    debit_amount: parseAmount(row["Withdrawal Amount (INR)"]),
    credit_amount: parseAmount(row["Deposit Amount (INR)"]),
    closing_balance: parseBalance(row["Balance (INR)"]),
  };
}

function tryParseDate(raw: string): Date | null {
  for (const fmt of DATE_FORMATS) {
    const d = parse(raw, fmt, new Date());
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}
