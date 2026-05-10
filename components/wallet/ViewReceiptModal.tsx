"use client";

import { useState, useEffect } from "react";
import { TopupRequest } from "@/app/wallet/page";
import { api } from "@/lib/api";

interface ViewReceiptModalProps {
  request: TopupRequest;
  onClose: () => void;
}

export default function ViewReceiptModal({ request, onClose }: ViewReceiptModalProps) {
  const [signedUrl,  setSignedUrl]  = useState<string | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [isPdf,      setIsPdf]      = useState(false);

  useEffect(() => {
    if (!request.receiptUrl) { setLoading(false); return; }

    // Get a signed URL from the backend so we can display/download the file
    api.getReceiptSignedUrl(Number(request.id))
      .then(res => {
        const url = res.data?.url ?? request.receiptUrl;
        setSignedUrl(url);
        setIsPdf(url.toLowerCase().includes(".pdf") || url.toLowerCase().includes("pdf"));
      })
      .catch(() => {
        // Fallback — try to use the raw receipt URL directly
        setSignedUrl(request.receiptUrl);
        setIsPdf(request.receiptUrl?.toLowerCase().includes(".pdf") ?? false);
      })
      .finally(() => setLoading(false));
  }, [request.id, request.receiptUrl]);

  const handleDownload = () => {
    if (!signedUrl) return;
    const a = document.createElement("a");
    a.href = signedUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.download = `receipt-${request.id}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Payment Receipt</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Request #{request.id}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Meta strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Client</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{request.userName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{request.company}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Amount</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">${request.amount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Request Date</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{request.requestDate}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
            <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded ${
              request.status === "pending"  ? "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400" :
              request.status === "approved" ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"   :
                                              "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
            }`}>{request.status.toUpperCase()}</span>
          </div>
        </div>

        {/* Receipt display */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          ) : !request.receiptUrl ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-gray-600">
              <svg className="w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p className="text-sm">No receipt attached</p>
            </div>
          ) : isPdf ? (
            /* PDF — show in iframe */
            <iframe
              src={signedUrl ?? ""}
              className="w-full h-[500px] border border-gray-200 dark:border-gray-700 rounded-lg"
              title="Payment Receipt"
            />
          ) : signedUrl ? (
            /* Image receipt */
            <div className="flex flex-col items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signedUrl}
                alt="Payment Receipt"
                className="max-w-full rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                onError={() => setError("Could not load receipt image")}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <p className="text-sm">Unable to load receipt</p>
            </div>
          )}

          {/* Verification checklist */}
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                <p className="font-medium mb-2">Verification Checklist:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Verify amount matches: <strong>${request.amount.toLocaleString()}</strong></li>
                  <li>Check the receipt is dated recently</li>
                  <li>Confirm transfer is to your company account</li>
                  <li>Ensure receipt is not a duplicate</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3 flex-shrink-0">
          {signedUrl && (
            <button onClick={handleDownload}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Download Receipt
            </button>
          )}
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}