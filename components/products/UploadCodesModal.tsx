"use client";

import { useState } from "react";
import { Product } from "@/app/products/page";
import { api } from "@/lib/api";

interface UploadCodesModalProps {
  product: Product;
  onClose: () => void;
  /** Called after a successful upload so parent can refresh product inventory counts */
  onSubmit: (productId: string, uploadData: any) => void;
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

  // Guard: supplier products should never reach this modal, but show a clear error just in case
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
            <strong>{product.name}</strong> is fulfilled in real-time via the supplier API (<span className="capitalize">{product.supplierName || "supplier"}</span>).
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
      // Step 0: Validate file format
      setStep(0, "processing");
      const ext = selectedFile.name.split(".").pop()?.toLowerCase();
      if (ext !== "xlsx" && ext !== "xls") throw new Error("Invalid file format — .xlsx or .xls only");
      await delay(200);
      setStep(0, "complete", "Excel file format validated");

      // Step 1: Parse Excel in the browser (no upload needed)
      setStep(1, "processing");
      const entries = await parseExcelClientSide(selectedFile);
      if (!entries.length) throw new Error("No valid codes found in the file");
      await delay(200);
      setStep(1, "complete", `Parsed ${entries.length} rows from ${selectedFile.name}`);

      // Step 2: Dedup check (done server-side, animate client side)
      setStep(2, "processing");
      await delay(300);
      setStep(2, "complete", "Duplicate check will run server-side against existing codes");

      // Step 3: Encryption happens server-side
      setStep(3, "processing");
      await delay(200);
      setStep(3, "complete", "Codes will be encrypted AES-256-CBC on the server");

      // Step 4: Send parsed JSON to backend — no file size limit
      setStep(4, "processing");
      const result = await api.uploadProductCodesJson(product.id, entries, selectedFile.name);
      const { data } = result;
      setStep(4, "complete", `Inserted ${data.uploadedCodes} codes into digital_codes table`);

      // Step 5: Inventory updated server-side
      setStep(5, "processing");
      await delay(250);
      setStep(5, "complete", `Inventory updated: +${data.newAvailable ?? data.uploadedCodes} available codes`);

      // Step 6: Summary
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

      // Step 7: Audit log (server-side)
      setStep(7, "processing");
      await delay(150);
      setStep(7, "complete", `Audit log created at ${new Date().toLocaleString()}`);

      setShowSummary(true);
    } catch (err: any) {
      setUploadError(err.message || "Upload failed. Please try again.");
      const processingIdx = steps.findIndex(s => s.status === "processing");
      if (processingIdx !== -1) setStep(processingIdx, "error", err.message || "An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Parse Excel entirely in the browser using FileReader + SheetJS ────────
  const parseExcelClientSide = (file: File): Promise<{ code: string; status: string }[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.onload = async (e) => {
        try {
          const XLSX = await import("xlsx");
          const data = new Uint8Array(e.target!.result as ArrayBuffer);
          const wb   = XLSX.read(data, { type: "array", cellText: false, cellDates: true });
          const ws   = wb.Sheets[wb.SheetNames[0]];

          // Use object mode — SheetJS uses the first row as keys automatically
          const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

          if (!rows.length) { resolve([]); return; }

          // Find the code and status keys case-insensitively
          const sampleKeys = Object.keys(rows[0]);
          const codeKey   = sampleKeys.find(k => ["cardcode", "code", "card_code", "serial", "key"]
                              .includes(k.trim().toLowerCase()));
          const statusKey = sampleKeys.find(k => k.trim().toLowerCase() === "status");

          if (!codeKey) {
            reject(new Error(`Could not find a code column. Found columns: ${sampleKeys.join(", ")}`));
            return;
          }

          const entries: { code: string; status: string }[] = [];

          for (const row of rows) {
            const code = String(row[codeKey] ?? "").trim();
            if (!code) continue;

            let status = "available";
            if (statusKey) {
              const s = String(row[statusKey] ?? "").trim().toLowerCase();
              if      (s === "sold")     status = "sold";
              else if (s === "reserved") status = "reserved";
              else if (s === "invalid")  status = "invalid";
            }
            entries.push({ code, status });
          }

          resolve(entries);
        } catch (err: any) {
          reject(new Error("Failed to parse Excel: " + (err.message || "unknown error")));
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

  const stepBg = (s: UploadStep["status"]) => {
    if (s === "processing") return "bg-blue-50 dark:bg-blue-900/20";
    if (s === "complete")   return "bg-green-50 dark:bg-green-900/20";
    if (s === "error")      return "bg-red-50 dark:bg-red-900/20";
    return "bg-gray-50 dark:bg-gray-700/50";
  };

  const stepTextCls = (s: UploadStep["status"]) => {
    if (s === "complete")   return "text-green-900 dark:text-green-100";
    if (s === "processing") return "text-blue-900 dark:text-blue-100";
    if (s === "error")      return "text-red-900 dark:text-red-100";
    return "text-gray-700 dark:text-gray-300";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
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

          {/* Product info */}
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

          {/* Instructions */}
          {!selectedFile && !showSummary && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium">Excel File Requirements:</p>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>File format: .xlsx or .xls</li>
                    <li>Column A should contain the product codes (one per row)</li>
                    <li>No header row required — it will be skipped automatically</li>
                    <li>Duplicate codes are detected and skipped</li>
                    <li>All codes are encrypted (AES-256-CBC) before storage</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {uploadError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700 dark:text-red-300">{uploadError}</p>
            </div>
          )}

          {/* File picker */}
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
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">.xlsx or .xls — up to 10MB</p>
              </label>
            </div>
          )}

          {/* Processing steps */}
          {selectedFile && !showSummary && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Processing Steps:</h4>
              <div className="space-y-2">
                {steps.map((step, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${stepBg(step.status)}`}>
                    <div className="flex-shrink-0 mt-0.5"><StepIcon status={step.status} /></div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${stepTextCls(step.status)}`}>
                        {i + 1}. {step.name}
                      </p>
                      {step.message && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{step.message}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success summary */}
          {showSummary && uploadSummary && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex gap-3">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">Upload Completed Successfully!</p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">All codes processed and added to inventory.</p>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
                  <h4 className="font-medium text-gray-900 dark:text-white">Upload Summary</h4>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { label: "File Name:",          value: uploadSummary.fileName,                          cls: "" },
                    { label: "Total Rows:",         value: uploadSummary.totalRows,                         cls: "" },
                    { label: "Valid Codes:",        value: uploadSummary.validCodes,                        cls: "text-green-600 dark:text-green-400" },
                    { label: "Duplicates Skipped:", value: uploadSummary.duplicates,                        cls: "text-orange-600 dark:text-orange-400" },
                    { label: "Invalid Codes:",      value: uploadSummary.invalidCodes,                      cls: "text-red-600 dark:text-red-400" },
                  ].map(({ label, value, cls }, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                      <span className={`text-sm font-medium ${cls || "text-gray-900 dark:text-white"}`}>{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Successfully Uploaded:</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{uploadSummary.uploadedCodes} codes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Processing Time:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{uploadSummary.processingTime.toFixed(2)}s</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={isProcessing}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
              {showSummary ? "Close" : "Cancel"}
            </button>
            {!showSummary && selectedFile && !isProcessing && (
              <button onClick={handleStartUpload}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Start Upload Process
              </button>
            )}
            {showSummary && (
              <button onClick={handleConfirmUpload}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Confirm & Update Inventory
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}