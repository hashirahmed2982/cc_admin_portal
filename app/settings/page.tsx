"use client";

import Dashboard from "@/components/Dashboard";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import GenericOTPModal from "@/components/GenericOTPModal";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const { user, setUser } = useAuth();

  // ─── Personal info ────────────────────────────────────────────────────────
  const [fullName,       setFullName]       = useState("");
  const [email,          setEmail]          = useState("");
  const [infoLoading,    setInfoLoading]    = useState(false);
  const [infoSuccess,    setInfoSuccess]    = useState(false);
  const [infoError,      setInfoError]      = useState<string | null>(null);

  // ─── Password change ──────────────────────────────────────────────────────
  const [currentPassword,  setCurrentPassword]  = useState("");
  const [newPassword,      setNewPassword]      = useState("");
  const [confirmPassword,  setConfirmPassword]  = useState("");
  const [pwdError,         setPwdError]         = useState<string | null>(null);

  // ─── OTP modal ────────────────────────────────────────────────────────────
  const [showOTPModal,   setShowOTPModal]   = useState(false);
  const [otpActionType,  setOtpActionType]  = useState<"change_password" | "update_profile">("change_password");
  const [pendingAction,  setPendingAction]  = useState<(() => Promise<void>) | null>(null);
  const [actionSuccess,  setActionSuccess]  = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  // ─── Initiate personal info update ────────────────────────────────────────
  const handleInitiateInfoUpdate = () => {
    setInfoError(null);
    setActionSuccess(null);
    if (!fullName.trim()) { setInfoError("Full name is required"); return; }
    if (!email.trim())    { setInfoError("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setInfoError("Enter a valid email address"); return; }

    const emailChanged = email.trim() !== (user?.email || "");

    setPendingAction(() => async () => {
      await api.updateProfile({ name: fullName, email: email.trim() });

      if (emailChanged) {
        // Email changed — must re-login with new email
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/login?reason=email_changed";
        return;
      }

      // Name only changed — update localStorage
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.full_name = fullName;
        localStorage.setItem("user", JSON.stringify(parsed));
        if (setUser) setUser(parsed);
      }
      setActionSuccess("Personal information updated successfully");
    });
    setOtpActionType("update_profile");
    setShowOTPModal(true);
  };

  // ─── Initiate password change ──────────────────────────────────────────────
  const handleInitiatePasswordChange = () => {
    setPwdError(null);
    setActionSuccess(null);

    if (!currentPassword)                         { setPwdError("Current password is required"); return; }
    if (!newPassword)                             { setPwdError("New password is required"); return; }
    if (newPassword.length < 8)                   { setPwdError("Password must be at least 8 characters"); return; }
    if (!/(?=.*[A-Z])/.test(newPassword))         { setPwdError("Must contain an uppercase letter"); return; }
    if (!/(?=.*[a-z])/.test(newPassword))         { setPwdError("Must contain a lowercase letter"); return; }
    if (!/(?=.*\d)/.test(newPassword))            { setPwdError("Must contain a number"); return; }
    if (newPassword === currentPassword)          { setPwdError("New password must differ from current"); return; }
    if (newPassword !== confirmPassword)          { setPwdError("Passwords do not match"); return; }

    setPendingAction(() => async () => {
      await api.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // Clear must_change_password flag in localStorage
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.must_change_password = false;
        localStorage.setItem("user", JSON.stringify(parsed));
      }
      setActionSuccess("Password changed successfully");
    });
    setOtpActionType("change_password");
    setShowOTPModal(true);
  };

  // ─── OTP verified — execute the pending action ────────────────────────────
  const handleOTPVerified = async (_otp: string) => {
    if (!pendingAction) return;
    try {
      await pendingAction();
    } catch (err: any) {
      setInfoError(err.message || "Action failed");
    } finally {
      setShowOTPModal(false);
      setPendingAction(null);
    }
  };

  // ─── Password strength indicator ──────────────────────────────────────────
  const pwdRules = [
    { rule: /.{8,}/,        label: "At least 8 characters" },
    { rule: /(?=.*[A-Z])/, label: "One uppercase letter" },
    { rule: /(?=.*[a-z])/, label: "One lowercase letter" },
    { rule: /(?=.*\d)/,    label: "One number" },
  ];

  return (
    <Dashboard>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account preferences and security.</p>
        </div>

        {/* Global success */}
        {actionSuccess && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-sm font-medium text-green-800 dark:text-green-300">{actionSuccess}</p>
            </div>
            <button onClick={() => setActionSuccess(null)} className="text-green-500 text-lg leading-none">×</button>
          </div>
        )}

        {/* ── Personal Information ─────────────────────────────────────────── */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="font-semibold text-gray-900 dark:text-white">Personal Information</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Requires OTP verification to save</p>
          </div>
          <div className="p-6 space-y-4">
            {infoError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-700 dark:text-red-300">{infoError}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setInfoError(null); }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"/>
                {email.trim() !== (user?.email || "") && email.trim() !== "" && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Changing email will log you out — you must sign in again with the new email
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={handleInitiateInfoUpdate} disabled={infoLoading}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                {infoLoading && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                )}
                Save Changes
              </button>
            </div>
          </div>
        </section>

        {/* ── Account Security ─────────────────────────────────────────────── */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="font-semibold text-gray-900 dark:text-white">Account Security</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Requires OTP verification to change password</p>
          </div>
          <div className="p-6 space-y-4">
            {pwdError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-700 dark:text-red-300">{pwdError}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
              <input type="password" value={currentPassword} onChange={e => { setCurrentPassword(e.target.value); setPwdError(null); }}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"/>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                <input type="password" value={newPassword} onChange={e => { setNewPassword(e.target.value); setPwdError(null); }}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setPwdError(null); }}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"/>
              </div>
            </div>

            {/* Live password strength */}
            {newPassword && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-1.5">
                {pwdRules.map(({ rule, label }) => {
                  const met = rule.test(newPassword);
                  return (
                    <div key={label} className="flex items-center gap-2">
                      <svg className={`w-3.5 h-3.5 flex-shrink-0 ${met ? "text-green-500" : "text-gray-400"}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3}
                          d={met ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"}/>
                      </svg>
                      <span className={`text-xs ${met ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end">
              <button onClick={handleInitiatePasswordChange}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                Change Password
              </button>
            </div>
          </div>
        </section>

        {/* ── Account Info (read-only) ─────────────────────────────────────── */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="font-semibold text-gray-900 dark:text-white">Account Details</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Role</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 capitalize">
                {user?.user_type?.replace("_", " ") || "—"}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Email</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 truncate">{user?.email || "—"}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">User ID</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 font-mono">{user?.user_id || "—"}</p>
            </div>
          </div>
        </section>

      </div>

      {/* OTP Modal — same GenericOTPModal used across all modules */}
      {showOTPModal && (
        <GenericOTPModal
          title={otpActionType === "change_password" ? "Verify Password Change" : "Verify Profile Update"}
          description="A verification code has been sent to your registered email address."
          actionType={otpActionType}
          confirmButtonText="Verify & Save"
          details={
            <div className="space-y-1 text-sm">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Action</p>
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {otpActionType === "change_password" ? "Change Account Password" : "Update Profile Information"}
              </p>
              <div className="pt-2">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Account</p>
                <p className="text-sm text-gray-900 dark:text-white">{user?.email}</p>
              </div>
              {otpActionType === "update_profile" && email.trim() !== (user?.email || "") && (
                <div className="pt-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded p-2 mt-2">
                  <p className="text-xs text-orange-700 dark:text-orange-300 font-medium">
                    ⚠ Email will change to: {email.trim()}
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
                    You will be logged out after this change.
                  </p>
                </div>
              )}
            </div>
          }
          onVerified={handleOTPVerified}
          onClose={() => { setShowOTPModal(false); setPendingAction(null); }}
        />
      )}
    </Dashboard>
  );
}