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

import { Search, X, Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
    <div className="space-y-4">
      <form onSubmit={apply} className="flex flex-wrap items-end gap-5 bg-white dark:bg-zinc-950 p-8 rounded-[40px] border border-slate-100 dark:border-zinc-800 shadow-sm">
        {/* Search */}
        <div className="flex-1 min-w-[320px]">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Search Analytics</p>
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="text"
              placeholder="Description, UPI, AWS, Zomato..."
              className="w-full pl-14 pr-4 py-4 bg-slate-50/30 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-black placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button 
              type="button"
              onClick={toggleNeedsReview}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all shadow-sm",
                needsReview 
                   ? "bg-amber-600 border-amber-500 text-white shadow-amber-600/20" 
                   : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
              )}
            >
              Needs review {needsReview && <X className="h-3 w-3" />}
            </button>
          </div>
        </div>

        {/* Channel Dropdown Placeholder */}
        <div className="w-[200px]">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Sales Channel</p>
          <div className="relative group">
            <select className="w-full appearance-none pl-5 pr-12 py-4 bg-slate-50/30 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-black text-slate-700 dark:text-slate-300 outline-none cursor-pointer focus:border-indigo-600 transition-all">
              <option>All Channels</option>
            </select>
            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-focus-within:text-indigo-600 transition-colors" />
          </div>
        </div>

        {/* Date Pickers */}
        <div className="flex items-center gap-3">
          <div className="w-[160px]">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Start Date</p>
            <div className="relative group">
              <input
                type="date"
                className="w-full pl-5 pr-4 py-4 bg-slate-50/30 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-black text-slate-700 outline-none cursor-pointer focus:border-indigo-600 transition-all"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>
          <div className="w-[160px]">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">End Date</p>
            <div className="relative group">
              <input
                type="date"
                className="w-full pl-5 pr-4 py-4 bg-slate-50/30 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-black text-slate-700 outline-none cursor-pointer focus:border-indigo-600 transition-all"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pb-0.5">
          <Button type="submit" className="h-[58px] px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-95">
            Apply
          </Button>
          <Button type="button" variant="ghost" className="h-[58px] px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50" onClick={clear}>
            Reset
          </Button>
        </div>
      </form>
    </div>
  );
}

