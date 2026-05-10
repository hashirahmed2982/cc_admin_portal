"use client";

import { useState } from "react";
import { User } from "@/app/users/page";

interface ResetPasswordModalProps {
  user: User;
  onClose: () => void;
  onSubmit: (password: string, sendEmail: boolean) => void;
}

type Mode = "choose" | "generate" | "manual";

export default function ResetPasswordModal({
  user,
  onClose,
  onSubmit,
}: ResetPasswordModalProps) {
  const [mode,            setMode]            = useState<Mode>("choose");
  const [generatedPass,   setGeneratedPass]   = useState("");
  const [copied,          setCopied]          = useState(false);
  const [manualPass,      setManualPass]      = useState("");
  const [confirmPass,     setConfirmPass]     = useState("");
  const [showManual,      setShowManual]      = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [error,           setError]           = useState("");

  // ─── Generate ─────────────────────────────────────────────────────────────

  const generatePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setGeneratedPass(password);
    setCopied(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPass);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for browsers that block clipboard
      const el = document.createElement("textarea");
      el.value = generatedPass;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "generate") {
      onSubmit(generatedPass, true);
      return;
    }

    if (mode === "manual") {
      if (!manualPass)                        { setError("Password is required"); return; }
      if (manualPass.length < 8)              { setError("Minimum 8 characters"); return; }
      if (!/(?=.*[A-Z])/.test(manualPass))    { setError("Must contain an uppercase letter"); return; }
      if (!/(?=.*[a-z])/.test(manualPass))    { setError("Must contain a lowercase letter"); return; }
      if (!/(?=.*\d)/.test(manualPass))       { setError("Must contain a number"); return; }
      if (manualPass !== confirmPass)          { setError("Passwords do not match"); return; }
      onSubmit(manualPass, false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Reset Password</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

            {/* User info */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium flex-shrink-0">
                  {user.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Mode selection */}
            {mode === "choose" && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  How would you like to reset the password?
                </p>

                <button type="button"
                  onClick={() => { setMode("generate"); generatePassword(); }}
                  className="w-full flex items-start gap-4 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Auto-generate & email</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      Generate a secure random password and send it directly to the user's email address.
                    </p>
                  </div>
                </button>

                <button type="button"
                  onClick={() => setMode("manual")}
                  className="w-full flex items-start gap-4 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Set manually</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      Set a specific password yourself. Copy and share it with the user via SMS, WhatsApp, or any other channel.
                    </p>
                  </div>
                </button>
              </div>
            )}

            {/* ── Generate mode ──────────────────────────────────────────── */}
            {mode === "generate" && (
              <div className="space-y-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    A secure password has been generated. It will be sent to <strong>{user.email}</strong> when you confirm.
                  </p>
                </div>

                {/* Generated password display */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Generated Password
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={generatedPass}
                        readOnly
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                      />
                    </div>
                    <button type="button" onClick={handleCopy}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 flex-shrink-0 ${
                        copied
                          ? "bg-green-600 text-white"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}>
                      {copied ? (
                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Copied</>
                      ) : (
                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>Copy</>
                      )}
                    </button>
                    <button type="button" onClick={generatePassword}
                      className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex-shrink-0"
                      title="Generate new">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                </div>

                <button type="button" onClick={() => { setMode("choose"); setGeneratedPass(""); }}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline">
                  ← Back to options
                </button>
              </div>
            )}

            {/* ── Manual mode ────────────────────────────────────────────── */}
            {mode === "manual" && (
              <div className="space-y-3">
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Set the password below, then share it with the user yourself via SMS, WhatsApp, email, or any other channel.
                  </p>
                </div>

                {/* New password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showManual ? "text" : "password"}
                      value={manualPass}
                      onChange={e => { setManualPass(e.target.value); setError(""); }}
                      className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Min 8 chars, upper, lower, number"
                    />
                    <button type="button" onClick={() => setShowManual(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showManual
                        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      }
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPass}
                      onChange={e => { setConfirmPass(e.target.value); setError(""); }}
                      className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Re-enter password"
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirm
                        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      }
                    </button>
                  </div>
                </div>

                {/* Live requirements */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-1">
                  {[
                    { rule: /.{8,}/,        label: "At least 8 characters" },
                    { rule: /(?=.*[A-Z])/, label: "One uppercase letter" },
                    { rule: /(?=.*[a-z])/, label: "One lowercase letter" },
                    { rule: /(?=.*\d)/,    label: "One number" },
                  ].map(({ rule, label }) => {
                    const met = rule.test(manualPass);
                    return (
                      <div key={label} className="flex items-center gap-2">
                        <svg className={`w-3.5 h-3.5 ${met ? "text-green-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={met ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                        </svg>
                        <span className={`text-xs ${met ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}>{label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Copy manual password */}
                {manualPass && manualPass === confirmPass && (
                  <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p className="text-sm text-green-700 dark:text-green-300 flex-1">Passwords match — ready to save</p>
                    <button type="button" onClick={async () => {
                        await navigator.clipboard.writeText(manualPass);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="text-xs text-green-700 dark:text-green-300 underline">
                      {copied ? "Copied!" : "Copy password"}
                    </button>
                  </div>
                )}

                <button type="button" onClick={() => { setMode("choose"); setManualPass(""); setConfirmPass(""); setError(""); }}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline">
                  ← Back to options
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            {mode !== "choose" && (
              <button type="submit"
                disabled={mode === "generate" ? !generatedPass : (!manualPass || manualPass !== confirmPass)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {mode === "generate" ? "Send via Email" : "Save Password"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}