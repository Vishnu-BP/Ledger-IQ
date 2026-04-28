"use client";

/**
 * @file EditCategoryModal.tsx — Manual category + channel + GST head override.
 * @module components/transactions
 *
 * Stage 3.5 extends Layer 2's basic edit form with the "Apply to all
 * transactions with this exact description" checkbox. When checked, the
 * service writes a `category_overrides` row + cascades the new fields to
 * every sibling row in the same business whose lower(trim(description))
 * matches — and the success toast reports `Updated and applied to N similar`.
 *
 * Uses useUpdateTransaction (optimistic for the source row) so the table
 * reflects the change immediately on submit. Errors roll back via the hook's
 * onError handler.
 *
 * @dependencies @/lib/hooks/useUpdateTransaction, sonner
 * @related components/transactions/TransactionTable.tsx, lib/hooks/useUpdateTransaction.ts
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateTransaction } from "@/lib/hooks";
import { CHANNELS } from "@/lib/transactions/channels";
import type { Transaction } from "@/types/transaction";

export interface CategoryOption {
  category: string;
  gst_section: string;
}

interface EditCategoryModalProps {
  transaction: Transaction | null;
  categories: CategoryOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCategoryModal({
  transaction,
  categories,
  open,
  onOpenChange,
}: EditCategoryModalProps) {
  const update = useUpdateTransaction();
  const [category, setCategory] = useState<string>("");
  const [channel, setChannel] = useState<string>("");
  const [applyToSimilar, setApplyToSimilar] = useState(false);

  useEffect(() => {
    if (transaction) {
      setCategory(transaction.category ?? "");
      setChannel(transaction.channel ?? "");
      setApplyToSimilar(false);
    }
  }, [transaction]);

  if (!transaction) return null;

  async function handleSubmit() {
    if (!transaction) return;
    const payload: Parameters<typeof update.mutate>[0] = {
      id: transaction.id,
      category: category || null,
      channel: channel || null,
      apply_to_similar: applyToSimilar,
    };
    // Auto-derive gst_head from selected category.
    const matched = categories.find((c) => c.category === category);
    if (matched) payload.gst_head = matched.gst_section;
    update.mutate(payload, {
      onSuccess: (data) => {
        if (applyToSimilar) {
          const n = data.similar_count ?? 0;
          toast.success(
            n > 0
              ? `Updated and applied to ${n} similar transaction${n === 1 ? "" : "s"}`
              : "Updated. Override saved for future uploads.",
          );
        } else {
          toast.success("Transaction updated");
        }
        onOpenChange(false);
      },
      onError: (err) => {
        toast.error(err.message);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit transaction</DialogTitle>
          <DialogDescription className="line-clamp-2">
            {transaction.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category || undefined} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Pick a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.category} value={c.category}>
                    {c.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Channel</Label>
            <Select value={channel || undefined} onValueChange={setChannel}>
              <SelectTrigger>
                <SelectValue placeholder="Pick a channel" />
              </SelectTrigger>
              <SelectContent>
                {CHANNELS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-start gap-3 rounded-md border border-dashed bg-muted/40 px-3 py-2.5">
            <Checkbox
              id="apply-to-similar"
              checked={applyToSimilar}
              onCheckedChange={(v) => setApplyToSimilar(v === true)}
              disabled={!category}
              className="mt-0.5"
            />
            <div className="flex-1 space-y-0.5">
              <Label
                htmlFor="apply-to-similar"
                className="cursor-pointer text-sm font-medium leading-none"
              >
                Apply to all transactions with this exact description
              </Label>
              <p className="text-xs text-muted-foreground">
                Saves an override rule. Future uploads with the same description
                pick up this categorisation automatically.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={update.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
