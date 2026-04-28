/**
 * @file DemoSection.tsx — Interactive product demo section with sticky pill navigator.
 * @module components/landing
 *
 * Hosts four scrollable demo panels (transactions, GST, reconciliation, anomalies).
 * A sticky pill nav tracks the active panel via IntersectionObserver and allows
 * click-to-scroll navigation to any panel.
 *
 * @dependencies lib/hooks/useScrollSpy, lib/utils
 * @related components/landing/DemoTransactions.tsx, DemoGst.tsx, DemoReconciliation.tsx, DemoAnomalies.tsx
 */

"use client";

import { useScrollSpy } from "@/lib/hooks/useScrollSpy";
import { cn } from "@/lib/utils";
import { DemoAnomalies } from "@/components/landing/DemoAnomalies";
import { DemoGst } from "@/components/landing/DemoGst";
import { DemoReconciliation } from "@/components/landing/DemoReconciliation";
import { DemoTransactions } from "@/components/landing/DemoTransactions";

// ─── Constants ─────────────────────────────────────────────

const TABS = [
  { id: "demo-transactions", label: "Transaction Ledger" },
  { id: "demo-gst",          label: "GST Pre-fill" },
  { id: "demo-reconcile",    label: "Reconciliation" },
  { id: "demo-anomalies",    label: "Anomaly Radar" },
] as const;

const TAB_IDS = TABS.map((t) => t.id);

// ─── Component ─────────────────────────────────────────────

export function DemoSection() {
  const spyId = useScrollSpy(TAB_IDS);
  const activeId = spyId ?? TAB_IDS[0];

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div id="demo">
      {/* Sticky pill navigator */}
      <div className="sticky top-[57px] z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="flex justify-center py-3 px-4">
          <div className="inline-flex items-center gap-1 overflow-x-auto rounded-full border bg-muted p-1 shadow-sm">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => scrollToSection(tab.id)}
                className={cn(
                  "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200",
                  activeId === tab.id
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Demo panels */}
      <DemoTransactions />
      <DemoGst />
      <DemoReconciliation />
      <DemoAnomalies />
    </div>
  );
}
