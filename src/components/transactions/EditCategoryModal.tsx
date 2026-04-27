"use client";

/**
 * @file EditCategoryModal.tsx — Manual category + channel + GST head override.
 * @module components/transactions
 *
 * Layer 2 scope: simple selects backed by the seeded gst_categories table and
 * the channel constants. Stage 3.5 will extend this with confidence
 * indicators, AI reasoning tooltip, and an "apply to similar" checkbox.
 *
 * Uses useUpdateTransaction (optimistic) so the table reflects the change
 * immediately on submit. Errors roll back via the hook's onError handler.
 *
 * @dependencies @/lib/hooks/useUpdateTransaction, sonner
 * @related components/transactions/TransactionTable.tsx, lib/hooks/useUpdateTransaction.ts
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { CHANNELS } from "@/lib/transactions";
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

  useEffect(() => {
    if (transaction) {
      setCategory(transaction.category ?? "");
      setChannel(transaction.channel ?? "");
    }
  }, [transaction]);

  if (!transaction) return null;

  async function handleSubmit() {
    if (!transaction) return;
    const payload: Parameters<typeof update.mutate>[0] = {
      id: transaction.id,
      category: category || null,
      channel: channel || null,
    };
    // Auto-derive gst_head from selected category.
    const matched = categories.find((c) => c.category === category);
    if (matched) payload.gst_head = matched.gst_section;
    update.mutate(payload, {
      onSuccess: () => {
        toast.success("Transaction updated");
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
