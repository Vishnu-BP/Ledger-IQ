/**
 * @file client.ts — OpenRouter implementation of the LLMClient interface.
 * @module lib/openrouter
 *
 * Server-only — enforced implicitly by the `@/lib/env` import below: env.ts
 * validates `OPENROUTER_API_KEY` (a non-NEXT_PUBLIC_* var) at module load,
 * and Next.js strips non-prefixed env vars from the client bundle, so any
 * accidental client-side import throws during validation. We deliberately
 * skip `import "server-only"` so smoke scripts run by `tsx` outside Next.js
 * can exercise this module.
 *
 * Wraps the `openai` SDK pointed at OpenRouter's OpenAI-compatible endpoint.
 * Translates SDK errors into our LLMError so retry.ts can decide whether to
 * back off (5xx, 429, network) or fail fast (4xx auth/validation).
 *
 * @dependencies openai, @/lib/env, @/lib/logger
 * @related types.ts, retry.ts, models.ts
 */

import OpenAI, { APIError } from "openai";
import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import {
  type ChatRequest,
  type ChatResponse,
  type LLMClient,
  LLMError,
} from "./types";

const log = createLogger("LLM");
const BASE_URL = "https://openrouter.ai/api/v1";

export interface OpenRouterClientOptions {
  apiKey?: string;
  baseURL?: string;
  /** Reported via OpenRouter analytics dashboard. */
  appReferer?: string;
  appTitle?: string;
}

export class OpenRouterClient implements LLMClient {
  private readonly sdk: OpenAI;

  constructor(opts: OpenRouterClientOptions = {}) {
    const apiKey = opts.apiKey ?? env.OPENROUTER_API_KEY;
    this.sdk = new OpenAI({
      apiKey,
      baseURL: opts.baseURL ?? BASE_URL,
      defaultHeaders: {
        "HTTP-Referer": opts.appReferer ?? env.NEXT_PUBLIC_APP_URL,
        "X-Title": opts.appTitle ?? "LedgerIQ",
      },
    });
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    try {
      const resp = await this.sdk.chat.completions.create({
        model: req.model,
        messages: req.messages,
        temperature: req.temperature ?? 0.1,
        max_tokens: req.maxTokens,
        response_format: req.jsonMode ? { type: "json_object" } : undefined,
      });

      const choice = resp.choices[0];
      const content = choice?.message?.content;
      if (!content) {
        throw new LLMError("LLM returned no content", { retryable: true });
      }

      return {
        content,
        model: resp.model ?? req.model,
        usage: {
          promptTokens: resp.usage?.prompt_tokens ?? 0,
          completionTokens: resp.usage?.completion_tokens ?? 0,
          totalTokens: resp.usage?.total_tokens ?? 0,
        },
      };
    } catch (err) {
      throw normaliseError(err);
    }
  }
}

function normaliseError(err: unknown): LLMError {
  if (err instanceof LLMError) return err;

  if (err instanceof APIError) {
    const status = err.status;
    // 4xx is a client-side problem — don't retry. 408 (timeout) and 429
    // (rate limit) are the standard retryable exceptions.
    const retryable =
      typeof status === "number"
        ? status >= 500 || status === 408 || status === 429
        : true;
    log.warn("OpenRouter API error", { status, code: err.code, retryable });
    return new LLMError(err.message, {
      status,
      code: typeof err.code === "string" ? err.code : undefined,
      retryable,
      cause: err,
    });
  }

  // Network failures, AbortError, etc. — retryable.
  log.warn("OpenRouter transport error", {
    message: (err as Error)?.message ?? String(err),
  });
  return new LLMError((err as Error)?.message ?? "Unknown LLM error", {
    retryable: true,
    cause: err,
  });
}
