// components/orders/OrderStatsCards.tsx
"use client";

import type { OrderStats } from "@/types/order.types";

interface Props {
  stats:   OrderStats;
  loading: boolean;
}

const CARDS = [
  {
    key:   "total" as keyof OrderStats,
    label: "Total Orders",
    sub:   "All time",
    color: "blue",
    icon:  "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  },
  {
    key:   "pending" as keyof OrderStats,
    label: "Pending",
    sub:   "Awaiting fulfillment",
    color: "orange",
    icon:  "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    key:   "processing" as keyof OrderStats,
    label: "Processing",
    sub:   "Partially delivered",
    color: "yellow",
    icon:  "M13 10V3L4 14h7v7l9-11h-7z",
  },
  {
    key:   "completed" as keyof OrderStats,
    label: "Completed",
    sub:   null, // revenue shown dynamically
    color: "green",
    icon:  "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

export default function OrderStatsCards({ stats, loading }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {CARDS.map(({ key, label, sub, color, icon }) => (
        <div key={key} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                {loading ? "—" : stats[key].toLocaleString()}
              </p>
            </div>
            <div className={`w-12 h-12 bg-${color}-100 dark:bg-${color}-900/20 rounded-full flex items-center justify-center`}>
              <svg className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {key === "completed"
              ? loading ? "Loading…" : `$${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} revenue`
              : sub}
          </p>
        </div>
      ))}
    </div>
  );
}
