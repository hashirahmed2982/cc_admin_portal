"use client";

import { useState } from "react";
import { Product } from "@/app/products/page";
import { api } from "@/lib/api";

interface ImportProductsModalProps {
  onClose: () => void;
  onComplete: (imported: number) => void;
}

interface ParsedProduct {
  name: string;
  productType: string;
  category: string;
  currency: string;
  // derived / defaulted
  brand: string;
  price: number;
  description: string;
  redemptionInstructions: string;
  images: string[];
}


type Stage = "pick" | "preview" | "importing" | "done";

export default function ImportProductsModal({ onClose, onComplete }: ImportProductsModalProps) {
  const [stage, setStage]                 = useState<Stage>("pick");
  const [selectedFile, setSelectedFile]   = useState<File | null>(null);
  const [parsedRows, setParsedRows]       = useState<ParsedProduct[]>([]);
  const [parseError, setParseError]       = useState<string | null>(null);

  // Importing progress
  const [importTotal, setImportTotal]     = useState(0);
  const [importDone, setImportDone]       = useState(0);
  const [importFailed, setImportFailed]   = useState(0);
  const [importLog, setImportLog]         = useState<{name: string; ok: boolean; msg?: string}[]>([]);

  // ─── Parse: send file to backend, get rows back ───────────────────────────
  const [parsing, setParsing] = useState(false);

  const parseFile = async (file: File) => {
    setParseError(null);
    setParsing(true);
    try {
      const result = await api.importExcelPreview(file);
      if (!result.data?.length) {
        setParseError("No valid product rows found in the file.");
        return;
      }
      setParsedRows(result.data);
      setStage("preview");
    } catch (err: any) {
      setParseError(err.message || "Failed to parse file. Check that it's a valid Excel file.");
    } finally {
      setParsing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls"].includes(ext || "")) {
      setParseError("Please select a valid Excel file (.xlsx or .xls)");
      return;
    }
    setSelectedFile(file);
    parseFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      parseFile(file);
    }
  };

  // ─── Import: send all rows to backend in one call ─────────────────────────
  const startImport = async () => {
    setStage("importing");
    setImportTotal(parsedRows.length);
    setImportDone(0);
    setImportFailed(0);
    setImportLog([]);

    try {
      const result = await api.importBulkProducts(parsedRows);
      const { results } = result.data;

      const log = results.map((r: any) => ({ name: r.name, ok: r.ok, msg: r.error }));
      setImportLog(log);
      setImportDone(result.data.imported);
      setImportFailed(result.data.failed);
    } catch (err: any) {
      setImportFailed(parsedRows.length);
      setImportLog(parsedRows.map(p => ({ name: p.name, ok: false, msg: err.message || "Failed" })));
    }

    setStage("done");
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  const progress = importTotal > 0 ? Math.round(((importDone + importFailed) / importTotal) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Import Products from Excel</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">All imported products will be marked as Internal · Inactive</p>
              </div>
            </div>
            <button onClick={onClose} disabled={stage === "importing"}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-40">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stage breadcrumb */}
          <div className="flex items-center gap-2 mt-4">
            {(["pick", "preview", "importing", "done"] as Stage[]).map((s, i) => {
              const labels = ["Upload File", "Review", "Importing", "Complete"];
              const idx    = ["pick", "preview", "importing", "done"].indexOf(stage);
              const isActive   = stage === s;
              const isDone     = i < idx;
              return (
                <div key={s} className="flex items-center gap-2">
                  {i > 0 && <div className={`h-px w-6 ${isDone || isActive ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"}`} />}
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${
                    isActive ? "text-blue-600 dark:text-blue-400"
                    : isDone  ? "text-gray-500 dark:text-gray-400"
                    : "text-gray-400 dark:text-gray-600"
                  }`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      isDone ? "bg-blue-500 text-white"
                      : isActive ? "bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                    }`}>
                      {isDone ? "✓" : i + 1}
                    </div>
                    <span className="hidden sm:inline">{labels[i]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* ── STAGE: PICK ─────────────────────────────────────────────── */}
          {stage === "pick" && (
            <>
              {/* Column mapping info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">Expected Excel columns:</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  {[
                    { col: "Product Name", note: "Required — product will be skipped if blank" },
                    { col: "Category",     note: "Optional — defaults to empty" },
                    { col: "Product Type", note: "Optional — used as Brand if Brand is absent" },
                    { col: "Currency",     note: "Optional — informational only" },
                    { col: "Brand",        note: "Optional" },
                    { col: "Price",        note: "Optional — defaults to 0" },
                    { col: "Description",  note: "Optional" },
                  ].map(({ col, note }) => (
                    <div key={col} className="flex items-start gap-1.5">
                      <span className="text-xs font-mono bg-blue-100 dark:bg-blue-800/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded mt-0.5">{col}</span>
                      <span className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">{note}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
                  Column names are matched case-insensitively. Extra columns are ignored. Header row is auto-detected.
                </p>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
                  parsing
                    ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10"
                    : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer"
                }`}
                onClick={() => !parsing && document.getElementById("excel-import-input")?.click()}
              >
                <input type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" id="excel-import-input" disabled={parsing} />
                {parsing ? (
                  <>
                    <svg className="w-10 h-10 mx-auto text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="mt-3 text-sm text-blue-600 dark:text-blue-400 font-medium">Parsing file…</p>
                    <p className="text-xs text-blue-500 dark:text-blue-500 mt-1">{selectedFile?.name}</p>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">Drop your Excel file here</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">or click to browse — .xlsx or .xls</p>
                  </>
                )}
              </div>

              {parseError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-700 dark:text-red-300">{parseError}</p>
                </div>
              )}
            </>
          )}

          {/* ── STAGE: PREVIEW ──────────────────────────────────────────── */}
          {stage === "preview" && (
            <>
              {/* Summary bar */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{parsedRows.length}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Products to import</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {[...new Set(parsedRows.map(p => p.category).filter(Boolean))].length}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Unique categories</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {parsedRows.filter(p => p.price === 0).length}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Missing prices (→ $0)</p>
                </div>
              </div>

              {/* Info */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-4 py-3 flex gap-3">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  All products will be created as <strong>Internal · Inactive</strong>. You can activate them individually once inventory codes are uploaded.
                </p>
              </div>

              {/* Preview table */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                      <tr>
                        {["#", "Product Name", "Category", "Brand / Type", "Price", "Currency"].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {parsedRows.map((p, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-3 py-2 text-gray-400 dark:text-gray-500 text-xs">{i + 1}</td>
                          <td className="px-3 py-2 text-gray-900 dark:text-white font-medium max-w-[260px] truncate" title={p.name}>{p.name}</td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                            {p.category || <span className="text-gray-300 dark:text-gray-600 italic">—</span>}
                          </td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                            {p.brand || p.productType || <span className="text-gray-300 dark:text-gray-600 italic">—</span>}
                          </td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                            {p.price === 0
                              ? <span className="text-amber-500">$0</span>
                              : `$${p.price}`
                            }
                          </td>
                          <td className="px-3 py-2 text-gray-500 dark:text-gray-400 text-xs">{p.currency || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── STAGE: IMPORTING ────────────────────────────────────────── */}
          {stage === "importing" && (
            <div className="space-y-5">
              <div className="text-center py-2">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  Importing {importDone + importFailed} of {importTotal}…
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please keep this window open</p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{importDone} imported · {importFailed} failed</span>
                <span>{progress}%</span>
              </div>

              {/* Live log */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-52 overflow-y-auto">
                <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-700">
                  {importLog.slice(-50).map((entry, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5">
                      {entry.ok
                        ? <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        : <svg className="w-3.5 h-3.5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                      }
                      <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{entry.name}</span>
                      {entry.msg && <span className="text-xs text-red-500 ml-auto flex-shrink-0">{entry.msg}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STAGE: DONE ─────────────────────────────────────────────── */}
          {stage === "done" && (
            <div className="space-y-5">
              <div className={`rounded-xl p-5 text-center ${importFailed === 0 ? "bg-green-50 dark:bg-green-900/20" : "bg-amber-50 dark:bg-amber-900/20"}`}>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${importFailed === 0 ? "bg-green-100 dark:bg-green-900/40" : "bg-amber-100 dark:bg-amber-900/40"}`}>
                  {importFailed === 0
                    ? <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    : <svg className="w-7 h-7 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  }
                </div>
                <p className={`text-xl font-bold ${importFailed === 0 ? "text-green-700 dark:text-green-300" : "text-amber-700 dark:text-amber-300"}`}>
                  {importFailed === 0 ? "Import Complete!" : "Import Finished with Errors"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  <strong className="text-green-600 dark:text-green-400">{importDone}</strong> products imported successfully
                  {importFailed > 0 && <>, <strong className="text-red-600 dark:text-red-400">{importFailed}</strong> failed</>}
                </p>
              </div>

              {/* Failed items */}
              {importFailed > 0 && (
                <div className="border border-red-200 dark:border-red-800 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20">
                    <p className="text-xs font-medium text-red-700 dark:text-red-300">Failed imports:</p>
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y divide-red-100 dark:divide-red-900/30">
                    {importLog.filter(e => !e.ok).map((entry, i) => (
                      <div key={i} className="flex items-start gap-2 px-3 py-2">
                        <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">{entry.name}</span>
                        <span className="text-xs text-red-600 dark:text-red-400 flex-shrink-0">{entry.msg}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg px-4 py-3">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  All imported products are <strong>Inactive</strong>. Upload codes to each product then activate them when ready to sell.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {stage === "preview" && `${parsedRows.length} products ready`}
              {stage === "importing" && `${importDone + importFailed} / ${importTotal} processed`}
              {stage === "done" && `${importDone} imported · ${importFailed} failed`}
            </div>
            <div className="flex gap-3">
              {stage === "pick" && (
                <button onClick={onClose}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Cancel
                </button>
              )}
              {stage === "preview" && (
                <>
                  <button onClick={() => { setStage("pick"); setParsedRows([]); }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Back
                  </button>
                  <button onClick={startImport}
                    className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    Import {parsedRows.length} Products
                  </button>
                </>
              )}
              {stage === "importing" && (
                <span className="text-sm text-gray-500 dark:text-gray-400 italic">Please wait…</span>
              )}
              {stage === "done" && (
                <button onClick={() => { onComplete(importDone); onClose(); }}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Close & View Products
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}