"use client";

/**
 * @file ChatPanel.tsx — The chat panel rendered inside the ChatWidget drawer.
 * @module components/chat
 *
 * Owns: empty-state suggestions, message list (auto-scroll on new chunks),
 * input form (Enter submits, Shift+Enter newlines), error banner, and the
 * "clear history" trash icon.
 *
 * @related components/chat/ChatWidget.tsx, lib/hooks/useChat.ts
 */

import { Send, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ChatBubble } from "@/components/chat/ChatBubble";
import { Button } from "@/components/ui/button";
import { useChat } from "@/lib/hooks";
import { cn } from "@/lib/utils";

// ─── Constants ─────────────────────────────────────────────

const SUGGESTIONS = [
  "How does the AI categorize my transactions?",
  "Where do I generate GSTR-3B?",
  "How do I fix a wrong category?",
] as const;

// ─── Props ─────────────────────────────────────────────────

interface ChatPanelProps {
  onClose: () => void;
}

// ─── Component ─────────────────────────────────────────────

export function ChatPanel({ onClose }: ChatPanelProps) {
  const { messages, streaming, error, send, clear } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change (incl. each streamed chunk)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function submit() {
    const value = input.trim();
    if (!value || streaming) return;
    setInput("");
    void send(value);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Ask LedgerIQ</p>
            <p className="text-[11px] leading-tight text-muted-foreground">Powered by Claude Haiku 4.5</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={clear}
              aria-label="Clear chat history"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={onClose}
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Message list */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <EmptyState onPick={(s) => setInput(s)} />
        ) : (
          messages.map((m, i) => {
            const isLastAssistant = i === messages.length - 1 && m.role === "assistant";
            return (
              <ChatBubble
                key={i}
                role={m.role}
                content={m.content}
                streaming={isLastAssistant && streaming}
              />
            );
          })
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mb-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="flex shrink-0 items-end gap-2 border-t bg-background p-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask anything about LedgerIQ…"
          rows={1}
          disabled={streaming}
          className={cn(
            "flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm",
            "min-h-[36px] max-h-32 leading-snug",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            "disabled:opacity-60",
          )}
        />
        <Button
          type="button"
          size="icon"
          onClick={submit}
          disabled={streaming || !input.trim()}
          className="h-9 w-9 shrink-0"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────

function EmptyState({ onPick }: { onPick: (s: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-sm font-semibold">How can I help?</p>
        <p className="mt-1 text-xs text-muted-foreground">
          I can answer questions about uploads, categorization, GST, reconciliation, and more.
        </p>
      </div>
      <div className="w-full space-y-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="block w-full rounded-md border bg-card px-3 py-2 text-left text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-muted/50"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
