// components/products/ImageLibraryModal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";

interface LibraryImage {
  filename: string;
  url: string;
  sizeKb: number;
  uploadedAt: string;
  usedBy: { id: string; name: string }[];
}

interface ImageLibraryModalProps {
  onClose: () => void;
  onSelect?: (url: string) => void; // when provided, modal acts as a picker instead of a manager
}

export default function ImageLibraryModal({ onClose, onSelect }: ImageLibraryModalProps) {
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.getImageLibrary();
      setImages(result.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 1500);
  };

  const handleDelete = async (img: LibraryImage) => {
    if (img.usedBy.length > 0) {
      alert(`Cannot delete — still used by: ${img.usedBy.map(u => u.name).join(", ")}`);
      return;
    }
    if (!confirm(`Delete ${img.filename}? This cannot be undone.`)) return;
    try {
      await api.deleteLibraryImage(img.filename);
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete image");
    }
  };

  const uploadFiles = async (files: FileList | File[]) => {
    setUploadError(null);
    setUploading(true);

    const list = Array.from(files);
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    let failCount = 0;

    for (const file of list) {
      if (!allowed.includes(file.type)) {
        failCount++;
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        failCount++;
        continue;
      }
      try {
        await api.uploadProductImage(file);
      } catch {
        failCount++;
      }
    }

    setUploading(false);
    if (failCount > 0) {
      setUploadError(
        failCount === list.length
          ? "Upload failed — only JPG, PNG, or WebP under 10MB are allowed."
          : `${failCount} of ${list.length} file(s) failed to upload (wrong type or too large).`
      );
    }
    load(); // refresh library with whatever succeeded
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadFiles(e.target.files);
    e.target.value = ""; // allow re-selecting the same file later
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  };

  const filtered = images.filter(img =>
    img.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">

        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {onSelect ? "Choose an Image" : "Image Management"}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {onSelect
                  ? "Click an image below to attach it to this product, or upload a new one."
                  : 'Upload images here, then copy a URL and paste it into the "Image" column when importing products via Excel.'}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Upload dropzone */}
        <div className="px-6 pt-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
              dragActive
                ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Uploading…</p>
            ) : (
              <>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  Drop images here or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, or WebP — up to 10MB each, multiple allowed</p>
              </>
            )}
          </div>
          {uploadError && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">{uploadError}</p>
          )}
        </div>

        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 mt-2">
          <input
            type="search"
            placeholder="Search filename..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-xs px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg mb-4 text-sm">{error}</div>}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-12">
              {images.length === 0 ? "No images uploaded yet — drop some above to get started." : "No images match your search"}
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map(img => (
                <div
                  key={img.filename}
                  className={`border border-gray-200 dark:border-gray-600 rounded-lg p-2 bg-gray-50 dark:bg-gray-700/50 ${
                    onSelect ? "cursor-pointer hover:ring-2 hover:ring-blue-400 transition-shadow" : ""
                  }`}
                  onClick={() => onSelect?.(img.url)}
                >
                  <img
                    src={img.url}
                    alt={img.filename}
                    className="w-full h-24 object-cover rounded mb-2 bg-white dark:bg-gray-800"
                  />
                  <p className="text-xs truncate text-gray-700 dark:text-gray-300" title={img.filename}>{img.filename}</p>
                  <p className="text-[10px] text-gray-400">{img.sizeKb} KB</p>
                  {img.usedBy.length > 0 ? (
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 truncate" title={img.usedBy.map(u => u.name).join(", ")}>
                      Used by {img.usedBy.length} product{img.usedBy.length > 1 ? "s" : ""}
                    </p>
                  ) : (
                    <p className="text-[10px] text-gray-400 italic">Unused</p>
                  )}

                  {/* Copy/delete only make sense in library-management mode, not picker mode */}
                  {!onSelect && (
                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); copyUrl(img.url); }}
                        className="flex-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded py-1"
                      >
                        {copiedUrl === img.url ? "Copied!" : "Copy URL"}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(img); }}
                        className="text-xs bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 rounded py-1 px-2"
                        title={img.usedBy.length > 0 ? "In use — cannot delete" : "Delete"}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}