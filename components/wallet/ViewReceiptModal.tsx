"use client";

import { TopupRequest } from "@/app/wallet/page";

interface ViewReceiptModalProps {
  request: TopupRequest;
  onClose: () => void;
}

export default function ViewReceiptModal({
  request,
  onClose,
}: ViewReceiptModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Payment Receipt
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Request ID: {request.id}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Request Details */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Client</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {request.userName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {request.company}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Amount</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${request.amount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Request Date</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {request.requestDate}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
              <span
                className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded ${
                  request.status === "pending"
                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                    : request.status === "approved"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                }`}
              >
                {request.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Receipt Display */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-8 min-h-[400px] flex items-center justify-center">
            {/* Placeholder for receipt image/PDF */}
            <div className="text-center">
              <svg
                className="w-24 h-24 mx-auto text-gray-400 dark:text-gray-600 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Payment Receipt Document
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {request.receiptUrl}
              </p>
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Download Receipt
              </button>
            </div>
          </div>

          {/* Receipt Info */}
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex gap-3">
              <svg
                className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                <p className="font-medium">Verification Checklist:</p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Verify the receipt amount matches the request: ${request.amount}</li>
                  <li>Check that the receipt is dated recently</li>
                  <li>Confirm the transfer is to your company account</li>
                  <li>Ensure the receipt is not a duplicate</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
