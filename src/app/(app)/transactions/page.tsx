import Link from "next/link";
import { ReceiptText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          Every line item from your bank statements, AI-categorized.
        </p>
      </div>

      <EmptyState
        icon={ReceiptText}
        title="Your transactions will appear here"
        description="Once you upload a bank statement, every parsed row shows up here — sortable, filterable, and editable."
      >
        <Button asChild>
          <Link href="/app/upload">Upload a statement</Link>
        </Button>
      </EmptyState>
    </div>
  );
}
