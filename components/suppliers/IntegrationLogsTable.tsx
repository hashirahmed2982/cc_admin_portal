"use client";

import { Fragment, useState } from "react";
import { SupplierLogEntry } from "@/types/supplier.types";

interface IntegrationLogsTableProps {
  logs: SupplierLogEntry[];
  errorsOnly: boolean;
  onToggleErrorsOnly: (value: boolean) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading: boolean;
}

export default function IntegrationLogsTable({
  logs, errorsOnly, onToggleErrorsOnly, page, totalPages, onPageChange, loading,
}: IntegrationLogsTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={errorsOnly} onChange={(e) => onToggleErrorsOnly(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" />
          Errors only
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Endpoint</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Response Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">Loading...</td></tr>
            )}
            {!loading && logs.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No calls logged yet.</td></tr>
            )}
            {!loading && logs.map((log) => {
              const isError = log.status_code !== 200 || !!log.error_message;
              const isExpanded = expandedId === log.api_log_id;
              return (
                <Fragment key={log.api_log_id}>
                  <tr
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : log.api_log_id)}
                  >
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-900 dark:text-white">{log.endpoint}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        isError
                          ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                          : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      }`}>
                        {log.status_code || "no response"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{log.response_time}ms</td>
                    <td className="px-6 py-4 text-sm text-red-600 dark:text-red-400 max-w-xs truncate">{log.error_message || "—"}</td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 bg-gray-50 dark:bg-gray-900/40">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Request</p>
                            <pre className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
                              {log.supplier_request ? JSON.stringify(log.supplier_request, null, 2) : "—"}
                            </pre>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Response</p>
                            <pre className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
                              {log.supplier_response ? JSON.stringify(log.supplier_response, null, 2) : "—"}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 text-gray-700 dark:text-gray-300">
            Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 text-gray-700 dark:text-gray-300">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
