"use client";

import { BarChart3, LayoutDashboard, Receipt, FileText, Settings, HelpCircle, ArrowUpRight, ArrowDownRight, MoreHorizontal } from "lucide-react";

export function DashboardMockup() {
  return (
    <div className="flex h-full w-full bg-[#030113] text-white overflow-hidden rounded-2xl border border-white/5 shadow-2xl">
      {/* Sidebar */}
      <div className="w-12 xl:w-16 flex flex-col items-center py-6 border-r border-white/5 bg-black/20">
        <div className="p-2 mb-8 rounded-lg bg-indigo-600/20 text-indigo-400">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div className="flex flex-col gap-6">
          <LayoutDashboard className="h-5 w-5 text-indigo-500" />
          <Receipt className="h-5 w-5 text-white/40" />
          <FileText className="h-5 w-5 text-white/40" />
          <Settings className="h-5 w-5 text-white/40" />
          <div className="mt-20">
            <HelpCircle className="h-5 w-5 text-white/40" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 flex flex-col gap-6 overflow-hidden">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Dashboard</h3>
          <MoreHorizontal className="h-4 w-4 text-white/40" />
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-3 gap-4">
          {/* Total Cashflow */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-20">
              <MoreHorizontal className="h-3 w-3" />
            </div>
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Total Cashflow</p>
            <h4 className="text-sm xl:text-base font-bold">₹12,45,000</h4>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
              <ArrowUpRight className="h-3 w-3" />
              <span>12.5%</span>
            </div>
            {/* Sparkline simulation */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500/0 via-indigo-500/40 to-indigo-500/0" />
          </div>

          {/* Expenses */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Expenses</p>
            <h4 className="text-sm xl:text-base font-bold">₹3,45,000</h4>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-rose-400 font-medium">
              <ArrowDownRight className="h-3 w-3" />
              <span>8.2%</span>
            </div>
          </div>

          {/* Invoices */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Invoices</p>
            <h4 className="text-sm xl:text-base font-bold">₹8,90,000</h4>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
              <ArrowUpRight className="h-3 w-3" />
              <span>15.5%</span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="flex-1 grid grid-cols-5 gap-4">
          {/* Cashflow Overview */}
          <div className="col-span-3 p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Cashflow Overview</p>
              <span className="text-[10px] text-white/20">₹12,45,000</span>
            </div>
            <div className="flex-1 relative flex items-end gap-1 px-1 py-2">
              {/* Simulated Line Chart with SVG */}
              <svg className="absolute inset-0 h-full w-full opacity-60" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path 
                  d="M0 80 Q 20 20, 40 60 T 80 10 T 100 50" 
                  fill="none" 
                  stroke="#6366F1" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                />
                <path 
                  d="M0 80 Q 20 20, 40 60 T 80 10 T 100 50 V 100 H 0 Z" 
                  fill="url(#gradient)" 
                  className="opacity-20"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              </svg>
              {/* X-Axis labels */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[8px] text-white/20">
                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
              </div>
            </div>
          </div>

          {/* Top Expenses (Donut) */}
          <div className="col-span-2 p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-4">
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Top Expenses</p>
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              {/* Donut Chart Simulation */}
              <div className="relative h-20 w-20 flex items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#6366F1" strokeWidth="4" strokeDasharray="62, 100" strokeLinecap="round" />
                </svg>
                <span className="absolute text-[10px] font-bold">62%</span>
              </div>
              {/* Legend */}
              <div className="w-full flex flex-col gap-2">
                <div className="flex items-center justify-between text-[8px]">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    <span className="text-white/60">Operations</span>
                  </div>
                  <span className="font-medium">62%</span>
                </div>
                <div className="flex items-center justify-between text-[8px]">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                    <span className="text-white/60">Salaries</span>
                  </div>
                  <span className="font-medium">20%</span>
                </div>
                <div className="flex items-center justify-between text-[8px]">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                    <span className="text-white/60">Marketing</span>
                  </div>
                  <span className="font-medium">10%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
