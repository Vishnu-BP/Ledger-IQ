/**
 * @file route.ts — POST /api/upload — receive a bank statement / settlement CSV.
 * @module app/api/upload
 *
 * Multipart form handler. Validates auth + business existence + file
 * shape (size, extension, type slug), then delegates to `uploadStatement`
 * (bank_statement) or `uploadSettlement` (amazon_settlement). After each
 * settlement upload, reconcile() is kicked off fire-and-forget.
 *
 * @dependencies next/server, @/lib/auth, @/lib/uploads, @/lib/storage, @/lib/logger
 * @related components/upload/*, lib/hooks/useUpload.ts
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentBusiness } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { ParseError } from "@/lib/parsers";
import { StorageError } from "@/lib/storage";
import { DuplicateUploadError, uploadStatement } from "@/lib/uploads";
import { uploadSettlement } from "@/lib/uploads/uploadSettlement";
import { reconcile } from "@/lib/reconciliation";

const log = createLogger("API");

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB per PRD §12.1
const uploadTypeSchema = z.enum([
  "bank_statement",
  "amazon_settlement",
  "flipkart_settlement",
]);

function errorResponse(
  status: number,
  code: string,
  message: string,
): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: NextRequest) {
  // Parse the multipart body. Bad content-type / malformed body → 400.
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse(400, "invalid_request", "Expected multipart/form-data");
  }

  const file = formData.get("file");
  const rawType = formData.get("type");

  if (!(file instanceof File)) {
    return errorResponse(400, "invalid_file", "No file uploaded");
  }

  // Auth + business existence (defense-in-depth — middleware already runs).
  const result = await getCurrentBusiness();
  if (!result) {
    return errorResponse(401, "unauthorized", "Authentication required");
  }
  if (!result.business) {
    return errorResponse(
      403,
      "no_business",
      "Complete onboarding before uploading",
    );
  }

  // File-shape checks. Client-side FileDropzone enforces the same — these are
  // defense-in-depth so a hand-crafted curl can't bypass.
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return errorResponse(400, "invalid_file", "Only CSV files are supported");
  }
  if (file.size > MAX_BYTES) {
    return errorResponse(413, "too_large", "File exceeds 10 MB limit");
  }

  // Type slug check.
  const typeParse = uploadTypeSchema.safeParse(rawType);
  if (!typeParse.success) {
    return errorResponse(400, "invalid_type", "Unknown upload type");
  }

  try {
    const uploadType = typeParse.data;

    // ─── Amazon settlement ────────────────────────────────
    if (uploadType === "amazon_settlement") {
      const created = await uploadSettlement({
        businessId: result.business.id,
        file,
        marketplace: "amazon",
      });

      // Fire-and-forget reconciliation (Stage 4.4 wires the full engine;
      // this import will be a no-op stub until then).
      reconcileAsync(result.business.id, created.id);

      return NextResponse.json({
        id: created.id,
        type: uploadType,
        status: "uploaded",
        filename: file.name,
        settlement_id: created.settlement_id_external,
        total_amount: created.total_amount,
        settlement_lines_count: created.settlement_lines_count,
        period_start: created.period_start,
        period_end: created.period_end,
      });
    }

    // ─── Flipkart settlement (stub — Layer 4.3 partial) ──
    if (uploadType === "flipkart_settlement") {
      return errorResponse(
        501,
        "not_implemented",
        "Flipkart settlement upload is coming soon",
      );
    }

    // ─── Bank statement ───────────────────────────────────
    const created = await uploadStatement({
      businessId: result.business.id,
      file,
    });
    return NextResponse.json({
      id: created.id,
      type: uploadType,
      status: created.status,
      filename: created.filename,
      bank: created.bank,
      total_transactions: created.total_transactions,
      period_start: created.period_start,
      period_end: created.period_end,
    });
  } catch (err) {
    if (err instanceof DuplicateUploadError) {
      return errorResponse(409, "duplicate", err.message);
    }
    if (err instanceof ParseError) {
      return errorResponse(422, "parse_error", err.message);
    }
    if (err instanceof StorageError) {
      log.error("Storage error during upload", { error: err.message });
      return errorResponse(500, "storage_error", "Could not save the file");
    }
    log.error("Unexpected upload error", { error: String(err) });
    return errorResponse(500, "server_error", "Something went wrong");
  }
}

function reconcileAsync(businessId: string, settlementId: string): void {
  reconcile(businessId, settlementId).catch((err) => {
    log.error("Background reconciliation failed", {
      business: businessId.slice(0, 8),
      settlement: settlementId.slice(0, 8),
      err: String(err),
    });
  });
}
