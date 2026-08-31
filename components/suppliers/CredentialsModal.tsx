"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface CredentialsModalProps {
  supplierName: string;
  apiBaseUrl: string;
  lowBalanceThreshold: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CredentialsModal({ supplierName, apiBaseUrl, lowBalanceThreshold, onClose, onSuccess }: CredentialsModalProps) {
  const [appId, setAppId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [appKey, setAppKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(apiBaseUrl);
  const [threshold, setThreshold] = useState(lowBalanceThreshold != null ? String(lowBalanceThreshold) : "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!appId.trim()) newErrors.appId = "App ID is required";
    if (!accountId.trim()) newErrors.accountId = "Account ID is required";
    if (!appKey.trim()) newErrors.appKey = "App Key is required";
    if (!baseUrl.trim()) newErrors.baseUrl = "API base URL is required";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    try {
      await api.updateSupplierCredentials(supplierName, {
        appId: appId.trim(),
        accountId: accountId.trim(),
        appKey: appKey.trim(),
        apiBaseUrl: baseUrl.trim(),
        lowBalanceThreshold: threshold.trim() ? parseFloat(threshold) : undefined,
      });
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update credentials";
      setErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[field] ? "border-red-500 dark:border-red-500" : "border-gray-300 dark:border-gray-600"
    }`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
              Replace {supplierName} Credentials
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 text-sm text-orange-700 dark:text-orange-300">
            The current app key/id are never shown here — this replaces them outright. The cached auth token is cleared immediately after saving.
          </div>

          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-300">{errors.submit}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">API Base URL *</label>
            <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} className={inputClass("baseUrl")} placeholder="http://121.43.36.102:9009" />
            {errors.baseUrl && <p className="text-xs text-red-500 mt-1">{errors.baseUrl}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">App ID *</label>
            <input value={appId} onChange={(e) => setAppId(e.target.value)} className={inputClass("appId")} autoComplete="off" />
            {errors.appId && <p className="text-xs text-red-500 mt-1">{errors.appId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account ID *</label>
            <input value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputClass("accountId")} autoComplete="off" />
            {errors.accountId && <p className="text-xs text-red-500 mt-1">{errors.accountId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">App Key *</label>
            <input value={appKey} onChange={(e) => setAppKey(e.target.value)} className={inputClass("appKey")} type="password" autoComplete="new-password" />
            {errors.appKey && <p className="text-xs text-red-500 mt-1">{errors.appKey}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Low Balance Alert Threshold</label>
            <input value={threshold} onChange={(e) => setThreshold(e.target.value)} className={inputClass("threshold")} type="number" step="0.01" placeholder="e.g. 100" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Saving..." : "Save Credentials"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
