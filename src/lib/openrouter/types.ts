/**
 * @file types.ts — Public types for the OpenRouter LLM gateway.
 * @module lib/openrouter
 *
 * Defines the LLMClient interface that the categorization, anomaly, and
 * reconciliation pipelines depend on (DI pattern — pipelines never import
 * the OpenRouter implementation directly). Also defines the typed error
 * classes that drive retry decisions in retry.ts.
 *
 * @related client.ts, retry.ts, parseResponse.ts
 */

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  /** Asks the provider to constrain output to a JSON object. */
  jsonMode?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatResponse {
  content: string;
  model: string;
  usage: ChatUsage;
}

export interface LLMClient {
  chat(req: ChatRequest): Promise<ChatResponse>;
  /**
   * Streams the model's response one delta at a time. Used by the help-chat
   * endpoint for token-by-token UX. No retry wrapping — streams can't be
   * resumed mid-flight, so any error throws synchronously at the start or
   * propagates from the generator iteration.
   */
  streamChat(req: ChatRequest): AsyncGenerator<string, void, unknown>;
}

/**
 * Transport / provider error. `retryable` drives the retry helper:
 *   - 4xx (auth, validation, model-not-found) → retryable=false
 *   - 5xx, 429, network failures                → retryable=true
 */
export class LLMError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly retryable: boolean;

  constructor(
    message: string,
    opts: { status?: number; code?: string; retryable: boolean; cause?: unknown },
  ) {
    super(message);
    this.name = "LLMError";
    this.status = opts.status;
    this.code = opts.code;
    this.retryable = opts.retryable;
    if (opts.cause) {
      (this as { cause?: unknown }).cause = opts.cause;
    }
  }
}

/** Thrown by parseResponse when the LLM returned non-JSON or schema-invalid JSON. */
export class LLMParseError extends Error {
  readonly raw: string;
  constructor(message: string, raw: string) {
    super(message);
    this.name = "LLMParseError";
    this.raw = raw;
  }
}
