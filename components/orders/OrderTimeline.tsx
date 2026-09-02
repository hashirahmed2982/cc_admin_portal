// components/orders/OrderTimeline.tsx
// "What has happened since this order was placed" — a single chronological
// view merging the order-level lifecycle (placed/completed) with every
// per-line supplier attempt (Master Plan §10.7's fulfillment_attempts),
// which used to be siloed behind a per-row expand click in the items
// table below. Built entirely from data the order detail API already
// returns — no new backend endpoint needed.
"use client";

import type { Order } from "@/types/order.types";
import { fmtDate } from "@/utils/order.utils";

interface TimelineEvent {
  time: string;
  kind: "placed" | "success" | "failed" | "completed";
  title: string;
  detail: string | null;
}

function buildTimeline(order: Order): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  if (order.createdAt) {
    events.push({
      time: order.createdAt,
      kind: "placed",
      title: "Order placed",
      detail: `${order.currency} ${order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} — ${order.clientName}`,
    });
  }

  for (const item of order.items || []) {
    for (const a of item.fulfillmentAttempts) {
      const success = a.result === "success";
      events.push({
        time: a.attemptedAt,
        kind: success ? "success" : "failed",
        title: `${item.productName} — tried ${a.supplier}`,
        detail: success
          ? `Accepted${a.reference ? ` — ref ${a.reference}` : ""}`
          : `Rejected — ${a.reason || "no reason given"}`,
      });
    }
  }

  if (order.completedAt) {
    events.push({ time: order.completedAt, kind: "completed", title: "Order completed", detail: null });
  }

  return events
    .filter((e) => e.time)
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
}

const DOT_CLASSES: Record<TimelineEvent["kind"], string> = {
  placed: "bg-blue-500",
  success: "bg-green-500",
  failed: "bg-red-500",
  completed: "bg-green-600",
};

export default function OrderTimeline({ order }: { order: Order }) {
  const events = buildTimeline(order);
  if (events.length === 0) return null;

  // Lines still waiting with no attempt recorded yet at all (e.g. a
  // synchronous local delivery, or a supplier call still in flight this
  // instant) don't have a discrete timestamped event to show — surfaced
  // here instead of invented as a fake timeline entry.
  const silentlyPending = (order.items || []).filter(
    (i) => i.pendingQty > 0 && i.fulfillmentAttempts.length === 0
  );

  return (
    <div className="mb-6">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        Order Timeline
      </p>
      <div className="space-y-0">
        {events.map((e, idx) => (
          <div key={idx} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${DOT_CLASSES[e.kind]}`} />
              {idx < events.length - 1 && <span className="w-px flex-1 bg-gray-200 dark:bg-gray-700 my-1" />}
            </div>
            <div className="pb-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{e.title}</p>
              {e.detail && <p className="text-xs text-gray-500 dark:text-gray-400">{e.detail}</p>}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{fmtDate(e.time)}</p>
            </div>
          </div>
        ))}
      </div>
      {silentlyPending.length > 0 && (
        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
          Still waiting, no attempt recorded yet: {silentlyPending.map((i) => i.productName).join(", ")}
        </p>
      )}
    </div>
  );
}
