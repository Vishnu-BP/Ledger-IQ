"use client";

/**
 * @file TransactionFilters.tsx — Date range + description search inputs.
 * @module components/transactions
 *
 * Filters live in the URL (per CLAUDE.md state-management rules — "URL state
 * (filters, periods) → Next.js searchParams"). Local form state holds the
 * draft; clicking Apply commits via router.replace which both syncs the URL
 * and triggers re-render of the consuming TransactionTable.
 *
 * @dependencies next/navigation
 * @related components/transactions/TransactionTable.tsx
 */

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TransactionFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [startDate, setStartDate] = useState(
    searchParams.get("start_date") ?? "",
  );
  const [endDate, setEndDate] = useState(searchParams.get("end_date") ?? "");

  // Keep local state in sync if URL changes externally (e.g. browser back).
  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
    setStartDate(searchParams.get("start_date") ?? "");
    setEndDate(searchParams.get("end_date") ?? "");
  }, [searchParams]);

  function commit(values: {
    search?: string;
    start_date?: string;
    end_date?: string;
  }) {
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

  function clear() {
    setSearch("");
    setStartDate("");
    setEndDate("");
    router.replace(pathname);
  }

  const hasFilters = !!(search || startDate || endDate);

  return (
    <form
      onSubmit={apply}
      className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[1fr_auto_auto_auto]"
    >
      <div className="space-y-1.5">
        <Label htmlFor="filter-search" className="text-xs">
          Search description
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="filter-search"
            placeholder="UPI, AWS, ZOMATO, …"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-start" className="text-xs">
          From
        </Label>
        <Input
          id="filter-start"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-end" className="text-xs">
          To
        </Label>
        <Input
          id="filter-end"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <div className="flex items-end gap-2">
        <Button type="submit" size="sm">
          Apply
        </Button>
        {hasFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={clear}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
}
