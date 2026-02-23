"use client";

import { useState } from "react";
import { TopupRequest } from "@/app/wallet/page";

interface TopupRequestsTableProps {
  requests: TopupRequest[];
  onViewReceipt: (request: TopupRequest) => void;
  onApprove: (request: TopupRequest) => void;
  onReject: (request: TopupRequest, reason: string) => void;
}

export default function TopupRequestsTable({
  requests,
  onViewReceipt,
  onApprove,
  onReject,
}: TopupRequestsTableProps) {
  const [rejectingRequest, setRejectingRequest] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleRejectClick = (request: TopupRequest) => {
    if (rejectingRequest === request.id) {
      if (rejectionReason.trim()) {
        onReject(request, rejectionReason);
        setRejectingRequest(null);
        setRejectionReason("");
      }
    } else {
      setRejectingRequest(request.id);
      setRejectionReason("");
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
      approved: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    };
    return styles[status as keyof typeof styles];
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Request ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Client
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Amount (USD)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Request Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {requests.map((request) => (
            <tr
              key={request.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <td className="px-6 py-4">
                <div className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                  {request.id}
                </div>
              </td>
              <td className="px-6 py-4">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {request.userName}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {request.company}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {request.userEmail}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  ${request.amount.toLocaleString()}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                {request.requestDate}
              </td>
              <td className="px-6 py-4">
                <div className="space-y-1">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(
                      request.status
                    )}`}
                  >
                    {request.status.toUpperCase()}
                  </span>
                  {request.reviewedBy && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      By: {request.reviewedBy}
                      <br />
                      At: {request.reviewedAt}
                    </div>
                  )}
                  {request.rejectionReason && (
                    <div className="text-xs text-red-600 dark:text-red-400 mt-1 max-w-xs">
                      Reason: {request.rejectionReason}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => onViewReceipt(request)}
                    className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors border border-blue-300 dark:border-blue-700"
                  >
                    📄 View Receipt
                  </button>
                  
                  {request.status === "pending" && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => onApprove(request)}
                        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Approve
                      </button>
                      
                      {rejectingRequest === request.id ? (
                        <div className="space-y-2">
                          <textarea
                            placeholder="Enter rejection reason..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-red-300 dark:border-red-700 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            rows={2}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRejectClick(request)}
                              disabled={!rejectionReason.trim()}
                              className="flex-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Confirm Reject
                            </button>
                            <button
                              onClick={() => {
                                setRejectingRequest(null);
                                setRejectionReason("");
                              }}
                              className="flex-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRejectingRequest(request.id)}
                          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
                        >
                          <svg
                            className="w-4 h-4"
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
                          Reject
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {requests.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No topup requests found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Topup requests will appear here when clients submit them
          </p>
        </div>
      )}
    </div>
  );
}
