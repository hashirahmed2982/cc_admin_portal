// components/orders/OrdersTable.tsx
"use client";

import { useState } from "react";
import type { Order } from "@/types/order.types";
import { OrderStatusBadge, fmtDate, isCompletable } from "@/utils/order.utils";
import OrderCodesModal from "@/components/orders/OrderCodesModal";

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
  const [codesOrder, setCodesOrder] = useState<Order | null>(null);

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
    <>
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
                onViewCodes={() => setCodesOrder(order)}
                completing={completing}
                showCompleteBtn={showCompleteBtn}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Codes viewer modal */}
      {codesOrder && (
        <OrderCodesModal
          orderId={codesOrder.id}
          orderNumber={codesOrder.orderNumber}
          clientName={codesOrder.clientName ?? ""}
          clientEmail={codesOrder.clientEmail ?? ""}
          onClose={() => setCodesOrder(null)}
        />
      )}
    </>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function OrderRow({ order, onView, onComplete, onViewCodes, completing, showCompleteBtn }: {
  order:           Order;
  onView:          (o: Order) => void;
  onComplete:      (id: string) => void;
  onViewCodes:     () => void;
  completing:      string | null;
  showCompleteBtn: boolean;
}) {
  const isProcessing  = completing === order.id;
  const hasDelivered  = (order.deliveredQty ?? 0) > 0;

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
        <span className="text-green-600 dark:text-green-400 font-medium">{order.deliveredQty ?? 0}</span>
        <span className="text-gray-400 mx-0.5">/</span>
        <span className="text-gray-600 dark:text-gray-400">{order.totalQty ?? 0}</span>
      </td>

      <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
        {order.currency} {order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </td>

      <td className="px-4 py-3">
        <OrderStatusBadge status={order.status} />
      </td>

      <td className="px-4 py-3">
        <OrderStatusBadge status={order.deliveryStatus} />
      </td>

      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {fmtDate(order.createdAt)}
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 flex-wrap">

          {/* View detail */}
          <button
            onClick={() => onView(order)}
            className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
          >
            View
          </button>

          {/* View codes — only if any codes were delivered */}
          {hasDelivered && (
            <button
              onClick={onViewCodes}
              className="px-2.5 py-1.5 text-xs border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors whitespace-nowrap flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Codes
            </button>
          )}

          {/* Complete */}
          {showCompleteBtn && isCompletable(order) && (
            <button
              onClick={() => onComplete(order.id)}
              disabled={isProcessing}
              className="px-2.5 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 whitespace-nowrap flex items-center gap-1"
            >
              {isProcessing ? (
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {isProcessing ? "…" : "Complete"}
            </button>
          )}

        </div>
      </td>
    </tr>
  );
}