"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Dashboard from "@/components/Dashboard";
import { api } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  source: string;
  regularPrice: number;
  visible: boolean;
  customPrice?: number;
  useCustomPrice: boolean;
}

interface UserInfo {
  user_id: number;
  full_name: string;
  email: string;
  company_name: string;
}

export default function UserProductsPage() {
  const router = useRouter();
  const params = useParams();
  const rawId  = (params.userid ?? params.userId ?? params.id ?? "") as string;
  const userId = parseInt(rawId, 10);

  const [user,       setUser]       = useState<UserInfo | null>(null);
  const [products,   setProducts]   = useState<Product[]>([]);
  const [original,   setOriginal]   = useState<Product[]>([]); // for dirty tracking
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [saveError,  setSaveError]  = useState<string | null>(null);
  const [saved,      setSaved]      = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [searchTerm,        setSearchTerm]        = useState("");
  const [filterCategory,    setFilterCategory]    = useState("all");
  const [filterVisibility,  setFilterVisibility]  = useState("all");

  // ─── Load ──────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!userId || isNaN(userId)) {
      setError("Invalid user ID — check the URL.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [userRes, productsRes] = await Promise.all([
        api.getUserById(userId),
        api.getUserProductConfig(userId),
      ]);
      setUser(userRes.data);
      const mapped: Product[] = (productsRes.data || []).map((p: any) => ({
        id:             String(p.id),
        name:           p.name           || "",
        category:       p.category       || "",
        brand:          p.brand          || "",
        source:         p.source         || "internal",
        regularPrice:   parseFloat(p.regularPrice) || 0,
        visible:        p.visible !== false && p.visible !== 0,
        customPrice:    p.customPrice != null ? parseFloat(p.customPrice) : undefined,
        useCustomPrice: Boolean(p.useCustomPrice),
      }));
      setProducts(mapped);
      setOriginal(JSON.parse(JSON.stringify(mapped)));
      setHasChanges(false);
    } catch (e: any) {
      setError(e.message || "Failed to load product configuration");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // ─── Dirty tracking ────────────────────────────────────────────────────────

  const markChanged = (updated: Product[]) => {
    setProducts(updated);
    setHasChanges(JSON.stringify(updated) !== JSON.stringify(original));
    setSaved(false);
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const toggleVisibility = (id: string) =>
    markChanged(products.map(p => p.id === id ? { ...p, visible: !p.visible } : p));

  const updateCustomPrice = (id: string, val: string) =>
    markChanged(products.map(p => p.id === id ? {
      ...p,
      customPrice:    val ? parseFloat(val) : undefined,
      useCustomPrice: !!val,
    } : p));

  const toggleCustomPrice = (id: string) =>
    markChanged(products.map(p => p.id === id ? { ...p, useCustomPrice: !p.useCustomPrice } : p));

  const showAll    = () => markChanged(products.map(p => ({ ...p, visible: true })));
  const hideAll    = () => markChanged(products.map(p => ({ ...p, visible: false })));
  const clearPricing = () => markChanged(products.map(p => ({ ...p, customPrice: undefined, useCustomPrice: false })));
  const resetAll   = () => {
    if (!confirm("Reset all settings to default? This will show all products and remove all custom pricing.")) return;
    markChanged(products.map(p => ({ ...p, visible: true, customPrice: undefined, useCustomPrice: false })));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await api.saveUserProductConfig(userId, products.map(p => ({
        id:             p.id,
        visible:        p.visible,
        customPrice:    p.useCustomPrice && p.customPrice ? p.customPrice : undefined,
        useCustomPrice: p.useCustomPrice && !!p.customPrice,
      })));
      setOriginal(JSON.parse(JSON.stringify(products)));
      setHasChanges(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setSaveError(e.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  // ─── Derived ───────────────────────────────────────────────────────────────

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort();

  const filtered = products.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
    const matchCat    = filterCategory   === "all" || p.category === filterCategory;
    const matchVis    = filterVisibility === "all"
                     || (filterVisibility === "visible" && p.visible)
                     || (filterVisibility === "hidden"  && !p.visible);
    return matchSearch && matchCat && matchVis;
  });

  const stats = {
    total:         products.length,
    visible:       products.filter(p => p.visible).length,
    hidden:        products.filter(p => !p.visible).length,
    customPricing: products.filter(p => p.useCustomPrice && p.customPrice).length,
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Dashboard>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center space-y-3">
            <svg className="animate-spin w-10 h-10 text-blue-600 mx-auto" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading product configuration…</p>
          </div>
        </div>
      </Dashboard>
    );
  }

  if (error) {
    return (
      <Dashboard>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center space-y-3">
          <p className="text-red-700 dark:text-red-300">{error}</p>
          <button onClick={load} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            Retry
          </button>
        </div>
      </Dashboard>
    );
  }

  return (
    <Dashboard>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Product Configuration</h1>
              {user && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {user.full_name} — {user.company_name}
                  <span className="ml-2 text-xs text-gray-400">{user.email}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="px-3 py-1 text-sm bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 rounded-full">
                Unsaved changes
              </span>
            )}
            {saved && (
              <span className="px-3 py-1 text-sm bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded-full flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </span>
            )}
            <button onClick={handleSave} disabled={!hasChanges || saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving…
                </>
              ) : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Save error */}
        {saveError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex justify-between items-center">
            <p className="text-sm text-red-700 dark:text-red-300">{saveError}</p>
            <button onClick={() => setSaveError(null)} className="text-red-500 text-xl">×</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Products",  value: stats.total,         color: "blue",   icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
            { label: "Visible",         value: stats.visible,       color: "green",  icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" },
            { label: "Hidden",          value: stats.hidden,        color: "red",    icon: "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" },
            { label: "Custom Pricing",  value: stats.customPricing, color: "purple", icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{value}</p>
                </div>
                <div className={`w-12 h-12 bg-${color}-100 dark:bg-${color}-900/20 rounded-full flex items-center justify-center`}>
                  <svg className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={showAll}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Show All
            </button>
            <button onClick={hideAll}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Hide All
            </button>
            <button onClick={clearPricing}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Clear Custom Pricing
            </button>
            <button onClick={resetAll}
              className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors ml-auto">
              Reset to Default
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Search products…" value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterVisibility} onChange={e => setFilterVisibility(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
        </div>

        {/* Products table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {["Product", "Category / Brand", "Regular Price", "Custom Price", "Visibility"].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map(product => (
                  <tr key={product.id}
                    className={`transition-colors ${
                      !product.visible
                        ? "bg-gray-50 dark:bg-gray-900/50 opacity-70"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}>

                    {/* Product */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded flex items-center justify-center flex-shrink-0 ${
                          product.source !== "internal"
                            ? "bg-gradient-to-br from-orange-400 to-rose-500"
                            : "bg-gradient-to-br from-blue-500 to-purple-600"
                        }`}>
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white text-sm">{product.name}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">{product.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category / Brand */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">{product.category || "—"}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{product.brand || "—"}</div>
                    </td>

                    {/* Regular price */}
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        ${product.regularPrice.toFixed(2)}
                      </span>
                    </td>

                    {/* Custom price */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500">$</span>
                          <input
                            type="number" step="any" min="0"
                            value={product.customPrice ?? ""}
                            onChange={e => updateCustomPrice(product.id, e.target.value)}
                            placeholder={product.regularPrice.toFixed(2)}
                            className="w-28 pl-6 pr-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        {product.customPrice != null && product.customPrice > 0 && (
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={product.useCustomPrice}
                              onChange={() => toggleCustomPrice(product.id)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">Use</span>
                          </label>
                        )}
                        {product.useCustomPrice && product.customPrice && (
                          <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 rounded">
                            Active
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Visibility toggle */}
                    <td className="px-6 py-4">
                      <button onClick={() => toggleVisibility(product.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                          product.visible
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {product.visible ? (
                            <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          )}
                        </svg>
                        {product.visible ? "Visible" : "Hidden"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {products.length === 0 ? "No active products found in the system" : "No products match your filters"}
              </p>
            </div>
          )}

          {products.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Showing {filtered.length} of {products.length} products
              </p>
            </div>
          )}
        </div>
      </div>
    </Dashboard>
  );
}