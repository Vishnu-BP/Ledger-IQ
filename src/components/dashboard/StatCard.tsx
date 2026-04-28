"use client";

import { cn } from "@/lib/utils";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: "indigo" | "emerald" | "rose" | "purple";
}

const sparkData = [
  { v: 40 }, { v: 30 }, { v: 45 }, { v: 35 }, { v: 55 }, { v: 40 }, { v: 60 }
];

export function StatCard({ label, value, icon, trend, trendUp, color = "indigo" }: StatCardProps) {
  const colorMap = {
    indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100/50 dark:border-indigo-500/20",
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100/50 dark:border-emerald-500/20",
    rose: "text-rose-600 bg-rose-50 dark:bg-rose-500/10 border-rose-100/50 dark:border-rose-500/20",
    purple: "text-purple-600 bg-purple-50 dark:bg-purple-500/10 border-purple-100/50 dark:border-purple-500/20",
  };

  const chartColor = trendUp ? "#10b981" : color === "rose" ? "#ef4444" : "#6366f1";

  return (
    <div className="group relative flex flex-col rounded-[32px] border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl border transition-transform group-hover:scale-110", colorMap[color])}>
          {icon}
        </div>
        <div className="h-16 w-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <Area 
                type="monotone" 
                dataKey="v" 
                stroke={chartColor} 
                fill={chartColor} 
                fillOpacity={0.1} 
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div>
        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h3>
        </div>
        {trend && (
          <div className={cn("mt-2 flex items-center gap-1 text-[11px] font-bold", trendUp ? "text-emerald-500" : "text-rose-500")}>
            <span>{trendUp ? "↑" : "↓"} {trend}</span>
            <span className="text-slate-300 dark:text-slate-600 font-medium ml-1">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
}
