"use client";

import { useState } from "react";
import { Product } from "@/app/products/page";

interface UploadCodesModalProps {
  product: Product;
  onClose: () => void;
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

export default function UploadCodesModal({
  product,
  onClose,
  onSubmit,
}: UploadCodesModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(null);

  const [steps, setSteps] = useState<UploadStep[]>([
    { name: "Validate file format", status: "pending" },
    { name: "Parse codes from Excel", status: "pending" },
    { name: "Check for duplicates", status: "pending" },
    { name: "Encrypt codes", status: "pending" },
    { name: "Insert to database", status: "pending" },
    { name: "Update inventory counts", status: "pending" },
    { name: "Generate upload summary", status: "pending" },
    { name: "Log audit trail", status: "pending" },
  ]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      if (fileExtension !== "xlsx" && fileExtension !== "xls") {
        alert("Please select a valid Excel file (.xlsx or .xls)");
        return;
      }
      setSelectedFile(file);
      setShowSummary(false);
      resetSteps();
    }
  };

  const resetSteps = () => {
    setSteps(
      steps.map((step) => ({ ...step, status: "pending" as const, message: undefined }))
    );
  };

  const updateStep = (
    index: number,
    status: "processing" | "complete" | "error",
    message?: string
  ) => {
    setSteps((prev) =>
      prev.map((step, i) =>
        i === index ? { ...step, status, message } : step
      )
    );
  };

  const simulateUploadProcess = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    const startTime = Date.now();

    try {
      // Step 1: Validate file format
      updateStep(0, "processing");
      await new Promise((resolve) => setTimeout(resolve, 500));
      updateStep(0, "complete", "Excel file format validated successfully");

      // Step 2: Parse codes
      updateStep(1, "processing");
      await new Promise((resolve) => setTimeout(resolve, 800));
      const totalRows = Math.floor(Math.random() * 500) + 100;
      updateStep(1, "complete", `Parsed ${totalRows} rows from Excel file`);

      // Step 3: Check for duplicates
      updateStep(2, "processing");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const duplicates = Math.floor(totalRows * 0.02); // 2% duplicates
      updateStep(
        2,
        "complete",
        `Found ${duplicates} duplicate codes (will be skipped)`
      );

      // Step 4: Encrypt codes
      updateStep(3, "processing");
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const validCodes = totalRows - duplicates;
      updateStep(3, "complete", `Encrypted ${validCodes} unique codes`);

      // Step 5: Insert to database
      updateStep(4, "processing");
      await new Promise((resolve) => setTimeout(resolve, 1500));
      updateStep(4, "complete", `Inserted ${validCodes} codes to digital_codes table`);

      // Step 6: Update inventory
      updateStep(5, "processing");
      await new Promise((resolve) => setTimeout(resolve, 600));
      updateStep(
        5,
        "complete",
        `Updated inventory: +${validCodes} codes for ${product.name}`
      );

      // Step 7: Generate summary
      updateStep(6, "processing");
      await new Promise((resolve) => setTimeout(resolve, 400));
      const processingTime = (Date.now() - startTime) / 1000;
      const summary: UploadSummary = {
        fileName: selectedFile.name,
        totalRows,
        validCodes,
        duplicates,
        invalidCodes: 0,
        uploadedCodes: validCodes,
        processingTime,
      };
      setUploadSummary(summary);
      updateStep(6, "complete", "Upload summary generated");

      // Step 8: Log audit trail
      updateStep(7, "processing");
      await new Promise((resolve) => setTimeout(resolve, 300));
      updateStep(
        7,
        "complete",
        `Audit log created: Upload by Admin at ${new Date().toLocaleString()}`
      );

      setShowSummary(true);
    } catch (error) {
      console.error("Upload error:", error);
      // Find the first processing step and mark it as error
      const processingIndex = steps.findIndex((s) => s.status === "processing");
      if (processingIndex !== -1) {
        updateStep(processingIndex, "error", "An error occurred during processing");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmUpload = () => {
    if (uploadSummary) {
      onSubmit(product.id, {
        codesCount: uploadSummary.validCodes,
        fileName: uploadSummary.fileName,
        summary: uploadSummary,
      });
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case "complete":
        return (
          <svg
            className="w-5 h-5 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "processing":
        return (
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        );
      case "error":
        return (
          <svg
            className="w-5 h-5 text-red-600 dark:text-red-400"
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
        );
      default:
        return (
          <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-full"></div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Upload Product Codes
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {product.name}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
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

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Product Info */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Current Stock</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {product.availableCodes} / {product.totalCodes}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Product ID</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {product.id}
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          {!selectedFile && !showSummary && (
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
                  <p className="font-medium">Excel File Requirements:</p>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>File format: .xlsx or .xls</li>
                    <li>Column A should contain the product codes (one per row)</li>
                    <li>No headers required (will be skipped automatically)</li>
                    <li>Duplicate codes will be automatically detected and skipped</li>
                    <li>All codes will be encrypted before storage</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* File Upload */}
          {!showSummary && (
            <div>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="excel-upload"
                disabled={isProcessing}
              />
              <label
                htmlFor="excel-upload"
                className={`block border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isProcessing
                    ? "border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed"
                    : "border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400"
                }`}
              >
                <svg
                  className="w-12 h-12 mx-auto text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {selectedFile ? selectedFile.name : "Click to select Excel file"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  .xlsx or .xls up to 10MB
                </p>
              </label>
            </div>
          )}

          {/* Processing Steps */}
          {selectedFile && !showSummary && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Processing Steps:
              </h4>
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      step.status === "processing"
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : step.status === "complete"
                        ? "bg-green-50 dark:bg-green-900/20"
                        : step.status === "error"
                        ? "bg-red-50 dark:bg-red-900/20"
                        : "bg-gray-50 dark:bg-gray-700/50"
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getStepIcon(step.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          step.status === "complete"
                            ? "text-green-900 dark:text-green-100"
                            : step.status === "processing"
                            ? "text-blue-900 dark:text-blue-100"
                            : step.status === "error"
                            ? "text-red-900 dark:text-red-100"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {index + 1}. {step.name}
                      </p>
                      {step.message && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {step.message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Summary */}
          {showSummary && uploadSummary && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg
                    className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0"
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
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      Upload Completed Successfully!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      All codes have been processed and added to inventory
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Upload Summary
                  </h4>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      File Name:
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {uploadSummary.fileName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Total Rows:
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {uploadSummary.totalRows}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Valid Codes:
                    </span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {uploadSummary.validCodes}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Duplicates Skipped:
                    </span>
                    <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                      {uploadSummary.duplicates}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Invalid Codes:
                    </span>
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      {uploadSummary.invalidCodes}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Successfully Uploaded:
                    </span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {uploadSummary.uploadedCodes} codes
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Processing Time:
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {uploadSummary.processingTime.toFixed(2)}s
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {showSummary ? "Close" : "Cancel"}
            </button>
            {!showSummary && selectedFile && !isProcessing && (
              <button
                onClick={simulateUploadProcess}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Upload Process
              </button>
            )}
            {showSummary && (
              <button
                onClick={handleConfirmUpload}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Confirm & Update Inventory
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
