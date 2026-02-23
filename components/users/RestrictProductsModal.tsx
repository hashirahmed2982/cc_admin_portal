"use client";

import { useState } from "react";
import { User } from "@/app/users/page";

interface RestrictProductsModalProps {
  user: User;
  onClose: () => void;
  onSubmit: (restrictedProducts: string[]) => void;
}

// Mock products data
const availableProducts = [
  {
    id: "PRD-001",
    name: "Premium Analytics Suite",
    category: "Analytics",
    price: 299,
  },
  {
    id: "PRD-002",
    name: "Enterprise Security Package",
    category: "Security",
    price: 499,
  },
  {
    id: "PRD-003",
    name: "Advanced AI Tools",
    category: "AI/ML",
    price: 399,
  },
  {
    id: "PRD-004",
    name: "Cloud Storage Pro",
    category: "Storage",
    price: 199,
  },
  {
    id: "PRD-005",
    name: "Business Intelligence Dashboard",
    category: "Analytics",
    price: 349,
  },
  {
    id: "PRD-006",
    name: "Data Integration Platform",
    category: "Integration",
    price: 449,
  },
  {
    id: "PRD-007",
    name: "Marketing Automation Suite",
    category: "Marketing",
    price: 279,
  },
  {
    id: "PRD-008",
    name: "Customer Support Platform",
    category: "Support",
    price: 229,
  },
];

export default function RestrictProductsModal({
  user,
  onClose,
  onSubmit,
}: RestrictProductsModalProps) {
  const [restrictedProducts, setRestrictedProducts] = useState<string[]>(
    user.restrictedProducts || []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const categories = Array.from(
    new Set(availableProducts.map((p) => p.category))
  );

  const filteredProducts = availableProducts.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleProduct = (productId: string) => {
    setRestrictedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(restrictedProducts);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Restrict Products
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Select products this user cannot access
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            {/* User Info */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user.company}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Restricted Products
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {restrictedProducts.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Info Alert */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium">Product Access Control</p>
                  <p className="mt-1">
                    Restricted products will not be visible or accessible to this
                    user. This is useful for controlling access to premium features
                    or region-specific products.
                  </p>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
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
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Products List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Available Products ({filteredProducts.length})
                </h4>
                {restrictedProducts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setRestrictedProducts([])}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Clear All Restrictions
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => {
                  const isRestricted = restrictedProducts.includes(product.id);
                  return (
                    <label
                      key={product.id}
                      className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                        isRestricted
                          ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                          : "border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isRestricted}
                        onChange={() => toggleProduct(product.id)}
                        className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {product.name}
                          </p>
                          {isRestricted && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400 rounded">
                              Restricted
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {product.id}
                          </p>
                          <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                            {product.category}
                          </span>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            ${product.price}/mo
                          </p>
                        </div>
                      </div>
                      {isRestricted ? (
                        <svg
                          className="w-6 h-6 text-red-600 dark:text-red-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                          />
                        </svg>
                      ) : (
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
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {restrictedProducts.length} of {availableProducts.length} products
                restricted
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Restrictions
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
