import { FileText } from "lucide-react";

import { EmptyState } from "@/components/ui/EmptyState";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          GSTR-3B pre-fill, audit-ready PDF, and Excel exports.
        </p>
      </div>

      <EmptyState
        icon={FileText}
        title="Reports unlock with categorized data"
        description="Once you have categorized transactions, you'll be able to generate GSTR-3B previews, executive PDF reports, and multi-sheet Excel exports here."
      />
    </div>
  );
}
