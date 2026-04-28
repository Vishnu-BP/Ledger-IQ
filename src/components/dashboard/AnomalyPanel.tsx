"use client";

/**
 * @file AnomalyPanel.tsx — Recent open anomalies list on the dashboard.
 * @module components/dashboard
 *
 * Stage 4.1: renders anomalies[] prop passed from the RSC. Shows up to 3
 * anomalies with severity badge + Claude explanation + Dismiss action.
 * Stage 4.2 will wire the actual dismiss PATCH call; for now the button is
 * present but wires to a no-op placeholder.
 *
 * @related app/(app)/dashboard/page.tsx, lib/anomalies/ (Stage 4.2)
 */

import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AnomalyRow {
  id: string;
  type: string;
  severity: string;
  title: string;
  ai_explanation: string | null;
}

interface AnomalyPanelProps {
  anomalies: AnomalyRow[];
}

export function AnomalyPanel({ anomalies: initial }: AnomalyPanelProps) {
  const [visible, setVisible] = useState(initial);

  async function dismiss(id: string) {
    try {
      const res = await fetch(`/api/anomalies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "reviewed_ok" }),
      });
      if (!res.ok) throw new Error("Failed");
      setVisible((prev) => prev.filter((a) => a.id !== id));
      toast.success("Marked as reviewed");
    } catch {
      toast.error("Could not dismiss anomaly");
    }
  }

  if (visible.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <CheckCircle className="h-4 w-4 text-emerald-600" />
        No open anomalies — great work!
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {visible.slice(0, 3).map((a) => (
        <li key={a.id} className="flex items-start gap-3 rounded-lg border p-3">
          <SeverityIcon severity={a.severity} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{a.title}</span>
              <SeverityBadge severity={a.severity} />
            </div>
            {a.ai_explanation && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {a.ai_explanation}
              </p>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="shrink-0 h-7 text-xs"
            onClick={() => dismiss(a.id)}
          >
            Dismiss
          </Button>
        </li>
      ))}
    </ul>
  );
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === "high")
    return <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />;
  return <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />;
}

function SeverityBadge({ severity }: { severity: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "text-[10px] uppercase",
        severity === "high" && "border-destructive/30 bg-destructive/10 text-destructive",
        severity === "medium" && "border-amber-200 bg-amber-50 text-amber-700",
      )}
    >
      {severity}
    </Badge>
  );
}
