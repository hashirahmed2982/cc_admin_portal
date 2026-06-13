"use client";

// components/orders/OrderCodesModal.tsx
// Shows all delivered codes for an order, grouped by product.
// Admin can also resend the codes email from here.

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface DeliveredCode {
  codeId:  number;
  code:    string;
  soldAt:  string | null;
}

interface CodeGroup {
  productName: string;
  faceValue:   number;
  unitPrice:   number;
  codes:       DeliveredCode[];
}

interface Props {
  orderId:     string;
  orderNumber: string;
  clientName:  string;
  clientEmail: string;
  onClose:     () => void;
}

export default function OrderCodesModal({ orderId, orderNumber, clientName, clientEmail, onClose }: Props) {
  const [groups,    setGroups]    = useState<CodeGroup[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendOk,  setResendOk]  = useState(false);
  const [copied,    setCopied]    = useState<number | null>(null);

  useEffect(() => {
    api.getOrderCodes(orderId)
      .then(res => setGroups(res.data.codes))
      .catch(e  => setError(e.message || 'Failed to load codes'))
      .finally(()=> setLoading(false));
  }, [orderId]);

  const totalCodes = groups.reduce((s, g) => s + g.codes.length, 0);

  const copyCode = async (code: string, id: number) => {
    await navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const copyAll = async () => {
    const all = groups.flatMap(g => g.codes.map(c => `${g.productName}: ${c.code}`)).join('\n');
    await navigator.clipboard.writeText(all);
    setCopied(-1);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleResend = async () => {
    setResending(true);
    setResendOk(false);
    try {
      await api.resendOrderEmail(orderId);
      setResendOk(true);
      setTimeout(() => setResendOk(false), 4000);
    } catch (e: any) {
      setError(e.message || 'Failed to resend email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Delivered Codes — {orderNumber}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {clientName} · {clientEmail}
            </p>
          </div>
          <button onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-4 flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {loading && (
            <div className="flex items-center justify-center py-16">
              <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {!loading && !error && groups.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-sm font-medium">No delivered codes for this order yet</p>
            </div>
          )}

          {!loading && !error && groups.map((group, gi) => (
            <div key={gi} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              {/* Product header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50">
                <div>
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">{group.productName}</span>
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    {group.codes.length} code{group.codes.length !== 1 ? 's' : ''}
                    {group.faceValue > 0 && ` · $${group.faceValue.toFixed(2)} face value`}
                  </span>
                </div>
              </div>

              {/* Codes list */}
              <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {group.codes.map((c, ci) => (
                  <div key={c.codeId}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-5">{ci + 1}.</span>
                      <code className="font-mono text-sm text-gray-900 dark:text-white tracking-wide">
                        {c.code}
                      </code>
                    </div>
                    <div className="flex items-center gap-3">
                      {c.soldAt && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(c.soldAt).toLocaleDateString()}
                        </span>
                      )}
                      <button
                        onClick={() => copyCode(c.code, c.codeId)}
                        className="text-xs px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {copied === c.codeId ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {!loading && !error && groups.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900 rounded-b-2xl">

            {resendOk && (
              <div className="mb-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2.5 flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Codes email resent to {clientEmail}
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {totalCodes} code{totalCodes !== 1 ? 's' : ''} total
              </span>

              <div className="flex gap-2">
                <button
                  onClick={copyAll}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {copied === -1 ? (
                    <>
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied All
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy All
                    </>
                  )}
                </button>

                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {resending ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Resending…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Resend to Client
                    </>
                  )}
                </button>

                <button onClick={onClose}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer when empty */}
        {!loading && (groups.length === 0 || error) && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end">
            <button onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              Close
            </button>
          </div>
        )}

      </div>
    </div>
  );
}