import "server-only";

/**
 * @file supabaseStorage.ts — Server-side Supabase Storage wrapper for the `statements` bucket.
 * @module lib/storage
 *
 * Files are organised as `<business_id>/<file_hash>.csv` so the path itself is
 * deduplication-stable. Uploads use the service-role admin client, bypassing
 * RLS on storage.objects (RLS still applied for any direct anon-key access —
 * defense-in-depth per CLAUDE.md).
 *
 * @dependencies @/lib/supabase/admin, @/lib/logger
 * @related lib/uploads/uploadStatement.ts, app/api/upload/route.ts
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/logger";

const log = createLogger("UPLOAD");
const BUCKET = "statements";

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
  }
}

interface UploadStatementFileInput {
  businessId: string;
  fileHash: string;
  buffer: Buffer;
  contentType: string;
}

export async function uploadStatementFile(
  input: UploadStatementFileInput,
): Promise<string> {
  const supabase = createAdminClient();
  const path = `${input.businessId}/${input.fileHash}.csv`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, input.buffer, {
    contentType: input.contentType,
    upsert: false,
  });

  if (error) {
    // Storage will reject with "already exists" when the path collides — this
    // shouldn't happen because we dedup via DB before reaching here, but if it
    // does it's effectively the same content (hash-addressed), so treat as
    // success and let the DB layer surface the user-facing duplicate error.
    if (error.message.toLowerCase().includes("already exists")) {
      log.warn("Storage path collision on idempotent re-upload", { path });
      return path;
    }
    log.error("Storage upload failed", { path, error: error.message });
    throw new StorageError(error.message);
  }

  log.info("Storage upload succeeded", { path });
  return path;
}
