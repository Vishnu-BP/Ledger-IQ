"use client";

/**
 * @file useChat.ts — Client hook for the help-chat widget.
 * @module lib/hooks
 *
 * Owns three concerns:
 *   1. Message state (user + assistant turns)
 *   2. Streaming fetch to /api/chat with token-by-token append to last assistant msg
 *   3. localStorage persistence (per-browser, capped at 50 messages)
 *
 * Streaming pattern: an empty assistant message is pushed before the fetch;
 * each chunk read from response.body.getReader() is appended to that message's
 * content via setMessages, giving live-typing UX.
 *
 * @related app/api/chat/route.ts, components/chat/ChatPanel.tsx
 */

import { useCallback, useEffect, useRef, useState } from "react";

import type { ChatMessage } from "@/lib/chat";

// ─── Constants ─────────────────────────────────────────────

const STORAGE_KEY = "ledgeriq:chat:v1";
const MAX_HISTORY = 50;
const TURNS_SENT_TO_API = 10;

// ─── Hook ──────────────────────────────────────────────────

export interface UseChatResult {
  messages: ChatMessage[];
  streaming: boolean;
  error: string | null;
  send: (content: string) => Promise<void>;
  clear: () => void;
}

export function useChat(): UseChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hydrated = useRef(false);

  // Hydrate from localStorage on mount (skip in SSR-safe way)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    }
    hydrated.current = true;
  }, []);

  // Persist on every change after hydration
  useEffect(() => {
    if (!hydrated.current || typeof window === "undefined") return;
    try {
      const trimmed = messages.slice(-MAX_HISTORY);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // quota exceeded etc — ignore
    }
  }, [messages]);

  // ─── Actions ───
  const send = useCallback(async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || streaming) return;
    setError(null);

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    // Push user msg + empty assistant placeholder we'll fill from the stream
    setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const history = messages.concat(userMsg).slice(-TURNS_SENT_TO_API);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;
        setMessages((prev) => {
          const next = prev.slice();
          const last = next[next.length - 1];
          if (last && last.role === "assistant") {
            next[next.length - 1] = { ...last, content: last.content + chunk };
          }
          return next;
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      // Drop the empty/partial assistant message on hard failure
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === "assistant" && last.content === "") {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setStreaming(false);
    }
  }, [messages, streaming]);

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
    if (typeof window !== "undefined") {
      try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
    }
  }, []);

  return { messages, streaming, error, send, clear };
}
