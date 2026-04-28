/**
 * @file parseResponse.ts — Strip code fences, parse JSON, validate via Zod.
 * @module lib/openrouter
 *
 * LLMs sometimes wrap JSON output in markdown fences (```json ... ```) or
 * prefix it with chatter despite jsonMode being requested. This helper
 * tolerates that, then strictly validates against the caller's Zod schema
 * so downstream code can rely on a well-typed shape.
 *
 * @dependencies zod
 * @related types.ts (LLMParseError)
 */

import type { ZodType } from "zod";
import { LLMParseError } from "./types";

const FENCE_RE = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i;

function stripFences(raw: string): string {
  const trimmed = raw.trim();
  const fence = trimmed.match(FENCE_RE);
  return fence ? fence[1].trim() : trimmed;
}

/**
 * Returns parsed + schema-validated `T`, or throws LLMParseError.
 * Caller decides whether to retry the LLM call once on this failure.
 */
export function parseJsonResponse<T>(raw: string, schema: ZodType<T>): T {
  const cleaned = stripFences(raw);
  let data: unknown;
  try {
    data = JSON.parse(cleaned);
  } catch (err) {
    throw new LLMParseError(
      `LLM response was not valid JSON: ${(err as Error).message}`,
      raw,
    );
  }
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new LLMParseError(
      `LLM JSON did not match schema: ${result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
      raw,
    );
  }
  return result.data;
}
