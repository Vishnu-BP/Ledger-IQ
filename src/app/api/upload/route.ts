/**
 * @file route.ts — POST /api/upload — receive a bank statement / settlement CSV.
 * @module app/api/upload
 *
 * Multipart form handler. Validates auth + business existence + file
 * shape (size, extension, type slug), then delegates to
 * `uploadStatement` for the actual ingestion work.
 *
 * Currently only `bank_statement` is wired. Marketplace types return 501
 * with a friendly message; stage 4.3 wires their parsers.
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

  // Marketplace settlements arrive in stage 4.3.
  if (typeParse.data !== "bank_statement") {
    return errorResponse(
      501,
      "not_implemented",
      "Marketplace settlement upload arrives in Layer 4",
    );
  }

  try {
    const created = await uploadStatement({
      businessId: result.business.id,
      file,
    });
    return NextResponse.json({
      id: created.id,
      type: typeParse.data,
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
      // File reached Storage and DB, but contents couldn't be parsed.
      // statements.status is now 'error' with parse_error populated.
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
