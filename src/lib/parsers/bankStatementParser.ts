/**
 * @file bankStatementParser.ts — Top-level bank statement CSV parser.
 * @module lib/parsers
 *
 * Detects the bank format from the header signature, then dispatches each
 * row through the format-specific normalizer. Returns a uniform
 * ParserResult regardless of which bank exported the CSV.
 *
 * Supported banks (Layer 2 scope): HDFC, ICICI. New banks plug in by
 * adding a `formats/<bank>.ts` with `is<Bank>Header` + `parse<Bank>Row`
 * exports and registering them here. Open/closed per CLAUDE.md SOLID.
 *
 * @dependencies papaparse
 * @related app/api/upload/route.ts, lib/uploads/uploadStatement.ts
 */

import Papa from "papaparse";

import { isHdfcHeader, parseHdfcRow } from "@/lib/parsers/formats/hdfc";
import { isIciciHeader, parseIciciRow } from "@/lib/parsers/formats/icici";
import {
  type BankFormat,
  ParseError,
  type ParsedTransaction,
  type ParserResult,
} from "@/lib/parsers/types";

interface FormatHandler {
  format: BankFormat;
  isMatch: (headers: string[]) => boolean;
  parseRow: (row: Record<string, string>) => ParsedTransaction | null;
}

const FORMAT_HANDLERS: FormatHandler[] = [
  { format: "hdfc", isMatch: isHdfcHeader, parseRow: parseHdfcRow },
  { format: "icici", isMatch: isIciciHeader, parseRow: parseIciciRow },
];

export function parseBankStatement(csvText: string): ParserResult {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  // Fatal Papa errors (broken quotes, etc.) — non-fatal warnings (extra delimiters
  // in some rows) are common in bank exports and shouldn't kill the parse.
  const fatal = result.errors.find(
    (e) => e.code === "MissingQuotes" || e.code === "InvalidQuotes",
  );
  if (fatal) {
    throw new ParseError("malformed_csv", `Malformed CSV: ${fatal.message}`);
  }

  const headers = result.meta.fields ?? [];
  if (headers.length === 0) {
    throw new ParseError("empty_csv", "CSV has no header row");
  }

  const handler = FORMAT_HANDLERS.find((h) => h.isMatch(headers));
  if (!handler) {
    throw new ParseError(
      "unknown_format",
      `Unrecognized bank format. Expected HDFC or ICICI columns; got: ${headers.join(", ")}`,
    );
  }

  const transactions: ParsedTransaction[] = [];
  for (const row of result.data) {
    const parsed = handler.parseRow(row);
    if (parsed) transactions.push(parsed);
  }

  if (transactions.length === 0) {
    throw new ParseError("no_transactions", "CSV has no transaction rows");
  }

  // Period: min/max of transaction_date (ISO strings sort lexicographically).
  const sorted = [...transactions].sort((a, b) =>
    a.transaction_date.localeCompare(b.transaction_date),
  );

  return {
    bank: handler.format,
    transactions,
    period_start: sorted[0].transaction_date,
    period_end: sorted[sorted.length - 1].transaction_date,
  };
}
