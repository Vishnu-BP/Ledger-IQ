"use client";

/**
 * @file ChannelSplitDonut.tsx — Channel split donut chart.
 * @module components/dashboard
 *
 * Recharts PieChart with innerRadius to form a donut. Shows percentage of
 * total inflows by channel. Legend rendered as a simple list on the right
 * so it's readable on small screens.
 *
 * @dependencies recharts
 * @related app/(app)/dashboard/page.tsx, lib/analytics/channelSplit.ts
 */

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { ChannelSlice } from "@/lib/analytics";
import { formatINR } from "@/lib/utils";

interface ChannelSplitDonutProps {
  data: ChannelSlice[];
}

const COLORS = [
  "#059669", // emerald-600
  "#2563eb", // blue-600
  "#7c3aed", // violet-600
  "#d97706", // amber-600
  "#dc2626", // red-600
  "#0891b2", // cyan-600
  "#65a30d", // lime-600
  "#db2777", // pink-600
  "#ea580c", // orange-600
  "#4f46e5", // indigo-600
];

export function ChannelSplitDonut({ data }: ChannelSplitDonutProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
        No inflow data yet
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="shrink-0">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="label"
              innerRadius={45}
              outerRadius={75}
              strokeWidth={1}
              stroke="hsl(var(--background))"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [formatINR(String(value ?? "0")), ""]}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid hsl(var(--border))",
                backgroundColor: "hsl(var(--background))",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex-1 space-y-1.5 text-xs">
        {data.map((s, i) => (
          <li key={s.channel} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="truncate text-muted-foreground">{s.label}</span>
            </span>
            <span className="font-medium tabular-nums">{s.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
