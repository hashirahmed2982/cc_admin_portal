"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { StagingItemDetail, SuggestedMatch } from "@/types/catalogMatching.types";

interface Props {
  stagingId: number;
  onClose: () => void;
  onResolved: () => void; // called after link/create-new/ignore succeeds, so the parent list can refresh
}

export default function CatalogMatchReviewModal({ stagingId, onClose, onResolved }: Props) {
  const [item, setItem] = useState<StagingItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  // "Create New" form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [sellingPrice, setSellingPrice] = useState("");
  const [category, setCategory] = useState("");

  // Manual search fallback — for when the auto-suggested matches (by
  // brand/face-value/currency key) find nothing or suggest the wrong item.
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SuggestedMatch[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.getCatalogMatchItem(stagingId);
      setItem(result.data);
      setSearchQuery(result.data?.item_name || "");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load item");
    } finally {
      setLoading(false);
    }
  }, [stagingId]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const result = await api.searchCatalogMatches(searchQuery.trim());
      setSearchResults(result.data || []);
    } catch (err: unknown) {
      setSearchError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleLink = async (skuId: number) => {
    setActing(true);
    setError(null);
    try {
      await api.linkCatalogMatch(stagingId, skuId);
      onResolved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to link");
    } finally {
      setActing(false);
    }
  };

  const handleCreateNew = async () => {
    setActing(true);
    setError(null);
    try {
      await api.createNewFromCatalogMatch(stagingId, {
        sellingPrice: sellingPrice.trim() ? parseFloat(sellingPrice) : undefined,
        category: category.trim() || undefined,
      });
      onResolved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setActing(false);
    }
  };

  const handleIgnore = async () => {
    setActing(true);
    setError(null);
    try {
      await api.ignoreCatalogMatch(stagingId);
      onResolved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to ignore");
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Link Product Review</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {loading && <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">Loading...</div>}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {item && !loading && (
            <>
              {/* Incoming item */}
              <section className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Incoming — {item.supplier}</p>
                <p className="font-semibold text-gray-900 dark:text-white">{item.item_name}</p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <div>Brand guess: <span className="text-gray-900 dark:text-white">{item.brand_name || "—"}</span></div>
                  <div>Supplier SKU: <span className="font-mono text-gray-900 dark:text-white">{item.supplier_sku_ref}</span></div>
                  <div>Face value: <span className="text-gray-900 dark:text-white">{item.face_value ?? "—"} {item.currency || ""}</span></div>
                  <div>Cost price: <span className="text-gray-900 dark:text-white">{item.cost_price ?? "—"}</span></div>
                </div>
                <p className="text-xs text-gray-400 mt-2 font-mono">match key: {item.computedMatchKey}</p>
              </section>

              {/* Suggested matches */}
              <section>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {item.suggestedMatches.length > 0
                    ? `Suggested matches (${item.suggestedMatches.length}) — same brand/face value/currency`
                    : "No matching canonical product found by key"}
                </p>
                {item.suggestedMatches.length === 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    This just means nothing shares this item&apos;s exact brand+face value+currency key — a real match might still exist under
                    a different brand spelling. Check the products list yourself before assuming this needs a brand-new product.
                  </p>
                )}
                <div className="space-y-2">
                  {item.suggestedMatches.map((m) => (
                    <div key={m.sku_id} className="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{m.product_name} — {m.sku_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {m.brand_name || "—"} · {m.face_value ?? "—"} {m.price_currency} · sells at {m.selling_price} · source: {m.source}
                        </p>
                      </div>
                      <button
                        onClick={() => handleLink(m.sku_id)}
                        disabled={acting}
                        className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        Link to this
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Manual search — fallback for when the auto-suggested matches above find nothing, or the wrong thing */}
              <section className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search the catalog manually
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Use this if the suggestions above are empty or wrong — searches product name, brand, and SKU name.
                </p>
                <form onSubmit={handleSearch} className="flex gap-2 mb-3">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Product name..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                  <button
                    type="submit"
                    disabled={searching || !searchQuery.trim()}
                    className="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    {searching ? "Searching..." : "Search"}
                  </button>
                </form>

                {searchError && <p className="text-xs text-red-600 dark:text-red-400 mb-2">{searchError}</p>}

                {searchResults !== null && (
                  <div className="space-y-2">
                    {searchResults.length === 0 ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400">No products found matching &quot;{searchQuery}&quot;.</p>
                    ) : (
                      searchResults.map((m) => (
                        <div key={m.sku_id} className="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{m.product_name} — {m.sku_name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {m.brand_name || "—"} · {m.face_value ?? "—"} {m.price_currency} · sells at {m.selling_price} · source: {m.source}
                            </p>
                          </div>
                          <button
                            onClick={() => handleLink(m.sku_id)}
                            disabled={acting}
                            className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            Link to this
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </section>

              {/* Create new / Ignore */}
              <section className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                {!showCreateForm ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCreateForm(true)}
                      disabled={acting}
                      className="flex-1 px-4 py-2 text-sm font-medium text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50"
                    >
                      No match — Create New Product
                    </button>
                    <button
                      onClick={handleIgnore}
                      disabled={acting}
                      className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      Ignore (don&apos;t sell this)
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Creates a new product — starts inactive, review price/details on the Products page before enabling it.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Selling Price (optional — defaults to cost + margin)</label>
                        <input value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} type="number" step="0.01"
                          placeholder={item.cost_price != null ? `e.g. ${(item.cost_price * 1.2).toFixed(2)}` : ""}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Category (optional)</label>
                        <input value={category} onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowCreateForm(false)} disabled={acting}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                        Back
                      </button>
                      <button onClick={handleCreateNew} disabled={acting}
                        className="flex-1 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                        {acting ? "Creating..." : "Create Product"}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
