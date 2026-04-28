/**
 * @file route.ts — POST /api/chat — streaming help-chat endpoint.
 * @module app/api/chat
 *
 * Auth-gated to onboarded users only. Validates the incoming `messages`
 * array (last ≤10 turns), prepends the LedgerIQ system prompt with the
 * user's business context, and streams Claude Haiku 4.5's response back
 * as text/plain chunks for the client's reader-loop to consume.
 *
 * @dependencies @/lib/auth, @/lib/chat, @/lib/openrouter
 */

import { NextResponse } from "next/server";

import { getCurrentBusiness } from "@/lib/auth";
import { ChatRequestSchema, buildSystemPrompt } from "@/lib/chat";
import { createLogger } from "@/lib/logger";
import { CHAT_MODEL, OpenRouterClient, type ChatMessage } from "@/lib/openrouter";

const log = createLogger("CHAT");

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(req: Request) {
  // ─── Auth gate ───
  const result = await getCurrentBusiness();
  if (!result) return errorResponse(401, "unauthorized", "Authentication required");
  if (!result.business) return errorResponse(403, "no_business", "Complete onboarding first");

  // ─── Parse + validate body ───
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return errorResponse(400, "invalid_json", "Request body must be JSON");
  }

  const parsed = ChatRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return errorResponse(400, "validation_error", "Invalid messages payload");
  }

  // ─── Build full message list with system prompt ───
  const systemPrompt = buildSystemPrompt({
    businessName: result.business.name,
    businessType: result.business.business_type,
    hasGstin: !!result.business.gstin,
    state: result.business.state,
  });

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...parsed.data.messages,
  ];

  log.info("Chat stream start", {
    business: result.business.id.slice(0, 8),
    turns: parsed.data.messages.length,
  });

  // ─── Stream the response back ───
  const llm = new OpenRouterClient();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const delta of llm.streamChat({
          model: CHAT_MODEL,
          messages,
          maxTokens: 600,
        })) {
          controller.enqueue(encoder.encode(delta));
        }
        controller.close();
      } catch (err) {
        log.error("Chat stream failed", {
          business: result.business?.id.slice(0, 8),
          err: String(err),
        });
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
