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

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type UploadType =
  | "bank_statement"
  | "amazon_settlement"
  | "flipkart_settlement";

interface UploadTypeOption {
  value: UploadType;
  label: string;
  description: string;
}

const OPTIONS: UploadTypeOption[] = [
  {
    value: "bank_statement",
    label: "Bank statement",
    description: "HDFC, ICICI, or any standard CSV export.",
  },
  {
    value: "amazon_settlement",
    label: "Amazon settlement report",
    description: "V2 Flat File from Seller Central → Reports → Payments.",
  },
  {
    value: "flipkart_settlement",
    label: "Flipkart settlement report",
    description: "Settlement CSV from Flipkart Seller Hub.",
  },
];

interface UploadTypeSelectorProps {
  value: UploadType;
  onChange: (value: UploadType) => void;
  disabled?: boolean;
}

export function UploadTypeSelector({
  value,
  onChange,
  disabled,
}: UploadTypeSelectorProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onChange(v as UploadType)}
      disabled={disabled}
      className="grid gap-3"
    >
      {OPTIONS.map((opt) => (
        <Label
          key={opt.value}
          htmlFor={`upload-type-${opt.value}`}
          className="flex cursor-pointer items-start gap-3 rounded-md border p-3 transition hover:bg-accent/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
        >
          <RadioGroupItem
            id={`upload-type-${opt.value}`}
            value={opt.value}
            className="mt-0.5"
          />
          <div className="space-y-0.5">
            <div className="text-sm font-medium leading-none">{opt.label}</div>
            <div className="text-xs text-muted-foreground">
              {opt.description}
            </div>
          </div>
        </Label>
      ))}
    </RadioGroup>
  );
}
