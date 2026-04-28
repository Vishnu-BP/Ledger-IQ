"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface CashFlowChartProps {
  data: any[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-zinc-900 p-4 border border-slate-100 dark:border-zinc-800 shadow-2xl rounded-2xl animate-in fade-in zoom-in duration-200">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}, 2026</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Inflow</span>
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-white">₹{payload[0].value.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Outflow</span>
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-white">₹{payload[1].value.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function CashFlowChart({ data }: CashFlowChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="inflow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="outflow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis 
          dataKey="date" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
          dy={10}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
          tickFormatter={(v) => `₹${v/1000}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="inflow"
          stroke="#10b981"
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#inflow)"
        />
        <Area
          type="monotone"
          dataKey="outflow"
          stroke="#ef4444"
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#outflow)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
