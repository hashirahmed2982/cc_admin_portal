"use client";

import Dashboard from "@/components/Dashboard";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import ProductTable from "@/components/products/ProductTable";
import CreateProductModal from "@/components/products/CreateProductModal";
import EditProductModal from "@/components/products/EditProductModal";
import UploadCodesModal from "@/components/products/UploadCodesModal";
import ViewCodesModal from "@/components/products/ViewCodesModal";
import ImportProductsModal from "@/components/products/ImportProductsModal";
import ProductImageGallery from "@/components/products/ProductImageGallery";

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
  totalCodes: number | null;
  availableCodes: number | null;
  soldCodes: number | null;
  unlimitedStock: boolean;
  source: "internal" | "carrypin" | string;
  isSupplierProduct: boolean;
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
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterSource, setFilterSource] = useState<"all" | "internal" | "carrypin">("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [page, setPage] = useState(1);
   const [totalPages,     setTotalPages]     = useState(1);
  const [total,          setTotal]          = useState(0);
  const LIMIT = 20;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [uploadingProduct, setUploadingProduct] = useState<Product | null>(null);
  const [viewingCodesProduct, setViewingCodesProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingImagesProduct, setViewingImagesProduct] = useState<Product | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.getProducts({
        page,
        limit: LIMIT,
        search: searchTerm || undefined,
        category: filterCategory !== "all" ? filterCategory : undefined,
        status: filterStatus !== "all" ? filterStatus : undefined,
        source: filterSource !== "all" ? filterSource as "internal" | "carrypin" : undefined,
      });
      setProducts(result.data || []);
      setTotal(result.pagination?.total      || 0);
      setTotalPages(result.pagination?.totalPages || 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load products";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, filterCategory, filterStatus, filterSource]);
  
  const handleToggleStatus = useCallback(async (productId: string) => {
    try {
      await api.toggleProductStatus(productId);
      loadProducts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to toggle status");
    }
  }, [loadProducts]);

  const handleDelete = useCallback(async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.deleteProduct(productId);
      loadProducts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete product");
    }
  }, [loadProducts]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const result = await api.getProductMeta();
        setCategories(result.data?.categories || []);
        setBrands(result.data?.brands || []);
      } catch { /* non-critical */ }
    };
    loadMeta();
  }, []);

  const stats = {
    total,
    active:     products.filter(p => p.status === "active").length,
    internal:   products.filter(p => !p.isSupplierProduct).length,
    supplier:   products.filter(p => p.isSupplierProduct).length,
    totalCodes: products
      .filter(p => !p.isSupplierProduct)
      .reduce((s, p) => s + (p.availableCodes ?? 0), 0),
  };
  return (
    <Dashboard>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Product Management</h2>
          <div className="flex gap-3">
            <button onClick={() => setShowImportModal(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Import Excel</button>
            <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Create Product</button>
          </div>
        </div>
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

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-4">
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white">
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white">
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="relative w-full md:w-80">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}

        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>
        ) : (
          <ProductTable
            products={products}
            viewMode="table"
            onEdit={setEditingProduct}
            onToggleStatus={handleToggleStatus}
            onUploadCodes={setUploadingProduct}
            onViewCodes={setViewingCodesProduct}
            onViewImages={setViewingImagesProduct}
            onDelete={handleDelete}
          />
        )}
      </div>

      {showImportModal && <ImportProductsModal onClose={() => setShowImportModal(false)} onComplete={() => { setShowImportModal(false); loadProducts(); }} />}
      {showCreateModal && (
        <CreateProductModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => { setShowCreateModal(false); loadProducts(); }}
          categories={categories}
          brands={brands}
          onSubmit={async (data) => {
            try {
              if (data._type === "internal") {
                await api.createInternalProduct(data);
              } else {
                await api.createSupplierProduct(data);
              }
            } catch (err: any) {
              alert(err.message || "Failed to save product");
              throw err;
            }
          }}
        />
      )}
      {uploadingProduct && <UploadCodesModal product={uploadingProduct} onClose={() => setUploadingProduct(null)} onSubmit={() => { setUploadingProduct(null); loadProducts(); }} />}
      {viewingCodesProduct && <ViewCodesModal product={viewingCodesProduct} onClose={() => setViewingCodesProduct(null)} />}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          categories={categories}
          brands={brands}
          onSubmit={async (data) => {
            try {
              await api.updateProduct(editingProduct.id, data);
              setEditingProduct(null);
              loadProducts();
            } catch (err: any) {
              alert(err.message || "Failed to update product");
              throw err;
            }
          }}
        />
      )}
      {viewingImagesProduct && <ProductImageGallery product={viewingImagesProduct} onClose={() => setViewingImagesProduct(null)} />}
    </Dashboard>
  );
}
