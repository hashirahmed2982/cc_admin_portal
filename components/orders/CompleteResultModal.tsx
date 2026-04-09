// components/orders/CompleteResultModal.tsx
"use client";

import type { CompleteResult } from "@/hooks/useOrders";

interface Props {
  result:  CompleteResult;
  onClose: () => void;
}

const REASON_LABEL: Record<string, string> = {
  insufficient_inventory: "Not enough codes in inventory",
  supplier_api_pending:   "Supplier API fulfillment — pending external delivery",
};

export default function CompleteResultModal({ result, onClose }: Props) {
  const allFulfilled = result.pendingItems.length === 0;
  const noneFulfilled =
    result.fulfilledItems.length === 0 && result.pendingItems.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className={`px-6 py-5 ${
          allFulfilled
            ? "bg-green-600"
            : noneFulfilled
              ? "bg-red-600"
              : "bg-orange-500"
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {allFulfilled ? (
                <svg className="w-7 h-7 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : noneFulfilled ? (
                <svg className="w-7 h-7 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-7 h-7 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {allFulfilled
                    ? "Order Fully Fulfilled"
                    : noneFulfilled
                      ? "Fulfillment Failed"
                      : "Partially Fulfilled"}
                </h3>
                <p className="text-sm text-white/80 mt-0.5">{result.orderNumber}</p>
              </div>
            </div>
            <button onClick={onClose}
              className="text-white/70 hover:text-white transition-colors mt-0.5 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Fulfilled items */}
          {result.fulfilledItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Fulfilled ({result.fulfilledItems.length})
                </h4>
              </div>
              <div className="space-y-2">
                {result.fulfilledItems.map((item, i) => (
                  <div key={i}
                    className="flex items-center justify-between px-3 py-2.5 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.productName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {item.delivered} of {item.quantity} code{item.quantity !== 1 ? "s" : ""} sent to client
                      </p>
                    </div>
                    <div className="flex-shrink-0 ml-3">
                      <span className="text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                        {item.delivered}/{item.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Still-pending items */}
          {result.pendingItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Still Pending ({result.pendingItems.length})
                </h4>
              </div>
              <div className="space-y-2">
                {result.pendingItems.map((item, i) => (
                  <div key={i}
                    className="px-3 py-2.5 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.productName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {item.pending} unit{item.pending !== 1 ? "s" : ""} remaining
                          {item.delivered > 0 && ` · ${item.delivered} already delivered`}
                        </p>
                      </div>
                      <span className="flex-shrink-0 text-xs font-semibold text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">
                        {item.pending} pending
                      </span>
                    </div>
                    {/* Reason */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <svg className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs text-orange-700 dark:text-orange-400">
                        {REASON_LABEL[item.reason] ?? item.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advice when items still pending */}
          {result.pendingItems.length > 0 && (
            <div className="flex items-start gap-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Upload more codes to inventory for the pending products, then click{" "}
                <strong>Mark Complete</strong> again on this order to fulfill the remaining items.
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between gap-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {allFulfilled ? (
              <span className="text-green-600 dark:text-green-400 font-medium">
                ✓ Client has been notified by email
              </span>
            ) : result.fulfilledItems.length > 0 ? (
              <span className="text-orange-600 dark:text-orange-400 font-medium">
                Client emailed for fulfilled items
              </span>
            ) : (
              <span className="text-gray-500">No codes sent — inventory empty</span>
            )}
          </div>
          <button onClick={onClose}
            className="px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
