"use client";

/**
 * @file CashFlowChart.tsx — 90-day rolling cash flow area chart.
 * @module components/dashboard
 *
 * Recharts AreaChart with two stacked areas: inflow (emerald) and outflow
 * (destructive red). Data is serialized by the RSC and passed as a prop so
 * the component itself has no async work. X-axis shows every 2nd week label
 * to avoid crowding. Y-axis formatted as compact INR (₹1.2L).
 *
 * @dependencies recharts
 * @related app/(app)/dashboard/page.tsx, lib/analytics/cashFlow.ts
 */

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { CashFlowDay } from "@/lib/analytics";

interface CashFlowChartProps {
  data: CashFlowDay[];
}

function compactINR(value: number): string {
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)}L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(0)}K`;
  return `₹${value.toFixed(0)}`;
}

function fmtLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
        No transaction data yet
      </div>
    );
  }

  // Show every ~14th label to avoid crowding on 90-day view.
  const tickIndices = new Set(
    data
      .map((_, i) => i)
      .filter((i) => i % 14 === 0 || i === data.length - 1),
  );

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="inflow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#059669" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="outflow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={(v, i) => (tickIndices.has(i) ? fmtLabel(v) : "")}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={compactINR}
          width={52}
        />
        <Tooltip
          formatter={(value, name) => [
            compactINR(Number(value ?? 0)),
            name === "inflow" ? "Inflow" : "Outflow",
          ]}
          labelFormatter={(label) => fmtLabel(String(label ?? ""))}
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid hsl(var(--border))",
            backgroundColor: "hsl(var(--background))",
          }}
        />
        <Area
          type="monotone"
          dataKey="inflow"
          stroke="#059669"
          strokeWidth={1.5}
          fill="url(#inflow)"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="outflow"
          stroke="#ef4444"
          strokeWidth={1.5}
          fill="url(#outflow)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
