/**
 * @file types.ts — Domain types + Zod schemas for the help-chat feature.
 * @module lib/chat
 *
 * Shared between the API route (validates incoming request) and the
 * client hook / components. Keep the role union narrower than the
 * OpenRouter ChatRole — we never accept a "system" role from the
 * client; the system prompt is added server-side.
 *
 * @related app/api/chat/route.ts, lib/hooks/useChat.ts
 */

import { z } from "zod";

// ─── Domain types ──────────────────────────────────────────

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

// ─── Wire schemas ──────────────────────────────────────────

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1).max(20),
});

export type ChatRequestBody = z.infer<typeof ChatRequestSchema>;
