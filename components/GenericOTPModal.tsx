"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface GenericOTPModalProps {
  title?: string;
  description?: string;
  actionType: string; // The action type identifier for the backend (e.g., 'wallet_topup_action', 'report_generation_action')
  details?: React.ReactNode; // Optional custom UI to show details about the action being authorized
  confirmButtonText?: string;
  onVerified: (otp: string) => void;
  onClose: () => void;
}

export default function GenericOTPModal({
  title = "MFA Verification Required",
  description = "Enter the 6-digit code sent to your registered email address.",
  actionType,
  details,
  confirmButtonText = "Verify & Continue",
  onVerified,
  onClose,
}: GenericOTPModalProps) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);

  useEffect(() => {
    const sendOtpRequest = async () => {
      setRequestingOtp(true);
      setError("");
      try {
        await api.requestOTP(actionType);
        setOtpSent(true);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to request OTP.";
        setError(msg);
        console.error("Error requesting OTP:", err);
      } finally {
        setRequestingOtp(false);
      }
    };

    sendOtpRequest();
  }, [actionType]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Please enter a 6-digit OTP code");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      await api.verifyOTP(actionType, otp);
      onVerified(otp);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid OTP code. Please try again.";
      setError(msg);
      console.error("Error verifying OTP:", err);
      setIsVerifying(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && otp.length === 6 && !isVerifying && otpSent) {
      handleVerify();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            disabled={isVerifying || requestingOtp}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Action Details (optional) */}
          {details && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl p-4">
              {details}
            </div>
          )}

          <p className="text-sm text-gray-600 dark:text-gray-400 text-center px-2">
            {description}
          </p>

          {/* OTP Input Section */}
          {requestingOtp ? (
            <div className="text-center py-8">
              <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                Requesting secure code...
              </p>
            </div>
          ) : !otpSent ? (
            <div className="text-center py-6">
               <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
               </div>
              <p className="text-sm text-red-600 dark:text-red-400">
                {error || "Unable to send OTP. Please try again later."}
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 text-xs text-blue-600 hover:underline"
              >
                Reload page
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ""));
                    setError("");
                  }}
                  onKeyPress={handleKeyPress}
                  className="w-full max-w-[240px] px-4 py-3 text-center text-3xl tracking-[0.5em] font-mono border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all"
                  placeholder="000000"
                  disabled={isVerifying}
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-lg p-3">
                  <p className="text-xs text-red-700 dark:text-red-300 text-center font-medium">
                    {error}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 justify-center text-xs text-green-600 dark:text-green-400 font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Code has been sent to your email
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 dark:border-gray-700 px-6 py-4 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isVerifying || requestingOtp}
            className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            disabled={!otpSent || otp.length !== 6 || isVerifying || requestingOtp}
            className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:scale-95"
          >
            {isVerifying ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verifying...
              </span>
            ) : (
              confirmButtonText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
