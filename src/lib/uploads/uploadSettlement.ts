/**
 * @file uploadSettlement.ts — Service that ingests an Amazon settlement CSV.
 * @module lib/uploads
 *
 * Happy path:
 *   1. SHA-256 hash the file.
 *   2. Reject duplicate (same hash, same business).
 *   3. Upload bytes to Supabase Storage at `settlements/<business_id>/<hash>.csv`.
 *   4. Parse the CSV → settlement metadata + lines.
 *   5. INSERT `settlements` row.
 *   6. Bulk INSERT `settlement_lines` rows.
 *
 * @dependencies @/db/client, @/db/schema, @/lib/parsers, @/lib/storage
 * @related app/api/upload/route.ts, lib/parsers/amazonSettlementParser.ts
 */

import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { settlement_lines, settlements } from "@/db/schema";
import { createLogger } from "@/lib/logger";
import { parseAmazonSettlement } from "@/lib/parsers/amazonSettlementParser";
import { ParseError } from "@/lib/parsers/types";
import { uploadStatementFile, StorageError } from "@/lib/storage";
import { computeFileHash } from "@/lib/uploads/computeFileHash";

export { DuplicateUploadError } from "@/lib/uploads/uploadStatement";

const log = createLogger("UPLOAD");

export interface UploadSettlementResult {
  id: string;
  settlement_id_external: string;
  total_amount: string;
  period_start: string | null;
  period_end: string | null;
  settlement_lines_count: number;
}

export async function uploadSettlement(input: {
  businessId: string;
  file: File;
  marketplace?: string;
}): Promise<UploadSettlementResult> {
  const buffer = Buffer.from(await input.file.arrayBuffer());
  const fileHash = computeFileHash(buffer);

  // Dedup check.
  const [existing] = await db
    .select({ id: settlements.id })
    .from(settlements)
    .where(
      and(
        eq(settlements.business_id, input.businessId),
        eq(settlements.file_hash, fileHash),
      ),
    )
    .limit(1);

  if (existing) {
    const { DuplicateUploadError } = await import("@/lib/uploads/uploadStatement");
    throw new DuplicateUploadError(input.file.name);
  }

  // Storage upload — reuse the statements bucket, settlements/ prefix.
  const storagePath = await uploadStatementFile({
    businessId: `settlements/${input.businessId}`,
    fileHash,
    buffer,
    contentType: "text/csv",
  });

  // Parse.
  const csvText = buffer.toString("utf-8");
  const parsed = parseAmazonSettlement(csvText);

  // INSERT settlement row.
  const [created] = await db
    .insert(settlements)
    .values({
      business_id: input.businessId,
      marketplace: input.marketplace ?? "amazon",
      filename: input.file.name,
      storage_path: storagePath,
      file_hash: fileHash,
      settlement_id_external: parsed.settlement_id_external,
      period_start: parsed.period_start,
      period_end: parsed.period_end,
      deposit_date: parsed.deposit_date,
      total_amount: parsed.total_amount,
      currency: parsed.currency,
      status: "uploaded",
    })
    .returning();

  // Bulk INSERT settlement_lines.
  if (parsed.lines.length > 0) {
    await db.insert(settlement_lines).values(
      parsed.lines.map((l) => ({
        settlement_id: created.id,
        order_id: l.order_id,
        transaction_type: l.transaction_type,
        amount_type: l.amount_type,
        amount_description: l.amount_description,
        amount: l.amount,
        posted_date: l.posted_date,
        sku: l.sku,
        quantity_purchased: l.quantity_purchased,
      })),
    );
  }

  log.info("Settlement uploaded", {
    id: created.id,
    settlementId: parsed.settlement_id_external,
    lines: parsed.lines.length,
    totalAmount: parsed.total_amount,
  });

  return {
    id: created.id,
    settlement_id_external: parsed.settlement_id_external,
    total_amount: parsed.total_amount,
    period_start: parsed.period_start,
    period_end: parsed.period_end,
    settlement_lines_count: parsed.lines.length,
  };
}
