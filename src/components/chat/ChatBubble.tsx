/**
 * @file ChatBubble.tsx — Single message bubble in the help-chat panel.
 * @module components/chat
 *
 * RSC — pure render. User bubbles are right-aligned with primary background;
 * assistant bubbles are left-aligned with muted background and a small bot
 * glyph. Streaming cursor pulses at the end of an empty assistant message.
 *
 * @related components/chat/ChatPanel.tsx
 */

import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

// ─── Props ─────────────────────────────────────────────────

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  /** Show the typing cursor for the in-flight assistant message. */
  streaming?: boolean;
}

// ─── Component ─────────────────────────────────────────────

export function ChatBubble({ role, content, streaming }: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex items-start gap-2", isUser && "flex-row-reverse")}>
      {!isUser && (
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15">
          <Sparkles className="h-3 w-3 text-primary" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed",
          isUser
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm bg-muted text-foreground",
        )}
      >
        {content}
        {streaming && (
          <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-current" />
        )}
      </div>
    </div>
  );
}
