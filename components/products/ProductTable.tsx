import { Product } from "@/app/products/page";

interface ProductTableProps {
  products: Product[];
  viewMode: "table" | "grid";
  onEdit: (product: Product) => void;
  onToggleStatus: (productId: string) => void;
  onUploadCodes: (product: Product) => void;
  onViewCodes: (product: Product) => void;
  onViewImages: (product: Product) => void;
  onDelete: (productId: string) => void;
}

export default function ProductTable({
  products,
  viewMode,
  onEdit,
  onToggleStatus,
  onUploadCodes,
  onViewCodes,
  onViewImages,
  onDelete,
}: ProductTableProps) {

  const getStatusBadge = (status: string, product: Product) => {
    // out_of_stock is derived from inventory, not a real status field
    if (status === "active" && !product.isSupplierProduct && (product.availableCodes ?? 0) === 0 && (product.totalCodes ?? 0) > 0) {
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"; // out of stock display
    }
    const styles: Record<string, string> = {
      active:   "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
    };
    return styles[status] || styles.inactive;
  };

  const getStatusLabel = (status: string, product: Product) => {
    if (status === "active" && !product.isSupplierProduct && (product.availableCodes ?? 0) === 0 && (product.totalCodes ?? 0) > 0) {
      return "OUT OF STOCK";
    }
    return status.toUpperCase();
  };

  // Returns stock label + colour for internal products only
  const getStockLevel = (product: Product) => {
    if (product.isSupplierProduct) return { label: "Live Stock", color: "text-blue-600 dark:text-blue-400" };
    const avail = product.availableCodes ?? 0;
    const total = product.totalCodes ?? 0;
    if (total === 0 || avail === 0) return { label: "Out of Stock", color: "text-red-600 dark:text-red-400" };
    const pct = (avail / total) * 100;
    if (pct < 10) return { label: "Critical",  color: "text-red-600 dark:text-red-400" };
    if (pct < 25) return { label: "Low Stock",  color: "text-orange-600 dark:text-orange-400" };
    return { label: "In Stock", color: "text-green-600 dark:text-green-400" };
  };

  const SourceBadge = ({ product }: { product: Product }) =>
    product.isSupplierProduct ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Supplier
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
        Internal
      </span>
    );

  // ─── GRID VIEW ──────────────────────────────────────────────────────────────
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => {
          const stockLevel = getStockLevel(product);
          return (
            <div key={product.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image */}
              <div
                className={`h-48 relative cursor-pointer ${product.isSupplierProduct
                  ? "bg-gradient-to-br from-orange-400 to-rose-600"
                  : "bg-gradient-to-br from-blue-500 to-purple-600"}`}
                onClick={() => onViewImages(product)}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-20 h-20 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div className="absolute top-2 right-2 flex gap-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(product.status, product)}`}>
                    {getStatusLabel(product.status, product)}
                  </span>
                </div>
                <div className="absolute top-2 left-2">
                  <SourceBadge product={product} />
                </div>
                <div className="absolute bottom-2 left-2">
                  <span className="px-2 py-1 text-xs font-medium bg-black bg-opacity-50 text-white rounded">
                    {product.images.length} images
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded">
                      {product.brand}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{product.category}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{product.description}</p>

                {/* Price */}
                <div className="flex items-center gap-2">
                  {product.discountPrice ? (
                    <>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">${product.discountPrice}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 line-through">${product.price}</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">${product.price}</span>
                  )}
                </div>

                {/* Stock */}
                <div className="space-y-1">
                  {product.isSupplierProduct ? (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span className="text-blue-600 dark:text-blue-400 font-medium">Real-time fulfilment</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className={`font-medium ${stockLevel.color}`}>{stockLevel.label}</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {product.availableCodes}/{product.totalCodes}
                        </span>
                      </div>
                      {(product.totalCodes ?? 0) > 0 && (
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${((product.availableCodes ?? 0) / (product.totalCodes ?? 1)) * 100}%` }}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Supplier ref */}
                {product.isSupplierProduct && product.supplierRef && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate">
                    SPU: {product.supplierRef}
                  </p>
                )}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button onClick={() => onEdit(product)}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Edit
                  </button>
                  {product.isSupplierProduct ? (
                    <button disabled
                      className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded cursor-not-allowed"
                      title="Supplier products use real-time fulfilment">
                      Live Codes
                    </button>
                  ) : (
                    <button onClick={() => onUploadCodes(product)}
                      className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                      Upload Codes
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {products.length === 0 && (
          <div className="col-span-full text-center py-12">
            <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No products found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    );
  }

  // ─── TABLE VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category / Brand</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Inventory</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {products.map((product) => {
              const stockLevel = getStockLevel(product);
              return (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">

                  {/* Product */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded flex items-center justify-center cursor-pointer flex-shrink-0 ${
                          product.isSupplierProduct
                            ? "bg-gradient-to-br from-orange-400 to-rose-600"
                            : "bg-gradient-to-br from-blue-500 to-purple-600"
                        }`}
                        onClick={() => onViewImages(product)}
                      >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{product.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{product.id}</div>
                      </div>
                    </div>
                  </td>

                  {/* Type badge */}
                  <td className="px-6 py-4">
                    <SourceBadge product={product} />
                    {product.isSupplierProduct && product.supplierName && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">{product.supplierName}</div>
                    )}
                  </td>

                  {/* Category / Brand */}
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">{product.category}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{product.brand}</div>
                  </td>

                  {/* Price */}
                  <td className="px-6 py-4">
                    {product.discountPrice ? (
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">${product.discountPrice}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 line-through">${product.price}</div>
                      </div>
                    ) : (
                      <div className="font-medium text-gray-900 dark:text-white">${product.price}</div>
                    )}
                  </td>

                  {/* Inventory */}
                  <td className="px-6 py-4">
                    {product.isSupplierProduct ? (
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Real-time</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className={`text-sm font-medium ${stockLevel.color}`}>{stockLevel.label}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Available: {product.availableCodes ?? 0}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Sold: {product.soldCodes ?? 0}</div>
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(product.status, product)}`}>
                      {getStatusLabel(product.status, product)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {/* Edit */}
                      <button onClick={() => onEdit(product)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300" title="Edit Product">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Toggle status */}
                      <button onClick={() => onToggleStatus(product.id)}
                        className={product.status === "active"
                          ? "text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                          : "text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"}
                        title={product.status === "active" ? "Deactivate" : "Activate"}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {product.status === "active" ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          )}
                        </svg>
                      </button>

                      {/* Upload codes — internal only */}
                      {!product.isSupplierProduct ? (
                        <button onClick={() => onUploadCodes(product)}
                          className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300" title="Upload Codes">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </button>
                      ) : (
                        <span className="w-5 h-5 text-gray-300 dark:text-gray-600 cursor-not-allowed" title="Supplier — no code upload needed">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </span>
                      )}

                      {/* View codes — internal only */}
                      {!product.isSupplierProduct ? (
                        <button onClick={() => onViewCodes(product)}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300" title="View Codes">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      ) : (
                        <span className="w-5 h-5" />
                      )}

                      {/* Delete */}
                      <button onClick={() => onDelete(product.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300" title="Delete Product">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No products found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}