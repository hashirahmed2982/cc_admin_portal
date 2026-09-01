"use client";

import { SupplierHealth } from "@/types/supplier.types";

interface SupplierHealthCardProps {
  supplier: SupplierHealth;
  isSuperAdmin: boolean;
  onEditCredentials: () => void;
  onToggleActive: () => void;
  togglingActive: boolean;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function SupplierHealthCard({ supplier, isSuperAdmin, onEditCredentials, onToggleActive, togglingActive }: SupplierHealthCardProps) {
  const isDown = supplier.integrationStatus === "down";
  const isDisabled = !supplier.isActive;
  // Defensive Number() coercion — the API is expected to send these as
  // numbers, but a DECIMAL column can arrive as a string depending on the
  // driver config, and this crashed the page once already when it did.
  const balance = supplier.balance != null ? Number(supplier.balance) : null;
  const lowBalanceThreshold = supplier.lowBalanceThreshold != null ? Number(supplier.lowBalanceThreshold) : null;
  const isLowBalance =
    isSuperAdmin && lowBalanceThreshold != null && balance != null && balance < lowBalanceThreshold;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden ${
      isDisabled ? "border-gray-300 dark:border-gray-600" : isDown ? "border-red-300 dark:border-red-800" : "border-gray-200 dark:border-gray-700"
    }`}>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white capitalize">{supplier.supplierName}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[220px]">{supplier.apiBaseUrl}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
          isDisabled
            ? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
            : isDown
              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
              : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isDisabled ? "bg-gray-500" : isDown ? "bg-red-500" : "bg-green-500"}`} />
          {isDisabled ? "Disabled" : isDown ? "Down" : "Healthy"}
        </span>
      </div>

      <div className="p-6 space-y-3">
        {isDisabled && (
          <div className="bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300">
            Turned off by an admin — no cron jobs run for this supplier and its products are hidden as unavailable, same as an outage, until re-enabled.
          </div>
        )}
        {!isDisabled && isDown && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
            Products from this supplier are temporarily hidden as unavailable ({supplier.consecutiveFailures} consecutive failures{supplier.downSince ? `, since ${timeAgo(supplier.downSince)}` : ""}).
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Last Sync</p>
            <p className="font-medium text-gray-900 dark:text-white">{timeAgo(supplier.lastSync)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Consecutive Failures</p>
            <p className="font-medium text-gray-900 dark:text-white">{supplier.consecutiveFailures}</p>
          </div>
        </div>

        {/* Balance — super_admin only; the backend never even sends this field to a plain admin */}
        {isSuperAdmin && (
          <div className={`rounded-lg p-3 ${isLowBalance ? "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800" : "bg-gray-50 dark:bg-gray-700/50"}`}>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Account Balance</p>
              {isLowBalance && <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Low balance</span>}
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
              {balance != null ? `${balance.toFixed(2)} ${supplier.balanceCurrency || ""}` : "—"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Checked {timeAgo(supplier.balanceCheckedAt)}
              {lowBalanceThreshold != null ? ` · threshold ${lowBalanceThreshold}` : ""}
            </p>
          </div>
        )}

        {isSuperAdmin && (
          <div className="flex gap-2">
            <button
              onClick={onEditCredentials}
              className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              Replace Credentials
            </button>
            <button
              onClick={onToggleActive}
              disabled={togglingActive}
              className={`flex-1 px-4 py-2 text-sm font-medium border rounded-lg transition-colors disabled:opacity-50 ${
                isDisabled
                  ? "text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20"
                  : "text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
              }`}
            >
              {togglingActive ? "Saving..." : isDisabled ? "Enable Supplier" : "Disable Supplier"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
