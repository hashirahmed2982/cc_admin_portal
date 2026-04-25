"use client";

import Dashboard from "@/components/Dashboard";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import ProductTable from "@/components/products/ProductTable";
import CreateProductModal from "@/components/products/CreateProductModal";
import UploadCodesModal from "@/components/products/UploadCodesModal";
import ViewCodesModal from "@/components/products/ViewCodesModal";
import ImportProductsModal from "@/components/products/ImportProductsModal";
import { useSearch } from "@/app/context/SearchContext";

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
  const { searchTerm } = useSearch(); // Use global search
  const [products, setProducts]     = useState<Product[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [filterStatus, setFilterStatus]     = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterSource, setFilterSource]     = useState<"all" | "internal" | "carrypin">("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 20;

  const [showCreateModal, setShowCreateModal]   = useState(false);
  const [showImportModal, setShowImportModal]   = useState(false);
  const [uploadingProduct, setUploadingProduct] = useState<Product | null>(null);
  const [viewingCodesProduct, setViewingCodesProduct] = useState<Product | null>(null);

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load products";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, filterCategory, filterStatus, filterSource]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const result = await api.getProductMeta();
        setCategories(result.data?.categories || []);
      } catch { /* non-critical */ }
    };
    loadMeta();
  }, []);

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

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex flex-wrap gap-4">
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

        {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}

        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>
        ) : (
          <ProductTable
              products={products}
              onUploadCodes={setUploadingProduct}
              onViewCodes={setViewingCodesProduct} viewMode={"table"} onEdit={function (product: Product): void {
            throw new Error("Function not implemented.");
          }} onToggleStatus={function (productId: string): void {
            throw new Error("Function not implemented.");
          }} onViewImages={function (product: Product): void {
            throw new Error("Function not implemented.");
          }} onDelete={function (productId: string): void {
            throw new Error("Function not implemented.");
          }}          />
        )}
      </div>

      {showImportModal && <ImportProductsModal onClose={() => setShowImportModal(false)} onComplete={() => { setShowImportModal(false); loadProducts(); }} />}
      {showCreateModal && <CreateProductModal onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); loadProducts(); }} />}
      {uploadingProduct && <UploadCodesModal product={uploadingProduct} onClose={() => setUploadingProduct(null)} onSubmit={() => { setUploadingProduct(null); loadProducts(); }} />}
      {viewingCodesProduct && <ViewCodesModal product={viewingCodesProduct} onClose={() => setViewingCodesProduct(null)} />}
    </Dashboard>
  );
}
