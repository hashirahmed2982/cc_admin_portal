// components/orders/OrderDetailModal.tsx
"use client";

import { Fragment, useState } from "react";
import type { Order, OrderItem } from "@/types/order.types";
import { OrderStatusBadge, fmtDate, isCompletable, isCancellable } from "@/utils/order.utils";

interface Props {
  order:      Order;
  onClose:    () => void;
  onComplete: (id: string) => void;
  onCancel:   (id: string, reason: string) => void;
  completing: boolean;
  cancelling: boolean;
}

export default function OrderDetailModal({ order, onClose, onComplete, onCancel, completing, cancelling }: Props) {
  const canComplete = isCompletable(order);
  const canCancel   = isCancellable(order);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason,      setCancelReason]      = useState("");

  const handleCancelSubmit = () => {
    onCancel(order.id, cancelReason.trim());
    setShowCancelConfirm(false);
    setCancelReason("");
  };

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

        {/* ── Cancel confirm panel (inline, slides in above footer) ────────── */}
        {showCancelConfirm && (
          <div className="border-t border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-6 py-4 space-y-3">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm font-semibold">
                Cancel this order? Undelivered items will be refunded to the client's wallet.
              </p>
            </div>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)"
              rows={2}
              className="w-full text-sm px-3 py-2 border border-red-200 dark:border-red-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowCancelConfirm(false); setCancelReason(""); }}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelSubmit}
                disabled={cancelling}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {cancelling ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Cancelling…
                  </>
                ) : "Confirm Cancel & Refund"}
              </button>
            </div>
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {/* <span className="font-medium text-green-600 dark:text-green-400">{order.deliveredQty}</span>
              {" / "}
              <span className="font-medium">{order.totalQty}</span>
              {" items delivered"} */}
              {order.completedAt && (
                <span className="ml-2">Completed {fmtDate(order.completedAt)}</span>
              )}
            </p>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                Close
              </button>

              {/* Cancel button */}
              {canCancel && !showCancelConfirm && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={cancelling || completing}
                  className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel Order
                </button>
              )}

              {/* Complete button */}
              {canComplete && (
                <button
                  onClick={() => onComplete(order.id)}
                  disabled={completing || cancelling || showCancelConfirm}
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
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200 dark:border-gray-700">
          {["Product", "Ordered", "Delivered", "Pending", "Unit Price", "Status", "Supplier"].map(h => (
            <th key={h} className="py-2 pr-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => {
          const hasTrail = item.fulfillmentSupplier || item.fulfillmentAttempts.length > 0 || item.pendingReason;
          const isExpanded = expandedId === item.orderDetailId;
          return (
            <Fragment key={`${item.orderDetailId}-${i}`}>
              <tr
                className={`border-b border-gray-100 dark:border-gray-700/60 ${hasTrail ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40" : ""}`}
                onClick={() => hasTrail && setExpandedId(isExpanded ? null : item.orderDetailId)}
              >
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
                <td className="py-3 pr-4">
                  {item.fulfillmentSupplier ? (
                    <span className="capitalize text-gray-700 dark:text-gray-300">{item.fulfillmentSupplier}</span>
                  ) : hasTrail ? (
                    <span className="text-orange-600 dark:text-orange-400 text-xs">attempted, none succeeded</span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-600">—</span>
                  )}
                  {hasTrail && (
                    <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">{isExpanded ? "▲ hide" : "▼ details"}</span>
                  )}
                </td>
              </tr>
              {isExpanded && (
                <tr className="bg-gray-50 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-700/60">
                  <td colSpan={7} className="py-3 px-4">
                    <FulfillmentTrail item={item} />
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

function FulfillmentTrail({ item }: { item: OrderItem }) {
  return (
    <div className="text-xs space-y-2">
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-gray-600 dark:text-gray-400">
        {item.pendingReason && (
          <div><span className="font-medium text-gray-700 dark:text-gray-300">Stuck reason:</span> {item.pendingReason}</div>
        )}
        {item.supplierOrderId && (
          <div><span className="font-medium text-gray-700 dark:text-gray-300">Supplier order ID:</span> <span className="font-mono">{item.supplierOrderId}</span></div>
        )}
        {item.lastPolledAt && (
          <div><span className="font-medium text-gray-700 dark:text-gray-300">Last polled:</span> {new Date(item.lastPolledAt).toLocaleString()}</div>
        )}
      </div>
      {item.fulfillmentAttempts.length > 0 && (
        <div>
          <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Supplier attempt history (§10 — every supplier tried, cheapest first):</p>
          <table className="w-full">
            <thead>
              <tr className="text-gray-500 dark:text-gray-400">
                <th className="text-left font-medium pr-4 py-1">Supplier</th>
                <th className="text-left font-medium pr-4 py-1">Result</th>
                <th className="text-left font-medium pr-4 py-1">Reason</th>
                <th className="text-left font-medium pr-4 py-1">When</th>
                <th className="text-left font-medium py-1">Reference</th>
              </tr>
            </thead>
            <tbody>
              {item.fulfillmentAttempts.map((a, idx) => (
                <tr key={idx} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="capitalize pr-4 py-1 text-gray-800 dark:text-gray-200">{a.supplier}</td>
                  <td className="pr-4 py-1">
                    <span className={a.result === "success" ? "text-green-600 dark:text-green-400 font-medium" : "text-red-600 dark:text-red-400 font-medium"}>
                      {a.result}
                    </span>
                  </td>
                  <td className="pr-4 py-1 text-gray-600 dark:text-gray-400">{a.reason || "—"}</td>
                  <td className="pr-4 py-1 text-gray-500 dark:text-gray-500">{new Date(a.attemptedAt).toLocaleString()}</td>
                  <td className="py-1 font-mono text-gray-500 dark:text-gray-500">{a.reference ? a.reference.slice(0, 12) + "…" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}