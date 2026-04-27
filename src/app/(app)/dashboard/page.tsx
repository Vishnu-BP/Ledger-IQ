import Link from "next/link";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your financial brain at a glance.
        </p>
      </div>

      <EmptyState
        icon={Upload}
        title="No data yet"
        description="Upload your first bank statement to see categorized transactions, GST liability, anomalies, and cash-flow insights."
      >
        <Button asChild>
          <Link href="/app/upload">Upload your first statement</Link>
        </Button>
      </EmptyState>
    </div>
  );
}
