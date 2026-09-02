"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { SkuSupplierLink } from "@/types/supplier.types";
import { Product } from "@/app/products/page";

interface SupplierLinksModalProps {
  product: Product;
  onClose: () => void;
}

// Master Plan §10's dispatcher (supplierSelection.service.js) picks
// cheapest-first among active links, unless one is always_prefer (wins
// outright) or never_use (excluded entirely) — this modal is the admin
// control surface for exactly those two fields, per product.
export default function SupplierLinksModal({ product, onClose }: SupplierLinksModalProps) {
  const [links, setLinks] = useState<SkuSupplierLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingLinkId, setSavingLinkId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.getSkuLinks(product.id);
      setLinks(result.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load supplier links");
    } finally {
      setLoading(false);
    }
  }, [product.id]);

  useEffect(() => { load(); }, [load]);

  const handleToggleActive = async (link: SkuSupplierLink) => {
    setSavingLinkId(link.link_id);
    try {
      await api.updateSkuLink(link.link_id, { isActive: !link.is_active });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update link");
    } finally {
      setSavingLinkId(null);
    }
  };

  const handleOverrideChange = async (link: SkuSupplierLink, value: string) => {
    setSavingLinkId(link.link_id);
    try {
      const priorityOverride = value === "" ? null : (value as "always_prefer" | "never_use");
      await api.updateSkuLink(link.link_id, { priorityOverride });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update link");
    } finally {
      setSavingLinkId(null);
    }
  };

  const overrideBadge = (override: SkuSupplierLink["admin_priority_override"]) => {
    if (override === "always_prefer") return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    if (override === "never_use") return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
    return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Supplier Links</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">{product.name}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            When more than one supplier is linked, orders go to the cheapest active one by default.
            &quot;Always Prefer&quot; skips price comparison entirely; &quot;Never Use&quot; excludes a
            supplier without disabling the whole link.
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading…</div>
          ) : links.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No supplier links found for this product yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 pr-4">Supplier</th>
                    <th className="py-2 pr-4">SKU</th>
                    <th className="py-2 pr-4">Cost</th>
                    <th className="py-2 pr-4">Stock</th>
                    <th className="py-2 pr-4">Active</th>
                    <th className="py-2 pr-4">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((link) => (
                    <tr key={link.link_id} className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white capitalize">{link.supplier}</td>
                      <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{link.sku_name}</td>
                      <td className="py-3 pr-4 text-gray-900 dark:text-white">
                        {(link.cost_price_base_currency ?? link.cost_price).toFixed(2)} {link.cost_currency}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          link.stock_status === "in_stock"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : link.stock_status === "out_of_stock"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                        }`}>
                          {link.stock_status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <button
                          onClick={() => handleToggleActive(link)}
                          disabled={savingLinkId === link.link_id}
                          className={`px-2 py-1 text-xs rounded font-medium disabled:opacity-50 ${
                            link.is_active
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {link.is_active ? "Active" : "Disabled"}
                        </button>
                      </td>
                      <td className="py-3 pr-4">
                        <select
                          value={link.admin_priority_override || ""}
                          onChange={(e) => handleOverrideChange(link, e.target.value)}
                          disabled={savingLinkId === link.link_id}
                          className={`px-2 py-1 text-xs rounded border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${overrideBadge(link.admin_priority_override)}`}
                        >
                          <option value="">Normal (cheapest wins)</option>
                          <option value="always_prefer">Always Prefer</option>
                          <option value="never_use">Never Use</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end">
          <button onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
