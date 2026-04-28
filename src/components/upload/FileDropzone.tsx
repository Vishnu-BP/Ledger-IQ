"use client";

/**
 * @file FileDropzone.tsx — Drag-and-drop file picker with click-to-browse fallback.
 * @module components/upload
 *
 * Validates extension (.csv) and size (≤10 MB) on the client BEFORE handing the
 * File to the parent via onFile. Server enforces the same limits independently
 * in stage 2.2 (defense in depth per CLAUDE.md). On invalid input, surfaces a
 * sonner toast and stays in idle state — never silently drops user input.
 *
 * @dependencies sonner, lucide-react
 * @related components/upload/index.ts, app/(app)/upload/page.tsx
 */

import { FileSpreadsheet, Upload } from "lucide-react";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB per PRD §12.1
const CSV_EXT_REGEX = /\.csv$/i;

interface FileDropzoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function FileDropzone({ onFile, disabled }: FileDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function validateAndAccept(file: File) {
    if (!CSV_EXT_REGEX.test(file.name)) {
      toast.error("Only CSV files are supported", {
        description: `Got "${file.name}". Export a .csv from your bank's net banking.`,
      });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("File too large", {
        description: `Maximum 10 MB; this file is ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
      });
      return;
    }
    onFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndAccept(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) validateAndAccept(file);
    // Reset so picking the same file twice still fires onChange.
    e.target.value = "";
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col items-center justify-center gap-6 rounded-[32px] border-2 border-dashed p-16 text-center transition-all",
        dragOver && !disabled
          ? "border-indigo-600 bg-indigo-50/50"
          : "border-slate-100 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-900/30",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <div className="relative">
        <div className="h-20 w-20 rounded-full bg-indigo-600/10 flex items-center justify-center animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Upload className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          {dragOver ? "Drop to upload" : "Drag and drop your CSV file here"}
        </p>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          .csv files up to 10 MB
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept=".csv,text/csv"
          onChange={handleChange}
          disabled={disabled}
          className="sr-only"
        />
        <Button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="px-10 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all hover:scale-[1.02]"
        >
          Choose file
        </Button>
        <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">or drag and drop</p>
      </div>
    </div>
  );
}


