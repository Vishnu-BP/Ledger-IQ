/**
 * @file flipkartSettlementParser.ts — Parses Flipkart seller settlement CSVs.
 * @module lib/parsers
 *
 * Flipkart settlement format (comma-separated):
 *   Settlement Reference, Order ID, Order Item ID, Order Date, SKU,
 *   Product Name, Quantity, Selling Price (INR), Flipkart Commission (INR),
 *   Shipping Fee (INR), Collection Fee (INR), Fixed Fee (INR),
 *   Pick & Pack Fee (INR), Net Payment (INR), Settlement Date, Payment Reference
 *
 * Key rows:
 *   - Order rows: have Order ID + SKU + Quantity. Net Payment is already net
 *     of all commissions/fees per order.
 *   - Fee rows: Product Name = "Flipkart Ads Deduction", "Platform Fee Adjustment"
 *     etc. Net Payment is the deduction (negative).
 *   - Total row: Product Name = "Total Settlement Disbursed", Net Payment = the
 *     actual bank disbursement (positive).
 *
 * Multiple settlement batches (different Settlement Reference values) can appear
 * in one file. We treat the file as one upload and pick the first settlement
 * reference as the external ID. All rows become settlement_lines.
 *
 * @dependencies papaparse, date-fns
 * @related lib/uploads/uploadSettlement.ts, lib/parsers/types.ts
 */

import { isValid, parse as parseDate } from "date-fns";
import Papa from "papaparse";

import type { ParsedSettlement, ParsedSettlementLine } from "./types";
import { ParseError } from "./types";

const DATE_FORMATS = ["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd"];

function toIso(raw: string | undefined | null): string | null {
  if (!raw?.trim()) return null;
  for (const fmt of DATE_FORMATS) {
    const d = parseDate(raw.trim(), fmt, new Date());
    if (isValid(d)) return d.toISOString().slice(0, 10);
  }
  return null;
}

function cleanAmount(raw: string | undefined | null): number | null {
  if (!raw?.trim()) return null;
  const n = Number(raw.replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

export function parseFlipkartSettlement(csvText: string): ParsedSettlement {
  const result = Papa.parse<Record<string, string>>(csvText.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) =>
      h
        .trim()
        .toLowerCase()
        .replace(/[\s()&]/g, "_")
        .replace(/_+/g, "_")
        .replace(/_$/, ""),
  });

  if (!result.data || result.data.length === 0) {
    throw new ParseError("empty_csv", "Flipkart settlement file is empty");
  }

  // Detect format by checking for the settlement reference column.
  const first = result.data[0];
  const refKey = Object.keys(first).find(
    (k) => k.includes("settlement") && k.includes("reference"),
  );
  if (!refKey) {
    throw new ParseError(
      "unknown_format",
      "Not a Flipkart settlement file: missing Settlement Reference column",
    );
  }

  // Column key helpers — papaparse normalises headers, so find by partial match.
  function col(row: Record<string, string>, ...parts: string[]): string | null {
    const key = Object.keys(row).find((k) =>
      parts.every((p) => k.includes(p)),
    );
    return key ? (row[key] ?? null) : null;
  }

  // First settlement reference = the external ID.
  const settlementId = (first[refKey] ?? "").trim() || "FK-UNKNOWN";

  const lines: ParsedSettlementLine[] = [];
  let totalAmount = 0;
  const orderDates: string[] = [];
  let depositDate: string | null = null;

  for (const row of result.data) {
    const productName = (col(row, "product") ?? "").trim();
    const netPaymentRaw = col(row, "net") ?? col(row, "net_payment") ?? null;
    const netPayment = cleanAmount(netPaymentRaw);
    const settlementDate = toIso(col(row, "settlement", "date"));
    const orderId = col(row, "order_id") ?? col(row, "order");
    const orderDate = toIso(col(row, "order", "date"));

    if (orderDate) orderDates.push(orderDate);
    if (settlementDate && !depositDate) depositDate = settlementDate;

    const isTotal = productName.toLowerCase().includes("total settlement disbursed");
    const isFee =
      !orderId?.trim() &&
      !isTotal &&
      productName.length > 0;

    if (isTotal) {
      totalAmount += Math.abs(netPayment ?? 0);
      // Still record as a line.
      lines.push({
        order_id: null,
        transaction_type: "Transfer",
        amount_type: "Total Settlement",
        amount_description: productName,
        amount: netPayment !== null ? Math.abs(netPayment).toFixed(2) : null,
        posted_date: settlementDate,
        sku: null,
        quantity_purchased: null,
      });
      continue;
    }

    lines.push({
      order_id: orderId?.trim() || null,
      transaction_type: isFee ? "Fee" : "Order",
      amount_type: isFee
        ? productName
        : (col(row, "sku") ?? productName),
      amount_description: productName,
      amount: netPayment !== null ? netPayment.toFixed(2) : null,
      posted_date: settlementDate,
      sku: col(row, "sku")?.trim() || null,
      quantity_purchased: col(row, "quantity")
        ? parseInt(col(row, "quantity")!, 10) || null
        : null,
    });
  }

  const sortedDates = orderDates.sort();

  return {
    settlement_id_external: settlementId,
    period_start: sortedDates[0] ?? null,
    period_end: sortedDates.at(-1) ?? null,
    deposit_date: depositDate,
    total_amount: totalAmount > 0 ? totalAmount.toFixed(2) : "0.00",
    currency: "INR",
    lines,
  };
}
