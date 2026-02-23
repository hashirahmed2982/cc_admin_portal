"use client";

import Dashboard from "@/components/Dashboard";
import { useState } from "react";
import ProductTable from "@/components/products/ProductTable";
import CreateProductModal from "@/components/products/CreateProductModal";
import EditProductModal from "@/components/products/EditProductModal";
import UploadCodesModal from "@/components/products/UploadCodesModal";
import ProductImageGallery from "@/components/products/ProductImageGallery";
import ViewCodesModal from "@/components/products/ViewCodesModal";
export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  description: string;
  redemptionInstructions: string;
  images: string[];
  price: number;
  discountPrice?: number;
  totalCodes: number;
  availableCodes: number;
  soldCodes: number;
  status: "active" | "inactive" | "out_of_stock";
  createdAt: string;
  updatedAt: string;
}

export interface DigitalCode {
  id: string;
  productId: string;
  code: string;
  encryptedCode: string;
  status: "available" | "sold" | "reserved" | "expired";
  uploadedAt: string;
  uploadedBy: string;
  soldAt?: string;
  soldTo?: string;
  expiryDate?: string;
}

// Mock data
const initialProducts: Product[] = [
  {
    id: "PRD-001",
    name: "Netflix Premium Gift Card - $50",
    category: "Streaming Services",
    brand: "Netflix",
    description: "Netflix Premium subscription gift card valid for streaming content. Enjoy unlimited movies, TV shows, and documentaries.",
    redemptionInstructions: "1. Go to netflix.com/redeem\n2. Enter the code\n3. Click 'Redeem'\n4. Enjoy your subscription",
    images: ["/products/netflix-1.jpg", "/products/netflix-2.jpg"],
    price: 50,
    discountPrice: 45,
    totalCodes: 500,
    availableCodes: 342,
    soldCodes: 158,
    status: "active",
    createdAt: "2024-01-15",
    updatedAt: "2024-02-04",
  },
  {
    id: "PRD-002",
    name: "Amazon Gift Card - $100",
    category: "E-Commerce",
    brand: "Amazon",
    description: "Amazon digital gift card that can be used to purchase millions of items on Amazon.com",
    redemptionInstructions: "1. Go to Amazon.com\n2. Add items to cart\n3. At checkout, enter gift card code\n4. Apply to order",
    images: ["/products/amazon-1.jpg"],
    price: 100,
    totalCodes: 1000,
    availableCodes: 823,
    soldCodes: 177,
    status: "active",
    createdAt: "2024-01-10",
    updatedAt: "2024-02-03",
  },
  {
    id: "PRD-003",
    name: "PlayStation Network Card - $25",
    category: "Gaming",
    brand: "PlayStation",
    description: "PSN wallet top-up card for purchasing games, DLC, and subscriptions on PlayStation Network",
    redemptionInstructions: "1. Sign in to PlayStation Network\n2. Go to PlayStation Store\n3. Select 'Redeem Codes'\n4. Enter the code",
    images: ["/products/psn-1.jpg", "/products/psn-2.jpg", "/products/psn-3.jpg"],
    price: 25,
    discountPrice: 23,
    totalCodes: 200,
    availableCodes: 0,
    soldCodes: 200,
    status: "out_of_stock",
    createdAt: "2024-01-20",
    updatedAt: "2024-02-01",
  },
  {
    id: "PRD-004",
    name: "Spotify Premium - 3 Months",
    category: "Streaming Services",
    brand: "Spotify",
    description: "3 months of Spotify Premium subscription with ad-free music streaming",
    redemptionInstructions: "1. Go to spotify.com/redeem\n2. Log in to your account\n3. Enter the code\n4. Enjoy Premium features",
    images: ["/products/spotify-1.jpg"],
    price: 30,
    totalCodes: 150,
    availableCodes: 95,
    soldCodes: 55,
    status: "inactive",
    createdAt: "2024-02-01",
    updatedAt: "2024-02-04",
  },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadCodesModal, setShowUploadCodesModal] = useState(false);
  const [showViewCodesModal, setShowViewCodesModal] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);

  // Get unique categories and brands
  const categories = Array.from(new Set(products.map((p) => p.category)));
  const brands = Array.from(new Set(products.map((p) => p.brand)));

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      filterCategory === "all" || product.category === filterCategory;
    const matchesStatus = filterStatus === "all" || product.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Handler functions
  const handleCreateProduct = (productData: any) => {
    const newProduct: Product = {
      id: `PRD-${String(products.length + 1).padStart(3, "0")}`,
      ...productData,
      totalCodes: 0,
      availableCodes: 0,
      soldCodes: 0,
      status: "inactive" as const,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };
    setProducts([...products, newProduct]);
    setShowCreateModal(false);
  };

  const handleEditProduct = (productData: any) => {
    setProducts(
      products.map((product) =>
        product.id === selectedProduct?.id
          ? { ...product, ...productData, updatedAt: new Date().toISOString().split("T")[0] }
          : product
      )
    );
    setShowEditModal(false);
    setSelectedProduct(null);
  };

  const handleToggleStatus = (productId: string) => {
    setProducts(
      products.map((product) =>
        product.id === productId
          ? {
              ...product,
              status: product.status === "active" ? ("inactive" as const) : ("active" as const),
              updatedAt: new Date().toISOString().split("T")[0],
            }
          : product
      )
    );
  };

  const handleUploadCodes = (productId: string, uploadData: any) => {
    setProducts(
      products.map((product) =>
        product.id === productId
          ? {
              ...product,
              totalCodes: product.totalCodes + uploadData.codesCount,
              availableCodes: product.availableCodes + uploadData.codesCount,
              updatedAt: new Date().toISOString().split("T")[0],
            }
          : product
      )
    );
    setShowUploadCodesModal(false);
    setSelectedProduct(null);
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      setProducts(products.filter((p) => p.id !== productId));
    }
  };

  // Calculate stats
  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter((p) => p.status === "active").length,
    totalInventory: products.reduce((sum, p) => sum + p.availableCodes, 0),
    totalValue: products.reduce((sum, p) => sum + p.price * p.availableCodes, 0),
  };

  return (
    <Dashboard>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
              Product Management
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage digital card products, categories, and inventory
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add New Product
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Products
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  {stats.totalProducts}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Active Products
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  {stats.activeProducts}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Inventory
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  {stats.totalInventory.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  codes available
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Inventory Value
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  ${stats.totalValue.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-orange-600 dark:text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search products by name, brand, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex gap-2 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded ${
                  viewMode === "table"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Products Display */}
        <ProductTable
          products={filteredProducts}
          viewMode={viewMode}
          onEdit={(product) => {
            setSelectedProduct(product);
            setShowEditModal(true);
          }}
          onToggleStatus={handleToggleStatus}
          onUploadCodes={(product) => {
            setSelectedProduct(product);
            setShowUploadCodesModal(true);
          }}
          onViewCodes={(product) => {
            setSelectedProduct(product);
            setShowViewCodesModal(true);
          }}
          onViewImages={(product) => {
            setSelectedProduct(product);
            setShowImageGallery(true);
          }}
          onDelete={handleDeleteProduct}
        />
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateProductModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateProduct}
          categories={categories}
          brands={brands}
        />
      )}

      {showEditModal && selectedProduct && (
        <EditProductModal
          product={selectedProduct}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProduct(null);
          }}
          onSubmit={handleEditProduct}
          categories={categories}
          brands={brands}
        />
      )}

      {showUploadCodesModal && selectedProduct && (
        <UploadCodesModal
          product={selectedProduct}
          onClose={() => {
            setShowUploadCodesModal(false);
            setSelectedProduct(null);
          }}
          onSubmit={handleUploadCodes}
        />
      )}

      {showViewCodesModal && selectedProduct && (
        <ViewCodesModal
          product={selectedProduct}
          onClose={() => {
            setShowViewCodesModal(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {showImageGallery && selectedProduct && (
        <ProductImageGallery
          product={selectedProduct}
          onClose={() => {
            setShowImageGallery(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </Dashboard>
  );
}
