// utils/order.utils.tsx
"use client";

import type { Order } from "@/types/order.types";

// ─── Date formatter ───────────────────────────────────────────────────────────

export function fmtDate(raw: string | null | undefined): string {
  if (!raw) return "—";
  const d = new Date(raw);
  return isNaN(d.getTime())
    ? raw
    : d.toLocaleString(undefined, {
        day:    "2-digit",
        month:  "short",
        year:   "numeric",
        hour:   "2-digit",
        minute: "2-digit",
        hour12: true,
      });
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CLASSES: Record<string, string> = {
  completed:  "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  pending:    "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
  failed:     "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  cancelled:  "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
  partial:    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded capitalize ${STATUS_CLASSES[status] ?? STATUS_CLASSES.pending}`}>
      {status}
    </span>
  );
}

// ─── Guard: can admin still complete this order? ──────────────────────────────

export function isCompletable(order: Order): boolean {
  return order.status !== "completed" && order.status !== "cancelled";
}
