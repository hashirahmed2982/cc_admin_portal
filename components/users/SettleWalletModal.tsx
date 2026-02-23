"use client";

import { useState } from "react";
import { User } from "@/app/users/page";

interface SettleWalletModalProps {
  user: User;
  onClose: () => void;
  onConfirm: (userId: string, settlementData: {
    settlementMethod: string;
    transactionReference: string;
    settlementNotes: string;
    settlementDate: string;
  }) => void;
}

export default function SettleWalletModal({
  user,
  onClose,
  onConfirm,
}: SettleWalletModalProps) {
  const [formData, setFormData] = useState({
    settlementMethod: "",
    transactionReference: "",
    settlementNotes: "",
    settlementDate: new Date().toISOString().split("T")[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const settlementMethods = [
    "Bank Transfer",
    "Wire Transfer",
    "Check",
    "Cash",
    "Credit Card Refund",
    "PayPal",
    "Other",
  ];

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.settlementMethod) {
      newErrors.settlementMethod = "Settlement method is required";
    }

    if (!formData.transactionReference.trim()) {
      newErrors.transactionReference = "Transaction reference is required";
    }

    if (!formData.settlementDate) {
      newErrors.settlementDate = "Settlement date is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onConfirm(user.id, formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-orange-600 dark:text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Settle Wallet Balance
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Mark outstanding balance as settled
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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

        <div className="p-6 space-y-6">
          {/* Account Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              Account Information:
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Client Name</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Company</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.company}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">User ID</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.id}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Wallet ID</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.walletId}
                </p>
              </div>
            </div>
          </div>

          {/* Outstanding Balance */}
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
            <div className="text-center">
              <p className="text-sm text-orange-700 dark:text-orange-300 mb-2">
                Outstanding Wallet Balance
              </p>
              <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">
                ${user.walletBalance.toLocaleString()} USD
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                This amount needs to be refunded to the client
              </p>
            </div>
          </div>

          {/* Block Status */}
          {user.permanentBlockDate && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div className="text-sm text-red-700 dark:text-red-300">
                  <p className="font-medium">Account Status: PERMANENTLY BLOCKED</p>
                  <p className="mt-1">Blocked Date: {user.permanentBlockDate}</p>
                  {user.permanentBlockReason && (
                    <p className="mt-1">Reason: {user.permanentBlockReason}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Settlement Form */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Settlement Details
            </h4>

            {/* Settlement Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Settlement Method *
              </label>
              <select
                value={formData.settlementMethod}
                onChange={(e) => {
                  setFormData({ ...formData, settlementMethod: e.target.value });
                  setErrors({ ...errors, settlementMethod: "" });
                }}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.settlementMethod
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              >
                <option value="">Select settlement method</option>
                {settlementMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
              {errors.settlementMethod && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.settlementMethod}
                </p>
              )}
            </div>

            {/* Transaction Reference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Transaction Reference / Confirmation Number *
              </label>
              <input
                type="text"
                value={formData.transactionReference}
                onChange={(e) => {
                  setFormData({ ...formData, transactionReference: e.target.value });
                  setErrors({ ...errors, transactionReference: "" });
                }}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.transactionReference
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="e.g., TXN-20240213-001, Check #12345"
              />
              {errors.transactionReference && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.transactionReference}
                </p>
              )}
            </div>

            {/* Settlement Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Settlement Date *
              </label>
              <input
                type="date"
                value={formData.settlementDate}
                onChange={(e) => {
                  setFormData({ ...formData, settlementDate: e.target.value });
                  setErrors({ ...errors, settlementDate: "" });
                }}
                max={new Date().toISOString().split("T")[0]}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  errors.settlementDate
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.settlementDate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.settlementDate}
                </p>
              )}
            </div>

            {/* Settlement Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Settlement Notes / Details (Optional)
              </label>
              <textarea
                value={formData.settlementNotes}
                onChange={(e) =>
                  setFormData({ ...formData, settlementNotes: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Additional details about the settlement (e.g., recipient account, special circumstances...)"
              />
            </div>
          </div>

          {/* Confirmation */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm text-green-700 dark:text-green-300">
                <p className="font-medium">Settlement Confirmation</p>
                <p className="mt-1">
                  By marking this as settled, you confirm that the outstanding balance
                  of ${user.walletBalance.toLocaleString()} has been successfully
                  refunded to the client and all financial obligations have been fulfilled.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Mark as Settled
          </button>
        </div>
      </div>
    </div>
  );
}
