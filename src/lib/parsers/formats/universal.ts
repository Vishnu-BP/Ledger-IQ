/**
 * @file universal.ts — Format-agnostic bank CSV column mapper.
 * @module lib/parsers/formats
 *
 * Handles any CSV by fuzzy-matching column headers to the five concepts we
 * need: date, description, debit, credit, balance. Works with:
 *   - Separate debit + credit columns (HDFC, ICICI, SBI, Axis, Kotak…)
 *   - Single signed amount column (+/- or parentheses for negatives)
 *   - Single amount + DR/CR type column (many cooperative/regional banks)
 *
 * Date format is auto-detected by sampling the first parseable cell against
 * a priority-ordered list of common formats.
 *
 * @dependencies date-fns, papaparse
 * @related lib/parsers/bankStatementParser.ts, lib/parsers/amounts.ts
 */

import { parse, isValid } from "date-fns";
import { parseAmount, parseBalance } from "@/lib/parsers/amounts";
import type { ParsedTransaction } from "@/lib/parsers/types";

// ─── Header fuzzy-match dictionaries ───────────────────────

const DATE_KEYWORDS = [
  "date", "txn date", "transaction date", "trans date", "posting date",
  "value date", "value dt", "tran date", "entry date", "book date",
];

const DESC_KEYWORDS = [
  "description", "narration", "particulars", "details", "remarks", "memo",
  "transaction details", "trans details", "transaction narration",
  "transaction description", "trans narration", "trans description",
  "beneficiary", "reference", "chq", "cheque", "instrument",
];

const DEBIT_KEYWORDS = [
  "debit", "withdrawal", "dr", "debit amount", "withdrawal amt",
  "debit amt", "amount dr", "dr amount", "withdrawl", "withdraw",
  "paid out", "debit(inr)", "debit(₹)",
];

const CREDIT_KEYWORDS = [
  "credit", "deposit", "cr", "credit amount", "deposit amt",
  "credit amt", "amount cr", "cr amount", "paid in", "received",
  "credit(inr)", "credit(₹)",
];

const AMOUNT_KEYWORDS = [
  "amount", "transaction amount", "trans amount", "tran amount",
  "net amount", "inr amount", "₹", "amt",
];

const TYPE_KEYWORDS = [
  "type", "dr/cr", "cr/dr", "transaction type", "trans type",
  "tran type", "drcr", "crdr", "debit credit",
];

const BALANCE_KEYWORDS = [
  "balance", "closing balance", "running balance", "available balance",
  "closing bal", "bal", "book balance", "ledger balance",
];

// ─── Date format candidates (priority order) ────────────────

const DATE_FORMAT_CANDIDATES = [
  "dd/MM/yyyy", "dd-MM-yyyy", "dd/MM/yy", "dd-MM-yy",
  "MM/dd/yyyy", "MM-dd-yyyy", "MM/dd/yy",
  "yyyy-MM-dd", "yyyy/MM/dd",
  "d/M/yyyy",   "d-M-yyyy",   "d/M/yy",
  "dd MMM yyyy", "dd-MMM-yyyy", "dd MMM yy",
  "MMM dd, yyyy", "MMM d, yyyy",
  "yyyy-MM-dd'T'HH:mm:ss",
];

// ─── Column mapping ─────────────────────────────────────────

interface ColumnMap {
  date: string;
  description: string;
  debit: string | null;
  credit: string | null;
  amount: string | null;   // single-column amount
  type: string | null;     // DR/CR indicator paired with amount
  balance: string | null;
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9\s/()₹]/g, "").replace(/\s+/g, " ");
}

function bestMatch(headers: string[], keywords: string[]): string | null {
  const normalized = headers.map((h) => ({ original: h, norm: normalize(h) }));

  // Exact match first
  for (const kw of keywords) {
    const hit = normalized.find((h) => h.norm === kw);
    if (hit) return hit.original;
  }

  // Starts-with match
  for (const kw of keywords) {
    const hit = normalized.find((h) => h.norm.startsWith(kw));
    if (hit) return hit.original;
  }

  // Contains match
  for (const kw of keywords) {
    const hit = normalized.find((h) => h.norm.includes(kw));
    if (hit) return hit.original;
  }

  return null;
}

export function detectColumns(headers: string[]): ColumnMap | null {
  const date = bestMatch(headers, DATE_KEYWORDS);
  const description = bestMatch(headers, DESC_KEYWORDS);

  if (!date || !description) return null;

  const debit = bestMatch(headers, DEBIT_KEYWORDS);
  const credit = bestMatch(headers, CREDIT_KEYWORDS);
  const amount = (debit || credit) ? null : bestMatch(headers, AMOUNT_KEYWORDS);
  const type = amount ? bestMatch(headers, TYPE_KEYWORDS) : null;
  const balance = bestMatch(headers, BALANCE_KEYWORDS);

  return { date, description, debit, credit, amount, type, balance };
}

// ─── Date format auto-detection ─────────────────────────────

export function detectDateFormat(
  rows: Record<string, string>[],
  dateCol: string,
): string | null {
  for (const row of rows.slice(0, 10)) {
    const raw = (row[dateCol] ?? "").trim();
    if (!raw) continue;
    for (const fmt of DATE_FORMAT_CANDIDATES) {
      const d = parse(raw, fmt, new Date());
      if (isValid(d) && d.getFullYear() > 1970) return fmt;
    }
  }
  return null;
}

// ─── Row parser ─────────────────────────────────────────────

function parseDate(raw: string, fmt: string): string | null {
  const d = parse(raw.trim(), fmt, new Date());
  return isValid(d) ? d.toISOString().slice(0, 10) : null;
}

function isCreditType(raw: string): boolean {
  const s = raw.trim().toLowerCase();
  return s === "cr" || s === "credit" || s === "c" || s.startsWith("cr");
}

export function buildUniversalRowParser(
  map: ColumnMap,
  dateFormat: string,
): (row: Record<string, string>) => ParsedTransaction | null {
  return (row) => {
    const dateRaw = (row[map.date] ?? "").trim();
    if (!dateRaw) return null;

    const transaction_date = parseDate(dateRaw, dateFormat);
    if (!transaction_date) return null;

    const description = (row[map.description] ?? "").trim();
    if (!description) return null;

    let debit_amount: string | null = null;
    let credit_amount: string | null = null;

    if (map.debit && map.credit) {
      // Standard split-column format
      debit_amount = parseAmount(row[map.debit]);
      credit_amount = parseAmount(row[map.credit]);
    } else if (map.amount) {
      const raw = (row[map.amount] ?? "").trim();
      const isCredit = map.type
        ? isCreditType(row[map.type] ?? "")
        : raw.startsWith("+") || (!raw.startsWith("-") && !raw.includes("("));

      // Parentheses = negative in some formats: (1,234.00)
      const cleaned = raw.replace(/^\((.+)\)$/, "-$1");
      const parsed = parseAmount(cleaned);
      if (isCredit) credit_amount = parsed;
      else debit_amount = parsed;
    }

    // Skip rows with no monetary value (header repetitions, section labels, etc.)
    if (!debit_amount && !credit_amount) return null;

    return {
      transaction_date,
      description,
      reference_number: null,
      debit_amount,
      credit_amount,
      closing_balance: map.balance ? parseBalance(row[map.balance]) : null,
    };
  };
}
