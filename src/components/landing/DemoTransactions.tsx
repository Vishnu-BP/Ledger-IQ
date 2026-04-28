/**
 * @file DemoTransactions.tsx — Static transaction table mockup for the demo section.
 * @module components/landing
 *
 * Replicates the visual structure of the real TransactionTable using hardcoded
 * data so visitors can see the product without signing up or making API calls.
 *
 * @dependencies lucide-react
 * @related components/landing/DemoSection.tsx, components/transactions/TransactionTable.tsx
 */

import { Bot, Cpu, Tag } from "lucide-react";
import { SectionHeading, SectionLabel } from "@/components/landing/_shared";

// ─── Types ─────────────────────────────────────────────────

interface MockRow {
  date: string;
  description: string;
  channel: string;
  category: string;
  debit: string;
  credit: string;
  confidence: number;
  model: "Rule" | "Llama" | "Claude";
}

// ─── Data ──────────────────────────────────────────────────

const ROWS: MockRow[] = [
  { date: "15 Apr", description: "SWIGGY ORDER #8821", channel: "UPI", category: "Food & Dining", debit: "₹847", credit: "", confidence: 99, model: "Rule" },
  { date: "14 Apr", description: "AMAZON PAY SETTLEMENT APR1", channel: "NEFT", category: "Marketplace Income", debit: "", credit: "₹18,420", confidence: 91, model: "Llama" },
  { date: "13 Apr", description: "FACEBOOK ADS 9284710", channel: "Card", category: "Digital Marketing", debit: "₹5,200", credit: "", confidence: 88, model: "Llama" },
  { date: "12 Apr", description: "TATA POWER MUMBAI", channel: "NACH", category: "Utilities", debit: "₹3,140", credit: "", confidence: 99, model: "Rule" },
  { date: "11 Apr", description: "RAJESH SUPPLIERS PVT LTD", channel: "RTGS", category: "Raw Materials (ITC)", debit: "₹42,000", credit: "", confidence: 76, model: "Claude" },
  { date: "10 Apr", description: "GST PAYMENT CHALLAN", channel: "NEFT", category: "Tax Payments", debit: "₹11,800", credit: "", confidence: 99, model: "Rule" },
  { date: "09 Apr", description: "FLIPKART SELLER PAYOUT", channel: "NEFT", category: "Marketplace Income", debit: "", credit: "₹9,650", confidence: 93, model: "Llama" },
];

// ─── Helpers ───────────────────────────────────────────────

function confidenceColor(n: number) {
  if (n >= 90) return "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400";
  if (n >= 80) return "text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400";
  return "text-destructive bg-destructive/10";
}

function ModelIcon({ model }: { model: MockRow["model"] }) {
  if (model === "Rule") return <Tag className="h-3 w-3 text-muted-foreground" />;
  if (model === "Llama") return <Cpu className="h-3 w-3 text-blue-500" />;
  return <Bot className="h-3 w-3 text-violet-500" />;
}

// ─── Component ─────────────────────────────────────────────

export function DemoTransactions() {
  return (
    <section id="demo-transactions" className="scroll-mt-32 px-6 py-20">
      <div className="mx-auto max-w-5xl space-y-4">
        <SectionLabel>Transaction Ledger</SectionLabel>
        <SectionHeading>Every entry — auto-categorized</SectionHeading>
        <p className="text-sm text-muted-foreground">
          UPI, NEFT, IMPS, NACH, RTGS — each row gets a category, GST head, and
          an AI confidence score. Low-confidence rows are escalated to Claude
          Sonnet automatically.
        </p>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          {/* Header */}
          <div className="grid grid-cols-[80px_1fr_80px_160px_90px_90px] gap-3 border-b bg-muted/40 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Date</span>
            <span>Description</span>
            <span>Channel</span>
            <span>Category</span>
            <span className="text-right">Debit</span>
            <span className="text-right">Credit</span>
          </div>

          {/* Rows */}
          {ROWS.map((row) => (
            <div
              key={row.date + row.description}
              className="grid grid-cols-[80px_1fr_80px_160px_90px_90px] items-center gap-3 border-b px-4 py-3 text-sm last:border-0 hover:bg-muted/30 transition-colors"
            >
              <span className="text-xs text-muted-foreground">{row.date}</span>
              <span className="truncate font-medium">{row.description}</span>
              <span className="rounded-full border bg-muted px-2 py-0.5 text-[11px] text-center text-muted-foreground">
                {row.channel}
              </span>
              <div className="flex items-center gap-1.5">
                <ModelIcon model={row.model} />
                <span className="truncate text-xs">{row.category}</span>
                <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-medium ${confidenceColor(row.confidence)}`}>
                  {row.confidence}%
                </span>
              </div>
              <span className="text-right text-xs font-medium text-destructive">
                {row.debit}
              </span>
              <span className="text-right text-xs font-medium text-emerald-600">
                {row.credit}
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          <Tag className="mr-1 inline h-3 w-3" /> Rule-based &nbsp;·&nbsp;
          <Cpu className="mr-1 inline h-3 w-3 text-blue-500" /> Llama 3.3 70B &nbsp;·&nbsp;
          <Bot className="mr-1 inline h-3 w-3 text-violet-500" /> Claude Sonnet (edge cases)
        </p>
      </div>
    </section>
  );
}
