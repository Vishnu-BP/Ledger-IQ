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
        "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center transition",
        dragOver && !disabled
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 bg-card/50",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        {dragOver ? (
          <FileSpreadsheet className="h-6 w-6 text-primary" />
        ) : (
          <Upload className="h-6 w-6 text-muted-foreground" />
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">
          {dragOver ? "Drop to upload" : "Drag and drop a CSV here"}
        </p>
        <p className="text-xs text-muted-foreground">
          .csv files up to 10 MB
        </p>
      </div>

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
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        Choose file
      </Button>
    </div>
  );
}
