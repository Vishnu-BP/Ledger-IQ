/**
 * @file amazonSettlementParser.ts — Parses Amazon seller settlement CSVs.
 * @module lib/parsers
 *
 * Accepts the simplified LedgerIQ demo format (comma-separated, 9 columns)
 * AND the standard Amazon V2 Flat File format (tab-separated with additional
 * columns). Detection: if the header contains "Settlement ID" we treat it as
 * an Amazon settlement; if tab-separated, switch delimiter accordingly.
 *
 * Settlement metadata (settlement_id_external, period, deposit_date,
 * total_amount) is extracted from the data rows:
 *   - settlement_id_external = the "Settlement ID" cell (consistent across rows)
 *   - period_start/end = min/max of all non-Transfer posted_dates
 *   - deposit_date = posted_date of the Transfer/disbursement row
 *   - total_amount = absolute value of Transfer row's amount (or sum of credits
 *     if no explicit Transfer row is present)
 *
 * @dependencies papaparse, date-fns
 * @related lib/uploads/uploadSettlement.ts, lib/parsers/types.ts
 */

import { parse as parseDate, isValid } from "date-fns";
import Papa from "papaparse";

import { ParseError, type ParsedSettlement, type ParsedSettlementLine } from "./types";

const DATE_FORMATS = ["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "dd-MM-yyyy"];

function parseSettlementDate(raw: string | undefined | null): string | null {
  if (!raw || !raw.trim()) return null;
  const s = raw.trim();
  for (const fmt of DATE_FORMATS) {
    const d = parseDate(s, fmt, new Date());
    if (isValid(d)) return d.toISOString().slice(0, 10);
  }
  return null;
}

function parseAmount(raw: string | undefined | null): number | null {
  if (!raw || !raw.trim()) return null;
  const n = Number(raw.replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

export function parseAmazonSettlement(csvText: string): ParsedSettlement {
  // Detect delimiter: tab-separated V2 format uses \t, demo uses comma.
  const firstLine = csvText.split("\n")[0] ?? "";
  const delimiter = firstLine.includes("\t") ? "\t" : ",";

  const result = Papa.parse<Record<string, string>>(csvText.trim(), {
    header: true,
    skipEmptyLines: true,
    delimiter,
    transformHeader: (h) => h.trim().toLowerCase().replace(/[\s()]/g, "_"),
  });

  if (!result.data || result.data.length === 0) {
    throw new ParseError("empty_csv", "Amazon settlement file is empty");
  }

  // Normalise column names — handle both demo format + V2 format.
  const first = result.data[0];
  const settlementIdKey = Object.keys(first).find((k) =>
    k.includes("settlement") && k.includes("id"),
  );
  if (!settlementIdKey) {
    throw new ParseError(
      "unknown_format",
      "Not an Amazon settlement file: missing settlement ID column",
    );
  }

  const settlementId = first[settlementIdKey]?.trim() ?? "UNKNOWN";

  // Map rows → ParsedSettlementLine.
  const lines: ParsedSettlementLine[] = result.data.map((row) => {
    const amountRaw =
      row.amount__inr_ ?? row.amount_inr_ ?? row.amount ?? null;
    const transactionType = row.transaction_type?.trim() ?? null;
    const amountType = row.amount_type?.trim() ?? null;

    return {
      order_id: row.order_id?.trim() || null,
      transaction_type: transactionType,
      amount_type: amountType,
      amount_description: (row.description ?? row.amount_description ?? "").trim() || null,
      amount: amountRaw ? Number(amountRaw.replace(/,/g, "")).toFixed(2) : null,
      posted_date: parseSettlementDate(row.posted_date),
      sku: row.sku?.trim() || null,
      quantity_purchased: row.quantity
        ? parseInt(row.quantity, 10) || null
        : null,
    };
  });

  // Find the Transfer/disbursement row — this is the bank deposit.
  const transferRow = lines.find(
    (l) =>
      l.transaction_type?.toLowerCase() === "transfer" ||
      l.amount_description?.toLowerCase().includes("disbursed to bank") ||
      l.amount_description?.toLowerCase().includes("net settlement"),
  );

  // total_amount = absolute value of Transfer amount, else sum of credits.
  let totalAmount = "0.00";
  if (transferRow?.amount) {
    totalAmount = Math.abs(Number(transferRow.amount)).toFixed(2);
  } else {
    const sumCredits = lines
      .filter((l) => l.amount && Number(l.amount) > 0)
      .reduce((s, l) => s + Number(l.amount!), 0);
    totalAmount = sumCredits.toFixed(2);
  }

  // Period = min/max posted_dates (excluding Transfer row).
  const dateDates = lines
    .filter((l) => l.posted_date && l !== transferRow)
    .map((l) => l.posted_date!);
  const period_start = dateDates.length ? dateDates.sort()[0] : null;
  const period_end = dateDates.length
    ? dateDates.sort().at(-1)!
    : null;

  return {
    settlement_id_external: settlementId,
    period_start,
    period_end,
    deposit_date: transferRow?.posted_date ?? period_end,
    total_amount: totalAmount,
    currency: "INR",
    lines,
  };
}
