"use client";

/**
 * @file UploadTypeSelector.tsx — Radio group choosing what kind of file is being uploaded.
 * @module components/upload
 *
 * All three options are visible in stage 2.1 even though only `bank_statement`
 * has a working backend through stage 2.2/2.3. Settlement parsing arrives in
 * stage 4.3. Showing the full set now keeps the UX stable across layers.
 *
 * @dependencies @/components/ui/radio-group, @/components/ui/label
 * @related components/upload/index.ts, lib/hooks/useUpload.ts
 */

import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export type UploadType =
  | "bank_statement"
  | "amazon_settlement"
  | "flipkart_settlement";

interface UploadTypeOption {
  value: UploadType;
  label: string;
  description: string;
}

import { Building2, ShoppingCart, ShoppingBag } from "lucide-react";

export function UploadTypeSelector({
  value,
  onChange,
  disabled,
}: UploadTypeSelectorProps) {
  const options = [
    {
      value: "bank_statement",
      label: "Bank statement",
      description: "HDFC, ICICI, SBI or any standard CSV export",
      icon: <Building2 className="h-6 w-6" />,
      color: "indigo"
    },
    {
      value: "amazon_settlement",
      label: "Amazon settlement report",
      description: "V2 Flat File from Seller Central → Reports → Payments",
      icon: <ShoppingCart className="h-6 w-6" />,
      color: "emerald"
    },
    {
      value: "flipkart_settlement",
      label: "Flipkart settlement report",
      description: "Settlement CSV from Flipkart Seller Hub",
      icon: <ShoppingBag className="h-6 w-6" />,
      color: "amber"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt.value as any)}
          className={cn(
            "relative flex flex-col items-start p-6 rounded-[24px] border transition-all text-left group min-h-[180px]",
            value === opt.value
              ? "bg-indigo-50/30 border-indigo-200 ring-1 ring-indigo-200 shadow-sm"
              : "bg-white border-slate-100 hover:border-slate-200"
          )}
        >
          <div className={cn(
            "h-12 w-12 rounded-2xl flex items-center justify-center mb-6 transition-all shadow-sm",
            value === opt.value ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-400 group-hover:text-slate-600"
          )}>
            {opt.icon}
          </div>
          
          <div className="flex flex-col flex-1">
            <span className={cn(
              "text-sm font-black transition-colors",
              value === opt.value ? "text-slate-900" : "text-slate-500"
            )}>
              {opt.label}
            </span>
            <span className="text-[10px] font-bold text-slate-400 mt-2 leading-relaxed">
              {opt.description}
            </span>
          </div>

          <div className={cn(
            "absolute top-4 right-4 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
            value === opt.value
              ? "border-indigo-600 bg-indigo-600 shadow-lg shadow-indigo-600/30"
              : "border-slate-200 group-hover:border-slate-300"
          )}>
             {value === opt.value && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
          </div>
        </button>
      ))}
    </div>
  );
}


