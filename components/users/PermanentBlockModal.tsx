"use client";

import { useState } from "react";
import { User } from "@/app/users/page";

interface PermanentBlockModalProps {
  user: User;
  onClose: () => void;
  onConfirm: (userId: string, reason: string, walletSettled: boolean, settlementDetails?: {
    settlementMethod: string;
    transactionReference: string;
    settlementNotes: string;
    settlementDate: string;
  }) => void;
}

export default function PermanentBlockModal({
  user,
  onClose,
  onConfirm,
}: PermanentBlockModalProps) {
  const [blockReason, setBlockReason] = useState("");
  const [acknowledgeWarning, setAcknowledgeWarning] = useState(false);
  const [walletSettled, setWalletSettled] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [settlementDetails, setSettlementDetails] = useState({
    settlementMethod: "",
    transactionReference: "",
    settlementNotes: "",
    settlementDate: new Date().toISOString().split("T")[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const settlementMethods = ["Bank Transfer", "Wire Transfer", "Check", "Cash", "Credit Card Refund", "PayPal", "Other"];
  const hasWalletBalance = user.walletBalance > 0;
  const requiredPhrase = `PERMANENTLY STOP ${user.id}`;

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    if (!blockReason.trim()) newErrors.reason = "Reason for permanent block is required";
    if (!acknowledgeWarning) newErrors.acknowledge = "You must acknowledge this action is permanent";
    if (confirmPhrase !== requiredPhrase) newErrors.confirmPhrase = "Confirmation phrase does not match";

    if (walletSettled && hasWalletBalance) {
      if (!settlementDetails.settlementMethod) newErrors.settlementMethod = "Settlement method is required";
      if (!settlementDetails.transactionReference.trim()) newErrors.transactionReference = "Transaction reference is required";
      if (!settlementDetails.settlementDate) newErrors.settlementDate = "Settlement date is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onConfirm(
      user.id,
      blockReason,
      walletSettled,
      walletSettled && hasWalletBalance ? settlementDetails : undefined
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Permanently Stop Account
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This action cannot be undone
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
          {/* Critical Warning */}
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex gap-3">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0"
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
                <p className="font-bold mb-2">âš ï¸ PERMANENT ACTION - READ CAREFULLY</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>This account will be PERMANENTLY blocked</li>
                  <li>Cannot be reactivated by anyone</li>
                  <li>All access will be immediately revoked</li>
                  <li>Account data will be archived</li>
                  <li>Any remaining wallet balance must be settled</li>
                </ul>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              Account to be Permanently Stopped:
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
                <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">User ID</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.id}
                </p>
              </div>
            </div>
          </div>

          {/* Wallet Balance Settlement */}
          {hasWalletBalance && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex gap-3">
                <svg
                  className="w-6 h-6 text-orange-600 dark:text-orange-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="font-medium text-orange-900 dark:text-orange-100 mb-2">
                    Remaining Wallet Balance Detected
                  </p>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Outstanding Balance:
                      </span>
                      <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        ${user.walletBalance.toLocaleString()} USD
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">
                      Settlement Options:
                    </p>
                    <div className="bg-orange-100 dark:bg-orange-900/30 rounded p-3 text-sm text-orange-800 dark:text-orange-200">
                      <p className="font-medium mb-2">You can either:</p>
                      <ol className="list-decimal list-inside space-y-1 text-xs">
                        <li>Mark as settled now if already processed</li>
                        <li>Block now and settle later (will show "Settlement Pending" status)</li>
                      </ol>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 mt-4 p-3 border-2 border-orange-300 dark:border-orange-700 rounded-lg cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={walletSettled}
                      onChange={(e) => {
                        setWalletSettled(e.target.checked);
                        setErrors({ ...errors, wallet: "" });
                      }}
                      className="mt-0.5 w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <div className="text-sm">
                      <p className="font-medium text-orange-900 dark:text-orange-100">
                        âœ“ I confirm the wallet balance has already been settled
                      </p>
                      <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                        Check this only if you have already processed the refund. Otherwise, you can settle it later.
                      </p>
                    </div>
                  </label>

                  {/* Settlement detail fields — shown when checkbox is ticked */}
                  {walletSettled && (
                    <div className="mt-4 space-y-3 border border-orange-200 dark:border-orange-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Settlement Details</p>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Settlement Method *</label>
                        <select
                          value={settlementDetails.settlementMethod}
                          onChange={(e) => setSettlementDetails({ ...settlementDetails, settlementMethod: e.target.value })}
                          className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.settlementMethod ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                        >
                          <option value="">Select method</option>
                          {settlementMethods.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                        {errors.settlementMethod && <p className="mt-1 text-xs text-red-600">{errors.settlementMethod}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Transaction Reference *</label>
                        <input
                          type="text"
                          value={settlementDetails.transactionReference}
                          onChange={(e) => setSettlementDetails({ ...settlementDetails, transactionReference: e.target.value })}
                          placeholder="e.g. TXN-20240213-001"
                          className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.transactionReference ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                        />
                        {errors.transactionReference && <p className="mt-1 text-xs text-red-600">{errors.transactionReference}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Settlement Date *</label>
                        <input
                          type="date"
                          value={settlementDetails.settlementDate}
                          max={new Date().toISOString().split("T")[0]}
                          onChange={(e) => setSettlementDetails({ ...settlementDetails, settlementDate: e.target.value })}
                          className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.settlementDate ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                        />
                        {errors.settlementDate && <p className="mt-1 text-xs text-red-600">{errors.settlementDate}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes (Optional)</label>
                        <textarea
                          value={settlementDetails.settlementNotes}
                          onChange={(e) => setSettlementDetails({ ...settlementDetails, settlementNotes: e.target.value })}
                          rows={2}
                          placeholder="Additional settlement details..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Block Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason for Permanent Block *
            </label>
            <textarea
              value={blockReason}
              onChange={(e) => {
                setBlockReason(e.target.value);
                setErrors({ ...errors, reason: "" });
              }}
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 ${
                errors.reason
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="Provide a detailed reason for permanently blocking this account (e.g., fraud detection, legal requirement, client request, terms violation...)"
            />
            {errors.reason && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.reason}
              </p>
            )}
          </div>

          {/* Acknowledgment */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledgeWarning}
                onChange={(e) => {
                  setAcknowledgeWarning(e.target.checked);
                  setErrors({ ...errors, acknowledge: "" });
                }}
                className="mt-0.5 w-5 h-5 text-red-600 rounded focus:ring-red-500"
              />
              <div className="text-sm">
                <p className="font-medium text-gray-900 dark:text-white">
                  I understand this action is PERMANENT and IRREVERSIBLE
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  By checking this box, I confirm that I have read and understood all
                  warnings, and I acknowledge that this account cannot be reactivated
                  once blocked.
                </p>
              </div>
            </label>
            {errors.acknowledge && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errors.acknowledge}
              </p>
            )}
          </div>

          {/* Confirmation Phrase */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
              Type the following to confirm:
            </p>
            <p className="text-lg font-mono font-bold text-red-600 dark:text-red-400 mb-3">
              PERMANENTLY STOP {user.id}
            </p>
            <input
              type="text"
              value={confirmPhrase}
              onChange={(e) => {
                setConfirmPhrase(e.target.value);
                setErrors({ ...errors, confirmPhrase: "" });
              }}
              placeholder="Type here to confirm..."
              className={`w-full px-4 py-2 border-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.confirmPhrase ? "border-red-500" : "border-red-300 dark:border-red-700"}`}
            />
            {errors.confirmPhrase && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPhrase}</p>
            )}
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
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Permanently Stop Account
          </button>
        </div>
      </div>
    </div>
  );
}