"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface ChannelSlice {
  label: string;
  value: number;
  pct: number;
  amount: string;
  color: string;
}

const dummyData: ChannelSlice[] = [
  { label: "Rent & Office", value: 45, pct: 45, amount: "₹4,25,000", color: "#6366f1" },
  { label: "Utilities", value: 25, pct: 25, amount: "₹2,35,000", color: "#3b82f6" },
  { label: "Travel", value: 15, pct: 15, amount: "₹1,40,000", color: "#f97316" },
  { label: "GST & Tax", value: 10, pct: 10, amount: "₹95,000", color: "#ef4444" },
  { label: "Others", value: 5, pct: 5, amount: "₹46,000", color: "#10b981" },
];

export function ChannelSplitDonut({ data }: { data?: any[] }) {
  const chartData = dummyData;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-8 h-full">
      <div className="relative shrink-0">
        <ResponsiveContainer width={180} height={180} minWidth={0}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="label"
              innerRadius={55}
              outerRadius={85}
              strokeWidth={0}
              paddingAngle={2}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex-1 w-full space-y-4">
        {chartData.map((s) => (
          <div key={s.label} className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{s.label}</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-sm font-bold text-slate-900 dark:text-white">{s.pct}%</span>
              <span className="text-sm font-black text-slate-900 dark:text-white w-20 text-right">{s.amount}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
