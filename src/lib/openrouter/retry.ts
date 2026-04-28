/**
 * @file retry.ts — Exponential-backoff retry wrapper for LLM calls.
 * @module lib/openrouter
 *
 * Skips retry when the thrown error is a non-retryable LLMError (4xx).
 * Adds ±20% jitter so multiple concurrent calls don't synchronise their
 * backoff windows and double-pound the upstream.
 *
 * @related types.ts (LLMError), client.ts
 */

import { LLMError } from "./types";

export interface RetryOptions {
  /** Total attempts including the first call. Default 3. */
  attempts?: number;
  /** Base delay in ms. Doubled each attempt. Default 250ms. */
  baseDelayMs?: number;
  /** Optional callback invoked after a retryable failure. Useful for logging. */
  onRetry?: (attempt: number, error: unknown) => void;
}

const DEFAULT_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 250;
const JITTER_FACTOR = 0.2;

function isRetryable(error: unknown): boolean {
  if (error instanceof LLMError) return error.retryable;
  // Unknown errors (network blips, AbortError) — retry by default.
  return true;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const attempts = opts.attempts ?? DEFAULT_ATTEMPTS;
  const baseDelay = opts.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || attempt === attempts) throw err;
      opts.onRetry?.(attempt, err);
      const delay = baseDelay * 2 ** (attempt - 1);
      const jitter = delay * JITTER_FACTOR * (Math.random() * 2 - 1);
      await sleep(Math.max(0, delay + jitter));
    }
  }
  // Unreachable — the loop either returns or throws — but TS needs an exit.
  throw lastErr;
}
