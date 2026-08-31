"use client";

import { TopupOrder } from "@/types/supplier.types";

interface TopupQueueTableProps {
  topups: TopupOrder[];
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
};

function minutesOld(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

export default function TopupQueueTable({
  topups, statusFilter, onStatusFilterChange, page, totalPages, onPageChange, loading,
}: TopupQueueTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-700 dark:text-gray-300">Status</label>
        <select value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="confirmed">Confirmed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Reference</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Client / Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Resolved Via</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Age</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">Loading...</td></tr>
            )}
            {!loading && topups.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No top-up orders found.</td></tr>
            )}
            {!loading && topups.map((t) => {
              const age = minutesOld(t.created_at);
              const stuck = t.status === "pending" && age > 35; // reconciler's own fallback window
              return (
                <tr key={t.topup_order_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm font-mono text-gray-900 dark:text-white">
                    <div>{t.order_reference.slice(0, 8)}…</div>
                    {t.wgcards_order_id && <div className="text-xs text-gray-400">wg: {t.wgcards_order_id}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    <div>{t.userEmail}</div>
                    <div className="text-xs text-gray-400">{t.product_name}{t.target_account ? ` · ${t.target_account}` : ""}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{t.amount.toFixed(2)} {t.currency}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${STATUS_STYLES[t.status] || ""}`}>{t.status}</span>
                    {stuck && <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">past reconciler window — check logs</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{t.resolved_via || "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {age < 60 ? `${age}m` : `${Math.floor(age / 60)}h`}
                  </td>
                </tr>
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
