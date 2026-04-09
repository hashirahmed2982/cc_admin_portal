"use client";

import Dashboard from "@/components/Dashboard";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import ProductTable from "@/components/products/ProductTable";
import CreateProductModal from "@/components/products/CreateProductModal";
import UploadCodesModal from "@/components/products/UploadCodesModal";
import ViewCodesModal from "@/components/products/ViewCodesModal";
import ImportProductsModal from "@/components/products/ImportProductsModal";

// ─── Product type — extended to support internal vs supplier ─────────────────

export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  description: string;
  redemptionInstructions: string;
  images: string[];
  price: number;
  costPrice?: number;
  discountPrice?: number;
  status: "active" | "inactive";
  // Inventory — only populated for internal products (null for supplier)
  totalCodes: number | null;
  availableCodes: number | null;
  soldCodes: number | null;
  unlimitedStock: boolean;
  // Product type
  source: "internal" | "carrypin" | string;
  isSupplierProduct: boolean;
  // Supplier-specific (null for internal)
  supplierName: string | null;
  supplierRef: string | null;
  supplierSkuRef: string | null;
  syncEnabled: boolean;
  realtimePrice: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProductsPage() {
  const [products, setProducts]     = useState<Product[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus]     = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterSource, setFilterSource]     = useState<"all" | "internal" | "carrypin">("all");
  const [viewMode, setViewMode]     = useState<"table" | "grid">("table");
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands]         = useState<string[]>([]);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const LIMIT = 20;

  // Modal states
  const [showCreateModal, setShowCreateModal]   = useState(false);
  const [showImportModal, setShowImportModal]   = useState(false);
  const [editingProduct, setEditingProduct]     = useState<Product | null>(null);
  const [uploadingProduct, setUploadingProduct] = useState<Product | null>(null);
  const [viewingCodesProduct, setViewingCodesProduct] = useState<Product | null>(null);
  const [viewingImagesProduct, setViewingImagesProduct] = useState<Product | null>(null);

  // ─── Load ───────────────────────────────────────────────────────────────────

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.getProducts({
        page,
        limit: LIMIT,
        search:   searchTerm || undefined,
        category: filterCategory !== "all" ? filterCategory : undefined,
        status:   filterStatus  !== "all" ? filterStatus   : undefined,
        source:   filterSource  !== "all" ? filterSource as "internal" | "carrypin" : undefined,
      });
      setProducts(result.data || []);
      setTotalPages(result.pagination?.totalPages || 1);
      setTotal(result.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, filterCategory, filterStatus, filterSource]);

  const loadMeta = useCallback(async () => {
    try {
      const result = await api.getProductMeta();
      setCategories(result.data?.categories || []);
      setBrands(result.data?.brands || []);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { loadMeta(); }, [loadMeta]);
  useEffect(() => { setPage(1); }, [searchTerm, filterCategory, filterStatus, filterSource]);
  useEffect(() => { loadProducts(); }, [loadProducts]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleCreateProduct = async (productData: any) => {
    try {
      const result = productData._type === "supplier"
        ? await api.createSupplierProduct(productData)
        : await api.createInternalProduct(productData);
      setProducts(prev => [result.data, ...prev]);
      setTotal(prev => prev + 1);
      setShowCreateModal(false);
      loadMeta();
    } catch (err: any) {
      alert(err.message || "Failed to create product");
    }
  };

  const handleEditProduct = async (productData: any) => {
    if (!editingProduct) return;
    try {
      const result = await api.updateProduct(editingProduct.id, productData);
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? result.data : p));
      setEditingProduct(null);
      loadMeta();
    } catch (err: any) {
      alert(err.message || "Failed to update product");
    }
  };

  const handleToggleStatus = async (productId: string) => {
    try {
      const result = await api.toggleProductStatus(productId);
      setProducts(prev => prev.map(p => p.id === productId ? result.data : p));
    } catch (err: any) {
      alert(err.message || "Failed to toggle status");
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product? This cannot be undone.")) return;
    try {
      await api.deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      setTotal(prev => prev - 1);
    } catch (err: any) {
      alert(err.message || "Failed to delete product");
    }
  };

  const handleUploadCodes = async (productId: string) => {
    try {
      const result = await api.getProductById(productId);
      setProducts(prev => prev.map(p => p.id === productId ? result.data : p));
    } catch { loadProducts(); }
    setUploadingProduct(null);
  };

  // ─── Stats ──────────────────────────────────────────────────────────────────

  const stats = {
    total,
    active:        products.filter(p => p.status === "active").length,
    internal:      products.filter(p => !p.isSupplierProduct).length,
    supplier:      products.filter(p => p.isSupplierProduct).length,
    totalCodes:    products.filter(p => !p.isSupplierProduct)
                           .reduce((s, p) => s + (p.availableCodes ?? 0), 0),
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dashboard>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Product Management</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage digital card products, categories, and inventory
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Import Excel
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Product
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center justify-between">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button onClick={loadProducts} className="text-sm text-red-600 dark:text-red-400 underline">Retry</button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Products</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Internal Inventory</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  {stats.totalCodes.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">codes available</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Supplier Products</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.supplier}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">real-time fulfilment</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search products by name, brand, or category..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <select
              value={filterSource}
              onChange={e => setFilterSource(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="internal">Internal Only</option>
              <option value="carrypin">Supplier Only</option>
            </select>

            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex gap-2 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded ${viewMode === "table" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded ${viewMode === "grid" ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/5" />
                  </div>
                  <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table / Grid */}
        {!loading && (
          <ProductTable
            products={products}
            viewMode={viewMode}
            onEdit={setEditingProduct}
            onToggleStatus={handleToggleStatus}
            onUploadCodes={setUploadingProduct}
            onViewCodes={setViewingCodesProduct}
            onViewImages={setViewingImagesProduct}
            onDelete={handleDelete}
          />
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages} ({total} products)
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40">
                Previous
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <ImportProductsModal
          onClose={() => setShowImportModal(false)}
          onComplete={(count) => {
            setShowImportModal(false);
            if (count > 0) { loadProducts(); loadMeta(); }
          }}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateProductModal
          categories={categories}
          brands={brands}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateProduct}
        />
      )}

      {/* Edit Modal */}
      {editingProduct && (
        <CreateProductModal
          categories={categories}
          brands={brands}
          initialData={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSubmit={handleEditProduct}
        />
      )}

      {/* Upload Codes Modal — internal only */}
      {uploadingProduct && (
        <UploadCodesModal
          product={uploadingProduct}
          onClose={() => setUploadingProduct(null)}
          onSubmit={handleUploadCodes}
        />
      )}

      {/* View Codes Modal — internal only */}
      {viewingCodesProduct && (
        <ViewCodesModal
          product={viewingCodesProduct}
          onClose={() => setViewingCodesProduct(null)}
        />
      )}

      {/* Image Gallery */}
      {viewingImagesProduct && (
        <ImageGalleryModal
          product={viewingImagesProduct}
          onClose={() => setViewingImagesProduct(null)}
        />
      )}
    </Dashboard>
  );
}

// ─── Inline Image Gallery Modal ───────────────────────────────────────────────

function ImageGalleryModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [idx, setIdx] = useState(0);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="max-w-4xl w-full">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white">{product.name}</h3>
            <p className="text-sm text-gray-400 mt-1">Image {idx + 1} of {product.images.length}</p>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-300 transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="bg-gray-800 rounded-lg p-8 flex items-center justify-center relative" style={{ minHeight: "400px" }}>
          {product.images.length > 1 && (
            <button onClick={() => setIdx(i => (i === 0 ? product.images.length - 1 : i - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          <div className="text-center">
            <div className="w-full max-w-2xl aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              {product.images[idx] ? (
                <img src={product.images[idx]} alt="" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <svg className="w-32 h-32 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>
          </div>
          {product.images.length > 1 && (
            <button onClick={() => setIdx(i => (i === product.images.length - 1 ? 0 : i + 1))}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          )}
        </div>
        {product.images.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {product.images.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`rounded-full transition-all ${i === idx ? "bg-white w-8 h-3" : "bg-gray-600 w-3 h-3 hover:bg-gray-500"}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}