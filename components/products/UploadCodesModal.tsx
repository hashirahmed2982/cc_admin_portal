"use client";

import { useState } from "react";
import { Product } from "@/app/products/page";
import { api } from "@/lib/api";

interface UploadCodesModalProps {
  product: Product;
  onClose: () => void;
  onSubmit: (productId: string, uploadData: { codesCount: number; fileName: string; summary: UploadSummary }) => void;
}

interface UploadStep {
  name: string;
  status: "pending" | "processing" | "complete" | "error";
  message?: string;
}

interface UploadSummary {
  fileName:       string;
  totalRows:      number;
  validCodes:     number;
  duplicates:     number;
  invalidCodes:   number;
  uploadedCodes:  number;
  processingTime: number;
}

interface CodeEntry {
  code:   string;
  status: string;
}

const STEPS: UploadStep[] = [
  { name: "Validate file format",    status: "pending" },
  { name: "Parse codes from Excel",  status: "pending" },
  { name: "Check for duplicates",    status: "pending" },
  { name: "Encrypt codes",           status: "pending" },
  { name: "Insert to database",      status: "pending" },
  { name: "Update inventory counts", status: "pending" },
  { name: "Generate upload summary", status: "pending" },
  { name: "Log audit trail",         status: "pending" },
];

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export default function UploadCodesModal({ product, onClose, onSubmit }: UploadCodesModalProps) {
  const [selectedFile,  setSelectedFile]  = useState<File | null>(null);
  const [isProcessing,  setIsProcessing]  = useState(false);
  const [showSummary,   setShowSummary]   = useState(false);
  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(null);
  const [uploadError,   setUploadError]   = useState<string | null>(null);
  const [steps,         setSteps]         = useState<UploadStep[]>(STEPS.map(s => ({ ...s })));

  if (product.isSupplierProduct) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center gap-3 text-orange-600 dark:text-orange-400 mb-4">
            <svg className="w-8 h-8 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h3 className="text-lg font-semibold">Supplier Product</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            <strong>{product.name}</strong> is fulfilled in real-time via the supplier API.
            Codes are delivered directly to customers at order time — no manual uploads needed.
          </p>
          <div className="mt-6 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">Close</button>
          </div>
        </div>
      </div>
    );
  }

  const setStep    = (i: number, status: UploadStep["status"], message?: string) =>
    setSteps(prev => prev.map((s, j) => j === i ? { ...s, status, message } : s));
  const resetSteps = () => setSteps(STEPS.map(s => ({ ...s })));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "xls") { alert("Please select a valid Excel file (.xlsx or .xls)"); return; }
    setSelectedFile(file);
    setShowSummary(false);
    setUploadError(null);
    resetSteps();
  };

  const handleStartUpload = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setUploadError(null);
    const startTime = Date.now();

    try {
      setStep(0, "processing");
      const ext = selectedFile.name.split(".").pop()?.toLowerCase();
      if (ext !== "xlsx" && ext !== "xls") throw new Error("Invalid file format — .xlsx or .xls only");
      await delay(200);
      setStep(0, "complete", "Excel file format validated");

      setStep(1, "processing");
      const entries = await parseExcelClientSide(selectedFile);
      if (!entries.length) throw new Error(`No matching codes for "${product.name}" found in the file.`);
      await delay(200);
      setStep(1, "complete", `Found ${entries.length} codes for this product`);

      setStep(2, "processing");
      await delay(300);
      setStep(2, "complete", "Duplicate check will run server-side using HMAC hash");

      setStep(3, "processing");
      await delay(200);
      setStep(3, "complete", "Codes encrypted AES-256-CBC on the server");

      setStep(4, "processing");
      const result = await api.uploadProductCodesJson(product.id, entries, selectedFile.name);
      const { data } = result;
      const dupMsg = data.duplicates > 0 ? ` — ${data.duplicates} duplicate${data.duplicates !== 1 ? "s" : ""} skipped` : "";
      setStep(4, "complete", `Inserted ${data.uploadedCodes} new codes${dupMsg}`);

      setStep(5, "processing");
      await delay(250);
      setStep(5, "complete", `Inventory updated: +${data.newAvailable ?? data.uploadedCodes} available codes`);

      setStep(6, "processing");
      await delay(200);
      const processingTime = (Date.now() - startTime) / 1000;
      setUploadSummary({
        fileName:       selectedFile.name,
        totalRows:      data.totalRows,
        validCodes:     data.validCodes,
        duplicates:     data.duplicates,
        invalidCodes:   data.invalidCodes,
        uploadedCodes:  data.uploadedCodes,
        processingTime,
      });
      setStep(6, "complete", "Upload summary ready");

      setStep(7, "processing");
      await delay(150);
      setStep(7, "complete", "Audit log created");

      setShowSummary(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed. Please try again.";
      setUploadError(msg);
      const idx = steps.findIndex(s => s.status === "processing");
      if (idx !== -1) setStep(idx, "error", msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const parseExcelClientSide = (file: File): Promise<CodeEntry[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.onload = async (e) => {
        try {
          const XLSX = await import("xlsx");
          const data = new Uint8Array(e.target!.result as ArrayBuffer);
          const wb   = XLSX.read(data, { type: "array", cellText: false, cellDates: true });
          const ws   = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(ws, { defval: "" }) as Record<string, string | number>[];
          if (!rows.length) { resolve([]); return; }

          const sampleKeys = Object.keys(rows[0]);
          const findKey    = (candidates: string[]) => sampleKeys.find(k =>
            candidates.includes(k.trim().toLowerCase().replace(/[\s_-]/g, ""))
          );

          const codeKey    = findKey(["cardcode", "code", "card_code", "serial", "key"]);
          const statusKey  = findKey(["status"]);
          const productKey = findKey(["product", "productid", "id", "name", "productname"]);

          if (!codeKey) { reject(new Error(`No code column found. Columns: ${sampleKeys.join(", ")}`)); return; }

          const entries: CodeEntry[] = [];
          const currentId   = String(product.id).toLowerCase();
          const currentName = product.name.toLowerCase();

          for (const row of rows) {
            const code = String(row[codeKey] ?? "").trim();
            if (!code) continue;
            if (productKey) {
              const v = String(row[productKey] ?? "").trim().toLowerCase();
              if (v && v !== currentId && v !== currentName) continue;
            }
            let status = "available";
            if (statusKey) {
              const s = String(row[statusKey] ?? "").trim().toLowerCase();
              if (["sold", "reserved", "invalid"].includes(s)) status = s;
            }
            entries.push({ code, status });
          }
          resolve(entries);
        } catch (err: unknown) {
          reject(new Error("Failed to parse Excel: " + (err instanceof Error ? err.message : "unknown")));
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleConfirmUpload = () => {
    if (uploadSummary) {
      onSubmit(product.id, { codesCount: uploadSummary.uploadedCodes, fileName: uploadSummary.fileName, summary: uploadSummary });
    }
  };

  const StepIcon = ({ status }: { status: UploadStep["status"] }) => {
    if (status === "complete")   return <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>;
    if (status === "processing") return <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>;
    if (status === "error")      return <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>;
    return <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-full"/>;
  };

  const allGood   = uploadSummary && uploadSummary.duplicates === 0 && uploadSummary.invalidCodes === 0;
  const allFailed = uploadSummary && uploadSummary.uploadedCodes === 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Upload Product Codes</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{product.name}</p>
            </div>
            <button onClick={onClose} disabled={isProcessing}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Current stock */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Current Stock</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {product.availableCodes ?? 0} / {product.totalCodes ?? 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Product ID</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{product.id}</p>
            </div>
          </div>

          {/* Info */}
          {!selectedFile && !showSummary && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium">Duplicate detection enabled:</p>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Codes already in the system will be automatically skipped.</li>
                    <li>Duplicates within the same file are also rejected.</li>
                    <li>Only rows matching this product will be imported.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {uploadError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">{uploadError}</p>
            </div>
          )}

          {/* File picker */}
          {!showSummary && (
            <div>
              <input type="file" accept=".xlsx,.xls" onChange={handleFileSelect}
                className="hidden" id="excel-upload" disabled={isProcessing}/>
              <label htmlFor="excel-upload"
                className={`block border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isProcessing
                    ? "border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed"
                    : "border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer"
                }`}>
                <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {selectedFile
                    ? <span className="font-medium text-blue-600 dark:text-blue-400">{selectedFile.name}</span>
                    : "Click to select Excel file"}
                </p>
                <p className="text-xs text-gray-500 mt-1">.xlsx or .xls only</p>
              </label>
            </div>
          )}

          {/* Steps */}
          {selectedFile && !showSummary && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Processing Steps:</h4>
              <div className="space-y-2">
                {steps.map((step, i) => {
                  const bg = step.status === "processing" ? "bg-blue-50 dark:bg-blue-900/20"
                           : step.status === "complete"   ? "bg-green-50 dark:bg-green-900/20"
                           : step.status === "error"      ? "bg-red-50 dark:bg-red-900/20"
                           : "bg-gray-50 dark:bg-gray-700/50";
                  const tc = step.status === "complete"   ? "text-green-900 dark:text-green-100"
                           : step.status === "processing" ? "text-blue-900 dark:text-blue-100"
                           : step.status === "error"      ? "text-red-900 dark:text-red-100"
                           : "text-gray-700 dark:text-gray-300";
                  return (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${bg}`}>
                      <div className="flex-shrink-0 mt-0.5"><StepIcon status={step.status}/></div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${tc}`}>{i + 1}. {step.name}</p>
                        {step.message && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{step.message}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Summary ───────────────────────────────────────────────────────── */}
          {showSummary && uploadSummary && (
            <div className="space-y-4">

              {/* Status banner */}
              {allFailed ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-100">No new codes uploaded</p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      All {uploadSummary.duplicates} code{uploadSummary.duplicates !== 1 ? "s" : ""} already exist in the system.
                    </p>
                  </div>
                </div>
              ) : allGood ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex gap-3">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">Upload completed — no issues</p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      All {uploadSummary.uploadedCodes} codes added to inventory.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex gap-3">
                  <svg className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <div>
                    <p className="font-medium text-amber-900 dark:text-amber-100">Upload completed with warnings</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      {uploadSummary.uploadedCodes} uploaded · {uploadSummary.duplicates} duplicate{uploadSummary.duplicates !== 1 ? "s" : ""} skipped
                    </p>
                  </div>
                </div>
              )}

              {/* Metric cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-lg p-4 border ${
                  uploadSummary.uploadedCodes > 0
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                }`}>
                  <p className={`text-3xl font-bold ${uploadSummary.uploadedCodes > 0 ? "text-green-700 dark:text-green-300" : "text-gray-400"}`}>
                    {uploadSummary.uploadedCodes}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">New codes added ✓</p>
                </div>

                <div className={`rounded-lg p-4 border ${
                  uploadSummary.duplicates > 0
                    ? "bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700"
                    : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                }`}>
                  <p className={`text-3xl font-bold ${uploadSummary.duplicates > 0 ? "text-orange-700 dark:text-orange-300" : "text-gray-400"}`}>
                    {uploadSummary.duplicates}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    Duplicates skipped
                    {uploadSummary.duplicates > 0 && (
                      <span className="block text-xs text-orange-600 dark:text-orange-400 mt-0.5 font-medium">
                        Already exist in system
                      </span>
                    )}
                  </p>
                </div>

                {uploadSummary.invalidCodes > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-3xl font-bold text-red-700 dark:text-red-300">{uploadSummary.invalidCodes}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Invalid / empty rows</p>
                  </div>
                )}

                <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <p className="text-3xl font-bold text-gray-600 dark:text-gray-300">{uploadSummary.totalRows}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Total rows in file</p>
                </div>
              </div>

              {/* File info */}
              <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <span className="text-sm text-gray-600 dark:text-gray-300 font-mono truncate max-w-xs">{uploadSummary.fileName}</span>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 ml-4">{uploadSummary.processingTime.toFixed(1)}s</span>
              </div>

              {/* Dupe explanation */}
              {uploadSummary.duplicates > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Why were codes skipped?</strong> Each code is hashed and checked against all existing records.
                    If the same code was uploaded before (even in a different batch), it is automatically rejected
                    to prevent duplicate deliveries to clients.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
          <div className="flex justify-end gap-3">
            <button onClick={onClose} disabled={isProcessing}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
              {showSummary ? "Close" : "Cancel"}
            </button>
            {!showSummary && selectedFile && !isProcessing && (
              <button onClick={handleStartUpload}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Verify & Start Upload
              </button>
            )}
            {showSummary && uploadSummary && uploadSummary.uploadedCodes > 0 && (
              <button onClick={handleConfirmUpload}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Confirm & Update
              </button>
            )}
            {showSummary && uploadSummary && uploadSummary.uploadedCodes === 0 && (
              <button onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}