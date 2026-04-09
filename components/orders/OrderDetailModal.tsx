// components/orders/OrderDetailModal.tsx
"use client";

import type { Order, OrderItem } from "@/types/order.types";
import { OrderStatusBadge, fmtDate, isCompletable } from "@/utils/order.utils";

interface Props {
  order:      Order;
  onClose:    () => void;
  onComplete: (id: string) => void;
  completing: boolean;
}

export default function OrderDetailModal({ order, onClose, onComplete, completing }: Props) {
  const canComplete = isCompletable(order);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {order.orderNumber}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {order.clientName}
                {order.clientCompany && ` — ${order.clientCompany}`}
                {order.clientEmail  && (
                  <span className="ml-2 text-xs text-gray-400">{order.clientEmail}</span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Meta strip ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <MetaCell label="Order Status">
            <OrderStatusBadge status={order.status} />
          </MetaCell>
          <MetaCell label="Delivery">
            <OrderStatusBadge status={order.deliveryStatus} />
          </MetaCell>
          <MetaCell label="Total">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {order.currency} {order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </MetaCell>
          <MetaCell label="Placed">
            <span className="text-sm text-gray-700 dark:text-gray-300">{fmtDate(order.createdAt)}</span>
          </MetaCell>
        </div>

        {/* ── Items table ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6">
          {!order.items?.length ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin w-6 h-6 text-blue-500 mr-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm text-gray-500 dark:text-gray-400">Loading item details…</span>
            </div>
          ) : (
            <ItemsTable items={order.items} />
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium text-green-600 dark:text-green-400">{order.deliveredQty}</span>
              {" / "}
              <span className="font-medium">{order.totalQty}</span>
              {" items delivered"}
              {order.completedAt && (
                <span className="ml-2">· Completed {fmtDate(order.completedAt)}</span>
              )}
            </p>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                Close
              </button>

              {canComplete && (
                <button
                  onClick={() => onComplete(order.id)}
                  disabled={completing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {completing ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Completing…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Mark Complete & Notify Client
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetaCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      {children}
    </div>
  );
}

function ItemsTable({ items }: { items: OrderItem[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200 dark:border-gray-700">
          {["Product", "Ordered", "Delivered", "Pending", "Unit Price", "Status"].map(h => (
            <th key={h} className="py-2 pr-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={`${item.orderDetailId}-${i}`} className="border-b border-gray-100 dark:border-gray-700/60">
            <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">
              {item.productName}
            </td>
            <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{item.quantity}</td>
            <td className="py-3 pr-4">
              <span className="text-green-600 dark:text-green-400 font-medium">{item.deliveredQty}</span>
            </td>
            <td className="py-3 pr-4">
              {item.pendingQty > 0
                ? <span className="text-orange-600 dark:text-orange-400 font-medium">{item.pendingQty}</span>
                : <span className="text-gray-400 dark:text-gray-600">—</span>
              }
            </td>
            <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
              ${item.unitPrice.toFixed(2)}
            </td>
            <td className="py-3">
              <OrderStatusBadge status={item.deliveryStatus} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
