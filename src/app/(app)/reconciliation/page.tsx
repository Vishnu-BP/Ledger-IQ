import { GitCompareArrows } from "lucide-react";

import { EmptyState } from "@/components/ui/EmptyState";

export default function ReconciliationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reconciliation</h1>
        <p className="text-sm text-muted-foreground">
          Match marketplace settlement reports against your bank credits and
          catch silent under-payments.
        </p>
      </div>

      <EmptyState
        icon={GitCompareArrows}
        title="No settlement reports yet"
        description="Upload an Amazon or Flipkart settlement report on the Upload page to see reconciliation discrepancies and AI-explained gaps."
      />
    </div>
  );
}
