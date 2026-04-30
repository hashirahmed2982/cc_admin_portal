"use client";

import { useState } from "react";
import { Product } from "@/app/products/page";

interface CreateProductModalProps {
  onClose: () => void;
  onSubmit: (productData: any) => void;
  onSuccess?: () => void;
  categories: string[];

  brands: string[];
  initialData?: Product; // when set → Edit mode
}

type ProductType = "internal" | "supplier";

export default function CreateProductModal({
  onClose,
  onSubmit,
  onSuccess,
  categories,
  brands,
  initialData,
}: CreateProductModalProps) {
  const isEditing = !!initialData;

  // In edit mode, derive the type from the existing product
  const defaultType: ProductType = initialData?.isSupplierProduct ? "supplier" : "internal";
  const [productType, setProductType] = useState<ProductType>(defaultType);

  // ─── Shared fields ─────────────────────────────────────────────────────────
  const [name,                   setName]                   = useState(initialData?.name || "");
  const [category,               setCategory]               = useState(initialData?.category || "");
  const [brand,                  setBrand]                  = useState(initialData?.brand || "");
  const [description,            setDescription]            = useState(initialData?.description || "");
  const [redemptionInstructions, setRedemptionInstructions] = useState(initialData?.redemptionInstructions || "");
  const [price,                  setPrice]                  = useState(initialData?.price?.toString() || "");
  const [images,                 setImages]                 = useState<string[]>(initialData?.images || []);

  // ─── Internal-only fields ──────────────────────────────────────────────────
  const [discountPrice, setDiscountPrice] = useState(initialData?.discountPrice?.toString() || "");

  // ─── Supplier-only fields ──────────────────────────────────────────────────
  const [costPrice,      setCostPrice]     = useState(initialData?.costPrice?.toString() || "");
  const [faceValue,      setFaceValue]     = useState("");
  const [supplierName,   setSupplierName]  = useState(initialData?.supplierName || "carrypin");
  const [supplierRef,    setSupplierRef]   = useState(initialData?.supplierRef || "");
  const [supplierSkuRef, setSupplierSkuRef]= useState(initialData?.supplierSkuRef || "");
  const [realtimePrice,  setRealtimePrice] = useState(initialData?.realtimePrice ?? false);
  const [syncEnabled,    setSyncEnabled]   = useState(initialData?.syncEnabled ?? true);

  // ─── Combobox open state ──────────────────────────────────────────────────
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [brandOpen,    setBrandOpen]    = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Validation ───────────────────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim())                    e.name                   = "Product name is required";
    if (!category)                       e.category               = "Category is required";
    if (!brand)                          e.brand                  = "Brand is required";
    if (!description.trim())             e.description            = "Description is required";
    if (!redemptionInstructions.trim())  e.redemptionInstructions = "Redemption instructions are required";
    if (!price || parseFloat(price) <= 0) e.price                 = "Valid price is required";
    if (productType === "supplier") {
      if (!supplierRef.trim()) e.supplierRef = "Supplier product/SPU reference is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const roundPrice = (v: string) => Math.round(parseFloat(v) * 100) / 100;

    const shared = {
      name,
      category,
      brand,
      description,
      redemptionInstructions,
      price: roundPrice(price),
      images,
    };

    if (productType === "internal") {
      onSubmit({
        _type: "internal",
        ...shared,
        discountPrice: discountPrice ? roundPrice(discountPrice) : undefined,
      });
  onSuccess?.();
    } else {
      onSubmit({
        _type: "supplier",
        ...shared,
        costPrice:      costPrice    ? roundPrice(costPrice)    : undefined,
        faceValue:      faceValue    ? roundPrice(faceValue)    : undefined,
        supplierName,
        supplierRef,
        supplierSkuRef: supplierSkuRef || undefined,
        realtimePrice,
        syncEnabled,
      });
  onSuccess?.();
    }
  };

  const err = (field: string) =>
    errors[field] ? <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors[field]}</p> : null;

  const inputCls = (field: string) =>
    `w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[field] ? "border-red-500" : "border-gray-300 dark:border-gray-600"
    }`;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const urls = Array.from(files).map(f => URL.createObjectURL(f));
      setImages(prev => [...prev, ...urls]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isEditing ? "Edit Product" : "Add New Product"}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* ─── Product Type Switcher (only shown when creating) ─────────────── */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Product Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Internal */}
                <button
                  type="button"
                  onClick={() => setProductType("internal")}
                  className={`relative flex items-start gap-3 p-4 border-2 rounded-lg text-left transition-all ${
                    productType === "internal"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    productType === "internal" ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  }`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">Internal Inventory</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                      You hold the codes. Upload them via Excel. Inventory tracked in the system.
                    </p>
                  </div>
                  {productType === "internal" && (
                    <svg className="absolute top-3 right-3 w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                {/* Supplier */}
                {/* <button
                  type="button"
                  onClick={() => setProductType("supplier")}
                  className={`relative flex items-start gap-3 p-4 border-2 rounded-lg text-left transition-all ${
                    productType === "supplier"
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    productType === "supplier" ? "bg-orange-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  }`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">Supplier / Real-time</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                      Codes fulfilled live via supplier API (e.g. CarryPin). No stored inventory.
                    </p>
                  </div>
                  {productType === "supplier" && (
                    <svg className="absolute top-3 right-3 w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button> */}
              </div>
            </div>
          )}

          {/* ─── Basic Information ──────────────────────────────────────────── */}
          <div>
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              Basic Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); if (errors.name) setErrors(p => ({...p, name: ""})); }}
                  className={inputCls("name")}
                  placeholder="e.g., Netflix Premium Gift Card - $50"
                />
                {err("name")}
              </div>

              {/* Category — combobox */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category *</label>
                <input
                  type="text"
                  value={category}
                  onChange={e => { setCategory(e.target.value); setCategoryOpen(true); if (errors.category) setErrors(p => ({...p, category: ""})); }}
                  onFocus={() => setCategoryOpen(true)}
                  onBlur={() => setTimeout(() => setCategoryOpen(false), 150)}
                  className={inputCls("category")}
                  placeholder="Select or type a new category…"
                  autoComplete="off"
                />
                {categoryOpen && (
                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                    {categories
                      .filter(c => c.toLowerCase().includes(category.toLowerCase()))
                      .map(c => (
                        <button key={c} type="button"
                          onMouseDown={() => { setCategory(c); setCategoryOpen(false); if (errors.category) setErrors(p => ({...p, category: ""})); }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                          {c}
                        </button>
                      ))
                    }
                    {category.trim() && !categories.some(c => c.toLowerCase() === category.trim().toLowerCase()) && (
                      <button type="button"
                        onMouseDown={() => { setCategory(category.trim()); setCategoryOpen(false); if (errors.category) setErrors(p => ({...p, category: ""})); }}
                        className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Add "<span className="font-medium">{category.trim()}</span>" as new category
                      </button>
                    )}
                    {categories.filter(c => c.toLowerCase().includes(category.toLowerCase())).length === 0 && !category.trim() && (
                      <p className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Start typing to add a new category</p>
                    )}
                  </div>
                )}
                {err("category")}
              </div>

              {/* Brand — combobox */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Brand *</label>
                <input
                  type="text"
                  value={brand}
                  onChange={e => { setBrand(e.target.value); setBrandOpen(true); if (errors.brand) setErrors(p => ({...p, brand: ""})); }}
                  onFocus={() => setBrandOpen(true)}
                  onBlur={() => setTimeout(() => setBrandOpen(false), 150)}
                  className={inputCls("brand")}
                  placeholder="Select or type a new brand…"
                  autoComplete="off"
                />
                {brandOpen && (
                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                    {brands
                      .filter(b => b.toLowerCase().includes(brand.toLowerCase()))
                      .map(b => (
                        <button key={b} type="button"
                          onMouseDown={() => { setBrand(b); setBrandOpen(false); if (errors.brand) setErrors(p => ({...p, brand: ""})); }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                          {b}
                        </button>
                      ))
                    }
                    {brand.trim() && !brands.some(b => b.toLowerCase() === brand.trim().toLowerCase()) && (
                      <button type="button"
                        onMouseDown={() => { setBrand(brand.trim()); setBrandOpen(false); if (errors.brand) setErrors(p => ({...p, brand: ""})); }}
                        className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Add "<span className="font-medium">{brand.trim()}</span>" as new brand
                      </button>
                    )}
                    {brands.filter(b => b.toLowerCase().includes(brand.toLowerCase())).length === 0 && !brand.trim() && (
                      <p className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Start typing to add a new brand</p>
                    )}
                  </div>
                )}
                {err("brand")}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
                <textarea value={description} onChange={e => { setDescription(e.target.value); if (errors.description) setErrors(p => ({...p, description: ""})); }}
                  rows={3} className={inputCls("description")} placeholder="Detailed product description..." />
                {err("description")}
              </div>

              {/* Redemption instructions */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Redemption Instructions *</label>
                <textarea value={redemptionInstructions} onChange={e => { setRedemptionInstructions(e.target.value); if (errors.redemptionInstructions) setErrors(p => ({...p, redemptionInstructions: ""})); }}
                  rows={3} className={inputCls("redemptionInstructions")} placeholder="Step-by-step instructions for the customer..." />
                {err("redemptionInstructions")}
              </div>
            </div>
          </div>

          {/* ─── Pricing ────────────────────────────────────────────────────── */}
          <div>
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              Pricing
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selling Price * ($)
                </label>
                <input type="number" value={price} onChange={e => { setPrice(e.target.value); if (errors.price) setErrors(p => ({...p, price: ""})); }}
                  step="any" min="0" className={inputCls("price")} placeholder="0.00" />
                {err("price")}
              </div>

              {productType === "internal" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Discount Price ($) <span className="text-gray-400 font-normal">optional</span>
                  </label>
                  <input type="number" value={discountPrice} onChange={e => setDiscountPrice(e.target.value)}
                    step="0.01" min="0" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00" />
                </div>
              )}

              {productType === "supplier" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cost Price ($) <span className="text-gray-400 font-normal">what you pay</span>
                    </label>
                    <input type="number" value={costPrice} onChange={e => setCostPrice(e.target.value)}
                      step="0.01" min="0" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Face Value ($) <span className="text-gray-400 font-normal">denomination</span>
                    </label>
                    <input type="number" value={faceValue} onChange={e => setFaceValue(e.target.value)}
                      step="0.01" min="0" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ─── Supplier Details (supplier type only) ─────────────────────── */}
          {productType === "supplier" && (
            <div>
              <h4 className="text-base font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Supplier Integration
              </h4>

              <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/50 rounded-lg p-3 mb-4">
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  This product will be fulfilled in real-time via the supplier API. No codes are stored locally. 
                  When a client places an order, the system will call the supplier to deliver codes instantly.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Supplier *</label>
                  <select value={supplierName} onChange={e => setSupplierName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="carrypin">CarryPin</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Supplier Product / SPU ID *
                  </label>
                  <input type="text" value={supplierRef}
                    onChange={e => { setSupplierRef(e.target.value); if (errors.supplierRef) setErrors(p => ({...p, supplierRef: ""})); }}
                    className={inputCls("supplierRef")} placeholder="e.g., CP-SPU-12345" />
                  {err("supplierRef")}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Supplier SKU ID <span className="text-gray-400 font-normal">optional</span>
                  </label>
                  <input type="text" value={supplierSkuRef} onChange={e => setSupplierSkuRef(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., CP-SKU-67890" />
                </div>

                <div className="flex flex-col gap-3 pt-1">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" checked={realtimePrice} onChange={e => setRealtimePrice(e.target.checked)} className="sr-only" />
                      <div className={`w-10 h-5 rounded-full transition-colors ${realtimePrice ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`} />
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${realtimePrice ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Real-time pricing</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Fetch latest price from supplier on each order</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" checked={syncEnabled} onChange={e => setSyncEnabled(e.target.checked)} className="sr-only" />
                      <div className={`w-10 h-5 rounded-full transition-colors ${syncEnabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`} />
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${syncEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-sync enabled</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Automatically sync product data from supplier</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ─── Product Images ─────────────────────────────────────────────── */}
          <div>
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              Product Images
            </h4>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" id="img-upload" />
              <label htmlFor="img-upload" className="flex flex-col items-center cursor-pointer">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Click to upload images</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG up to 10MB each</p>
              </label>
            </div>
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mt-3">
                {images.map((img, i) => (
                  <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── Actions ─────────────────────────────────────────────────────── */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button type="submit"
              className={`px-6 py-2 text-white rounded-lg transition-colors font-medium ${
                productType === "supplier"
                  ? "bg-orange-500 hover:bg-orange-600"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}>
              {isEditing ? "Save Changes" : productType === "supplier" ? "Add Supplier Product" : "Create Internal Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}