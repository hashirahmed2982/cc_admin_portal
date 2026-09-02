"use client";

import Dashboard from "@/components/Dashboard";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import CatalogMatchReviewModal from "@/components/link-products/CatalogMatchReviewModal";
import { StagingItem } from "@/types/catalogMatching.types";

const LIMIT = 25;

export default function LinkProductsPage() {
  const [items, setItems] = useState<StagingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supplierFilter, setSupplierFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.getPendingCatalogMatches({
        supplier: supplierFilter || undefined, page, limit: LIMIT,
      });
      setItems(result.data || []);
      setTotal(result.pagination?.total || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load staged items");
    } finally {
      setLoading(false);
    }
  }, [supplierFilter, page]);

  useEffect(() => { load(); }, [load]);

  const handleResolved = () => {
    setReviewingId(null);
    setSuccessMsg("Item resolved");
    load();
  };

  return (
    <Dashboard>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Link Products</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Incoming supplier catalog items awaiting a match to your product catalog (Master Plan §9.2) —
            nothing here is ever linked automatically, every match is a deliberate click.
          </p>
        </div>

        {successMsg && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center justify-between">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">{successMsg}</p>
            <button onClick={() => setSuccessMsg(null)} className="text-green-500 text-lg leading-none">×</button>
          </div>
        )}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-700 dark:text-gray-300">Supplier</label>
              <select
                value={supplierFilter}
                onChange={(e) => { setSupplierFilter(e.target.value); setPage(1); }}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="">All</option>
                <option value="wgcards">wgcards</option>
                <option value="gift2games">gift2games</option>
              </select>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{total.toLocaleString()} pending review</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {["Supplier", "Item", "Brand Guess", "Face Value", "Cost", "Staged", ""].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading && (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">Loading...</td></tr>
                )}
                {!loading && items.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">Nothing pending review.</td></tr>
                )}
                {!loading && items.map((item) => (
                  <tr key={item.staging_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-3 capitalize text-gray-700 dark:text-gray-300">{item.supplier}</td>
                    <td className="px-6 py-3 font-medium text-gray-900 dark:text-white max-w-xs truncate" title={item.item_name}>{item.item_name}</td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{item.brand_name || "—"}</td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{item.face_value ?? "—"} {item.currency || ""}</td>
                    <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{item.cost_price ?? "—"}</td>
                    <td className="px-6 py-3 text-gray-500 dark:text-gray-500 whitespace-nowrap">{new Date(item.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => setReviewingId(item.staging_id)}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-700">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 text-gray-700 dark:text-gray-300">
                Previous
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 text-gray-700 dark:text-gray-300">
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {reviewingId !== null && (
        <CatalogMatchReviewModal
          stagingId={reviewingId}
          onClose={() => setReviewingId(null)}
          onResolved={handleResolved}
        />
      )}
    </Dashboard>
  );
}
