/**
 * @file channels.ts — Transaction channel enum + display labels.
 * @module lib/transactions
 *
 * Single source of truth for the values stored in `transactions.channel` and
 * the human-readable labels rendered in the table + edit modal. Mirrors
 * PRD §F3 verbatim.
 *
 * @related db/schema.ts (transactions.channel column), components/transactions/EditCategoryModal.tsx
 */

export const CHANNELS = [
  { value: "OFFLINE_CASH", label: "Cash (offline)", group: "Offline" },
  { value: "OFFLINE_UPI", label: "UPI (offline)", group: "Offline" },
  { value: "OFFLINE_CARD", label: "Card / POS", group: "Offline" },
  { value: "ONLINE_AMAZON", label: "Amazon", group: "Online" },
  { value: "ONLINE_FLIPKART", label: "Flipkart", group: "Online" },
  { value: "ONLINE_OTHER", label: "Other online", group: "Online" },
  { value: "B2B_DIRECT", label: "B2B (NEFT/RTGS)", group: "B2B" },
  { value: "VENDOR_PAYMENT", label: "Vendor payment", group: "Outflows" },
  { value: "OPERATING_EXPENSE", label: "Operating expense", group: "Outflows" },
  { value: "PERSONAL", label: "Personal / drawings", group: "Outflows" },
] as const;

export type Channel = (typeof CHANNELS)[number]["value"];

export function getChannelLabel(value: string | null): string {
  if (!value) return "—";
  return CHANNELS.find((c) => c.value === value)?.label ?? value;
}
