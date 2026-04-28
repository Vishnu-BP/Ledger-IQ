"use client";

/**
 * @file TransactionFilters.tsx — Compact horizontal filter bar for the transactions table.
 * @module components/transactions
 *
 * Filters live in URL searchParams per CLAUDE.md conventions. Local draft
 * state holds unsaved values; Apply commits via router.replace which triggers
 * re-fetch in TransactionTable. All logic unchanged — only visual layout updated.
 *
 * @dependencies next/navigation
 * @related components/transactions/TransactionTable.tsx
 */

import { Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ─── Component ─────────────────────────────────────────────

export function TransactionFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [startDate, setStartDate] = useState(searchParams.get("start_date") ?? "");
  const [endDate, setEndDate] = useState(searchParams.get("end_date") ?? "");
  const needsReview = searchParams.get("needs_review") === "1";

  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
    setStartDate(searchParams.get("start_date") ?? "");
    setEndDate(searchParams.get("end_date") ?? "");
  }, [searchParams]);

  function commit(values: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(values)) {
      if (val) next.set(key, val);
      else next.delete(key);
    }
    router.replace(`${pathname}?${next.toString()}`);
  }

  function apply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    commit({ search, start_date: startDate, end_date: endDate });
  }

  function toggleNeedsReview() {
    commit({ needs_review: needsReview ? undefined : "1" });
  }

  function clear() {
    setSearch("");
    setStartDate("");
    setEndDate("");
    router.replace(pathname);
  }

  return (
    <form onSubmit={apply}>
      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

        {/* Search */}
        <div className="relative min-w-[180px] flex-1 max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search description"
            placeholder="UPI, AWS, ZOMATO…"
            className="h-9 pl-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Date range */}
        <Input
          type="date"
          aria-label="From date"
          className="h-9 w-[135px] text-sm"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <span className="text-xs text-muted-foreground">→</span>
        <Input
          type="date"
          aria-label="To date"
          className="h-9 w-[135px] text-sm"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />

        {/* Needs review toggle */}
        <button
          type="button"
          onClick={toggleNeedsReview}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors",
            needsReview
              ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
              : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <span className={cn(
            "h-1.5 w-1.5 rounded-full",
            needsReview ? "bg-amber-500" : "bg-muted-foreground/40",
          )} />
          Needs review
          {needsReview && <X className="h-3 w-3" />}
        </button>

        <Button type="submit" size="sm" className="h-9">Apply</Button>

        {hasFilters && (
          <Button type="button" variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={clear}>
            <X className="mr-1 h-3.5 w-3.5" />Clear
          </Button>
        )}
      </div>
    </form>
  );
}

