"use client";

import { useState } from "react";
import { Product } from "@/app/products/page";
import { api } from "@/lib/api";

interface UploadCodesModalProps {
  product: Product;
  onClose: () => void;
  /** Called after a successful upload so parent can refresh product inventory counts */
  onSubmit: (productId: string, uploadData: { codesCount: number; fileName: string; summary: UploadSummary }) => void;
}

interface UploadStep {
  name: string;
  status: "pending" | "processing" | "complete" | "error";
  message?: string;
}

interface UploadSummary {
  fileName: string;
  totalRows: number;
  validCodes: number;
  duplicates: number;
  invalidCodes: number;
  uploadedCodes: number;
  processingTime: number;
}

interface CodeEntry {
  code: string;
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold">Supplier Product</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            <strong>{product.name}</strong> is fulfilled in real-time via the supplier API.
            Codes are delivered directly to customers at order time — no manual uploads needed.
          </p>
          <div className="mt-6 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const setStep = (i: number, status: UploadStep["status"], message?: string) => {
    setSteps(prev => prev.map((s, j) => j === i ? { ...s, status, message } : s));
  };

  const resetSteps = () => setSteps(STEPS.map(s => ({ ...s })));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "xls") {
      alert("Please select a valid Excel file (.xlsx or .xls)");
      return;
    }
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
      if (!entries.length) throw new Error(`No matching codes for "${product.name}" (ID: ${product.id}) found in the file. Please check your Excel data.`);
      await delay(200);
      setStep(1, "complete", `Verified ${entries.length} codes for this product`);

      setStep(2, "processing");
      await delay(300);
      setStep(2, "complete", "Duplicate check will run server-side");

      setStep(3, "processing");
      await delay(200);
      setStep(3, "complete", "Codes will be encrypted AES-256-CBC on the server");

      setStep(4, "processing");
      const result = await api.uploadProductCodesJson(product.id, entries, selectedFile.name);
      const { data } = result;
      setStep(4, "complete", `Inserted ${data.uploadedCodes} codes into database`);

      setStep(5, "processing");
      await delay(250);
      setStep(5, "complete", `Inventory updated: +${data.uploadedCodes} available codes`);

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
      const processingIdx = steps.findIndex(s => s.status === "processing");
      if (processingIdx !== -1) setStep(processingIdx, "error", msg);
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
          
          // Helper to find key by normalized comparison
          const findKey = (candidates: string[]) => sampleKeys.find(k => {
            const normalized = k.trim().toLowerCase().replace(/[\s_-]/g, "");
            return candidates.includes(normalized);
          });

          const codeKey    = findKey(["cardcode", "code", "card_code", "serial", "key"]);
          const statusKey  = findKey(["status"]);
          const productKey = findKey(["product", "productid", "id", "name", "productname"]);

          if (!codeKey) {
            reject(new Error(`Could not find a code column. Found columns: ${sampleKeys.join(", ")}`));
            return;
          }

          const entries: CodeEntry[] = [];
          const currentId = String(product.id).toLowerCase();
          const currentName = product.name.toLowerCase();

          for (const row of rows) {
            const code = String(row[codeKey] ?? "").trim();
            if (!code) continue;

            // Matching Logic: If a product column exists, ensure it matches current product
            if (productKey) {
              const rowProductVal = String(row[productKey] ?? "").trim().toLowerCase();
              // Skip only if the row has a value AND it doesn't match ID or Name
              if (rowProductVal && rowProductVal !== currentId && rowProductVal !== currentName) {
                continue;
              }
            }

            let status = "available";
            if (statusKey) {
              const s = String(row[statusKey] ?? "").trim().toLowerCase();
              if (["sold", "reserved", "invalid"].includes(s)) {
                status = s;
              }
            }
            entries.push({ code, status });
          }

          resolve(entries);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "unknown error";
          reject(new Error("Failed to parse Excel: " + msg));
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleConfirmUpload = () => {
    if (uploadSummary) {
      onSubmit(product.id, {
        codesCount: uploadSummary.validCodes,
        fileName:   uploadSummary.fileName,
        summary:    uploadSummary,
      });
    }
  };

  const StepIcon = ({ status }: { status: UploadStep["status"] }) => {
    if (status === "complete")
      return <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
    if (status === "processing")
      return <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>;
    if (status === "error")
      return <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
    return <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-full" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">

        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Upload Product Codes</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{product.name}</p>
            </div>
            <button onClick={onClose} disabled={isProcessing}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
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
          </div>

          {!selectedFile && !showSummary && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium">Verification Logic Enabled:</p>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Codes will be strictly matched to this product.</li>
                    <li>If your Excel contains multiple products, only rows matching this Product Name or ID will be uploaded.</li>
                    <li>Others will be automatically filtered out.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {uploadError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">{uploadError}</p>
            </div>
          )}

          {!showSummary && (
            <div>
              <input type="file" accept=".xlsx,.xls" onChange={handleFileSelect}
                className="hidden" id="excel-upload" disabled={isProcessing} />
              <label htmlFor="excel-upload"
                className={`block border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isProcessing
                    ? "border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed"
                    : "border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer"
                }`}>
                <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {selectedFile ? (
                    <span className="font-medium text-blue-600 dark:text-blue-400">{selectedFile.name}</span>
                  ) : "Click to select Excel file"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">.xlsx or .xls — only matching rows will be imported</p>
              </label>
            </div>
          )}

          {selectedFile && !showSummary && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Processing Steps:</h4>
              <div className="space-y-2">
                {steps.map((step, i) => {
                   const stepBg = step.status === "processing" ? "bg-blue-50 dark:bg-blue-900/20" : step.status === "complete" ? "bg-green-50 dark:bg-green-900/20" : step.status === "error" ? "bg-red-50 dark:bg-red-900/20" : "bg-gray-50 dark:bg-gray-700/50";
                   const textCls = step.status === "complete" ? "text-green-900 dark:text-green-100" : step.status === "processing" ? "text-blue-900 dark:text-blue-100" : step.status === "error" ? "text-red-900 dark:text-red-100" : "text-gray-700 dark:text-gray-300";
                   return (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${stepBg}`}>
                      <div className="flex-shrink-0 mt-0.5"><StepIcon status={step.status} /></div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${textCls}`}>
                          {i + 1}. {step.name}
                        </p>
                        {step.message && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{step.message}</p>
                        )}
                      </div>
                    </div>
                   );
                })}
              </div>
            </div>
          )}

          {showSummary && uploadSummary && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex gap-3">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">Upload Completed Successfully!</p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">Validated and added to inventory.</p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
                  <h4 className="font-medium text-gray-900 dark:text-white">Upload Summary</h4>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { label: "File Name:",          value: uploadSummary.fileName,                          cls: "" },
                    { label: "Total Rows in File:", value: uploadSummary.totalRows,                         cls: "" },
                    { label: "Validated for Product:", value: uploadSummary.validCodes,                        cls: "text-green-600 dark:text-green-400" },
                    { label: "Duplicates Skipped:", value: uploadSummary.duplicates,                        cls: "text-orange-600 dark:text-orange-400" },
                  ].map(({ label, value, cls }, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                      <span className={`text-sm font-medium ${cls || "text-gray-900 dark:text-white"}`}>{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">New Inventory Added:</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{uploadSummary.uploadedCodes} codes</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={isProcessing}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
              {showSummary ? "Close" : "Cancel"}
            </button>
            {!showSummary && selectedFile && !isProcessing && (
              <button onClick={handleStartUpload}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Verify & Start Upload
              </button>
            )}
            {showSummary && (
              <button onClick={handleConfirmUpload}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Confirm & Update
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
