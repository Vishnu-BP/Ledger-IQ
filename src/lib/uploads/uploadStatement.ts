import "server-only";

/**
 * @file uploadStatement.ts — Service that ingests a bank-statement CSV upload.
 * @module lib/uploads
 *
 * Happy path:
 *   1. Compute SHA-256 of the file bytes.
 *   2. Reject if a statement with the same hash already exists for this business.
 *   3. Upload bytes to Supabase Storage at `<business_id>/<hash>.csv`.
 *   4. Insert a row into `statements` with status='uploaded'.
 *   5. Parse the CSV (HDFC/ICICI auto-detect via header signature).
 *   6. Bulk-insert parsed rows into `transactions`.
 *   7. Update `statements` to status='parsed' with period + count.
 *
 * Failure paths:
 *   - Duplicate hash → throws DuplicateUploadError before any side effects beyond the dedup query.
 *   - Storage failure → throws StorageError; no DB row exists yet.
 *   - Parse failure → updates statements row to status='error' with parse_error, then throws the ParseError. Storage file stays so the user can investigate.
 *
 * @dependencies drizzle-orm, @/db/client, @/lib/storage, @/lib/parsers, @/lib/logger
 * @related app/api/upload/route.ts, lib/parsers/bankStatementParser.ts
 */

import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { statements, transactions } from "@/db/schema";
import { createLogger } from "@/lib/logger";
import { ParseError, parseBankStatement } from "@/lib/parsers";
import { uploadStatementFile } from "@/lib/storage";
import { computeFileHash } from "@/lib/uploads/computeFileHash";

const log = createLogger("UPLOAD");

export class DuplicateUploadError extends Error {
  constructor(public readonly existingFilename: string) {
    super(`Already uploaded as "${existingFilename}"`);
    this.name = "DuplicateUploadError";
  }
}

interface UploadStatementInput {
  businessId: string;
  file: File;
}

export interface UploadStatementResult {
  id: string;
  status: string;
  filename: string;
  bank: string | null;
  total_transactions: number;
  period_start: string | null;
  period_end: string | null;
}

export async function uploadStatement(
  input: UploadStatementInput,
): Promise<UploadStatementResult> {
  const buffer = Buffer.from(await input.file.arrayBuffer());
  const fileHash = computeFileHash(buffer);

  // ─── Dedup check ─────────────────────────────────────
  const [existing] = await db
    .select({ id: statements.id, filename: statements.filename })
    .from(statements)
    .where(
      and(
        eq(statements.business_id, input.businessId),
        eq(statements.file_hash, fileHash),
      ),
    )
    .limit(1);

  if (existing) {
    log.info("Duplicate upload blocked", {
      businessId: input.businessId,
      existingId: existing.id,
    });
    throw new DuplicateUploadError(existing.filename);
  }

  // ─── Storage upload ──────────────────────────────────
  const storagePath = await uploadStatementFile({
    businessId: input.businessId,
    fileHash,
    buffer,
    contentType: input.file.type || "text/csv",
  });

  // ─── Insert statements row (status: uploaded) ───────
  const [created] = await db
    .insert(statements)
    .values({
      business_id: input.businessId,
      filename: input.file.name,
      storage_path: storagePath,
      file_hash: fileHash,
      file_size_bytes: input.file.size,
      status: "uploaded",
    })
    .returning({
      id: statements.id,
      filename: statements.filename,
    });

  // ─── Parse + bulk-insert transactions ───────────────
  try {
    await db
      .update(statements)
      .set({ status: "parsing" })
      .where(eq(statements.id, created.id));

    const csvText = buffer.toString("utf-8");
    const parsed = parseBankStatement(csvText);

    if (parsed.transactions.length > 0) {
      await db.insert(transactions).values(
        parsed.transactions.map((t) => ({
          business_id: input.businessId,
          statement_id: created.id,
          transaction_date: t.transaction_date,
          description: t.description,
          reference_number: t.reference_number,
          debit_amount: t.debit_amount,
          credit_amount: t.credit_amount,
          closing_balance: t.closing_balance,
        })),
      );
    }

    await db
      .update(statements)
      .set({
        status: "parsed",
        bank: parsed.bank,
        total_transactions: parsed.transactions.length,
        period_start: parsed.period_start,
        period_end: parsed.period_end,
        completed_at: new Date(),
      })
      .where(eq(statements.id, created.id));

    log.info("Statement parsed", {
      id: created.id,
      bank: parsed.bank,
      txnCount: parsed.transactions.length,
      period: `${parsed.period_start} → ${parsed.period_end}`,
    });

    return {
      id: created.id,
      status: "parsed",
      filename: created.filename,
      bank: parsed.bank,
      total_transactions: parsed.transactions.length,
      period_start: parsed.period_start,
      period_end: parsed.period_end,
    };
  } catch (err) {
    if (err instanceof ParseError) {
      log.warn("Parse failed; statement marked errored", {
        id: created.id,
        code: err.code,
        message: err.message,
      });
      await db
        .update(statements)
        .set({
          status: "error",
          parse_error: err.message,
        })
        .where(eq(statements.id, created.id));
    } else {
      log.error("Unexpected parse path failure", {
        id: created.id,
        error: String(err),
      });
    }
    throw err;
  }
}
