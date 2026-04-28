"use client";

/**
 * @file ChatWidget.tsx — Floating chat button + side drawer for the help bot.
 * @module components/chat
 *
 * Mounted once in the (app) layout. Shows a circular trigger button bottom-right.
 * Click to open a slide-in drawer hosting <ChatPanel />. Backdrop click and the
 * panel's X button both close it. Custom drawer (no Sheet primitive) keeps the
 * footprint minimal.
 *
 * @related components/chat/ChatPanel.tsx, app/(app)/layout.tsx
 */

import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { ChatPanel } from "@/components/chat/ChatPanel";
import { cn } from "@/lib/utils";

// ─── Component ─────────────────────────────────────────────

export function ChatWidget() {
  const [open, setOpen] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Floating trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open help chat"
        className={cn(
          "fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full",
          "bg-primary text-primary-foreground shadow-lg transition-transform",
          "hover:scale-105 hover:shadow-xl",
          open && "pointer-events-none opacity-0",
        )}
      >
        <MessageCircle className="h-5 w-5" />
      </button>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="LedgerIQ help chat"
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full bg-card shadow-2xl sm:max-w-md",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {open && <ChatPanel onClose={() => setOpen(false)} />}
      </aside>
    </>
  );
}
