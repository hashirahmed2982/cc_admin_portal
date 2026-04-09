"use client";

import { useState, useEffect, useCallback } from "react";
import { Product } from "@/app/products/page";
import { api } from "@/lib/api";

interface ViewCodesModalProps {
  product: Product;
  onClose: () => void;
}

interface Code {
  code_id: number;
  code: string;
  status: "available" | "sold" | "reserved" | "invalid";
  source: string;
  upload_batch: string | null;
  created_at: string;
  sold_at: string | null;
  reserved_at: string | null;
}

export default function ViewCodesModal({ product, onClose }: ViewCodesModalProps) {
  const [codes, setCodes]           = useState<Code[]>([]);
  const [loading, setLoading]       = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 30;

  const loadCodes = useCallback(async () => {
    try {
      setLoading(true);
      const result = await api.getProductCodes(product.id, {
        page,
        limit: LIMIT,
        status: statusFilter || undefined,
      });
      setCodes(result.data || []);
      setTotal(result.pagination?.total || 0);
      setTotalPages(result.pagination?.totalPages || 1);
    } catch (err: any) {
      setCodes([]);
    } finally {
      setLoading(false);
    }
  }, [product.id, page, statusFilter]);

  useEffect(() => { loadCodes(); }, [loadCodes]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      available: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      sold:      "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
      reserved:  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      invalid:   "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    };
    return map[s] || map.available;
  };

  // Summary counts from the current full dataset perspective
  const summary = {
    available: product.availableCodes ?? 0,
    sold:      product.soldCodes ?? 0,
    total:     product.totalCodes ?? 0,
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Product Codes</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{product.name}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Available</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.available.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Sold</p>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{summary.sold.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.total.toLocaleString()}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="reserved">Reserved</option>
              <option value="invalid">Invalid</option>
            </select>
            <span className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              {total.toLocaleString()} codes {statusFilter ? `(${statusFilter})` : "total"}
            </span>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : codes.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500 dark:text-gray-400">No codes found</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      {["Code", "Status", "Source", "Batch", "Uploaded", "Sold At"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {codes.map(code => (
                      <tr key={code.code_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white whitespace-nowrap">
                          {code.code}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusBadge(code.status)}`}>
                            {code.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 capitalize">
                          {code.source.replace("_", " ")}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 max-w-[120px] truncate" title={code.upload_batch || ""}>
                          {code.upload_batch || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {code.created_at ? new Date(code.created_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {code.sold_at ? new Date(code.sold_at).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Footer with pagination */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                Next
              </button>
            </div>
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