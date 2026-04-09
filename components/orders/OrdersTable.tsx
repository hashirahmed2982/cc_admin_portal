// components/orders/OrdersTable.tsx
"use client";

import type { Order } from "@/types/order.types";
import { OrderStatusBadge, fmtDate, isCompletable } from "@/utils/order.utils";

interface Props {
  orders:          Order[];
  onView:          (order: Order) => void;
  onComplete:      (id: string) => void;
  completing:      string | null;
  showCompleteBtn: boolean;
}

const COLUMNS = [
  "Order", "Client", "Products", "Qty", "Total",
  "Status", "Delivery", "Placed", "Actions",
];

export default function OrdersTable({ orders, onView, onComplete, completing, showCompleteBtn }: Props) {
  if (!orders.length) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm text-gray-500 dark:text-gray-400">No orders found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            {COLUMNS.map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {orders.map(order => (
            <OrderRow
              key={order.id}
              order={order}
              onView={onView}
              onComplete={onComplete}
              completing={completing}
              showCompleteBtn={showCompleteBtn}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Row (extracted to avoid re-rendering the whole table) ───────────────────

function OrderRow({ order, onView, onComplete, completing, showCompleteBtn }: {
  order: Order;
  onView: (o: Order) => void;
  onComplete: (id: string) => void;
  completing: string | null;
  showCompleteBtn: boolean;
}) {
  const isProcessing = completing === order.id;

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <td className="px-4 py-3 font-mono font-medium text-gray-900 dark:text-white text-xs">
        {order.orderNumber}
      </td>

      <td className="px-4 py-3">
        <div className="font-medium text-gray-900 dark:text-white">{order.clientName}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{order.clientCompany}</div>
      </td>

      <td className="px-4 py-3 max-w-[180px]">
        <div className="text-xs text-gray-700 dark:text-gray-300 truncate" title={order.products}>
          {order.products || "—"}
        </div>
      </td>

      <td className="px-4 py-3 text-center text-sm">
        <span className="text-green-600 dark:text-green-400 font-medium">{order.deliveredQty}</span>
        <span className="text-gray-400 mx-0.5">/</span>
        <span className="text-gray-600 dark:text-gray-400">{order.totalQty}</span>
      </td>

      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
        {order.currency} {order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </td>

      <td className="px-4 py-3"><OrderStatusBadge status={order.status} /></td>
      <td className="px-4 py-3"><OrderStatusBadge status={order.deliveryStatus} /></td>

      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
        {fmtDate(order.createdAt)}
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onView(order)}
            className="px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-blue-300 dark:border-blue-700 whitespace-nowrap"
          >
            View Details
          </button>

          {showCompleteBtn && isCompletable(order) && (
            <button
              onClick={() => onComplete(order.id)}
              disabled={isProcessing}
              className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {isProcessing ? "…" : "Complete"}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
