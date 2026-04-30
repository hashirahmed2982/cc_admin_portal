"use client";

import Dashboard from "@/components/Dashboard";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";

const Toggle = ({ enabled, setEnabled }: { enabled: boolean; setEnabled: (v: boolean) => void }) => (
  <button
    onClick={() => setEnabled(!enabled)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
      enabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        enabled ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

export default function SettingsPage() {
  const { user } = useAuth();

  // Personal Info
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  // Authentication & Security
  const [requireMfaForWithdrawals, setRequireMfaForWithdrawals] = useState(true);
  const [requireMfaForAdminLogin, setRequireMfaForAdminLogin] = useState(true);

  // OTP Verification Modal State
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // User Management
  const [autoApproveB2BClients, setAutoApproveB2BClients] = useState(false);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);

  // Wallet & Finance
  const [autoSettleBlockedWallets, setAutoSettleBlockedWallets] = useState(false);
  const [minTopupAmount, setMinTopupAmount] = useState(10);

  // Product & Inventory
  const [trimImportedData, setTrimImportedData] = useState(true);
  const [defaultProductStatus, setDefaultProductStatus] = useState("inactive");

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleSavePersonalInfo = () => {
    // Logic to update user personal info would go here
    alert("Personal information updated successfully!");
  };

  const handleOpenOtpModal = () => {
    if (!newPassword || !confirmPassword) {
      alert("Please fill in both password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    setIsOtpModalOpen(true);
  };

  const handleVerifyOtp = () => {
    if (otp.length === 6) {
      // Logic to verify OTP and change password would go here
      alert("Password changed successfully!");
      setIsOtpModalOpen(false);
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      alert("Please enter a valid 6-digit OTP.");
    }
  };

  const handleSaveAdminSettings = () => {
    // Logic to save admin settings to backend would go here
    alert("Admin settings updated successfully!");
  };

  return (
    <Dashboard>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account and system-wide configurations.</p>
        </div>

        {/* Personal Information Section */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="font-semibold text-gray-900 dark:text-white">Personal Information</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSavePersonalInfo}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update Personal Info
              </button>
            </div>
          </div>
        </section>

        {/* Password Security Section */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="font-semibold text-gray-900 dark:text-white">Account Security</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleOpenOtpModal}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Change Password
              </button>
            </div>
          </div>
        </section>

        {/* Admin Settings Section (Existing) */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="font-semibold text-gray-900 dark:text-white">Admin & System Policies</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Enforce MFA for Admin Login</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">All administrative accounts must use 2FA to access the portal.</p>
              </div>
              <Toggle enabled={requireMfaForAdminLogin} setEnabled={setRequireMfaForAdminLogin} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Require MFA for Wallet Operations</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sensitive actions like top-up approvals will require a secondary code.</p>
              </div>
              <Toggle enabled={requireMfaForWithdrawals} setEnabled={setRequireMfaForWithdrawals} />
            </div>
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">User Management</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Auto-approve B2B Clients</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">New client registrations are automatically set to active status.</p>
                  </div>
                  <Toggle enabled={autoApproveB2BClients} setEnabled={setAutoApproveB2BClients} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Send Welcome Emails</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Automatically email login credentials to newly created users.</p>
                  </div>
                  <Toggle enabled={sendWelcomeEmail} setEnabled={setSendWelcomeEmail} />
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Wallet & Finance</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Auto-settle Blocked Wallets</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Automatically process wallet settlements when a user is permanently blocked.</p>
                  </div>
                  <Toggle enabled={autoSettleBlockedWallets} setEnabled={setAutoSettleBlockedWallets} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Minimum Top-up Amount ($)</label>
                  <input
                    type="number"
                    value={minTopupAmount}
                    onChange={(e) => setMinTopupAmount(Number(e.target.value))}
                    className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Product & Inventory</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Auto-trim Excel Data</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Trim whitespace and truncate long strings during bulk Excel imports.</p>
                  </div>
                  <Toggle enabled={trimImportedData} setEnabled={setTrimImportedData} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Default Status for New Products</label>
                  <div className="flex gap-4">
                    {["active", "inactive"].map((status) => (
                      <label key={status} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="productStatus"
                          value={status}
                          checked={defaultProductStatus === status}
                          onChange={(e) => setDefaultProductStatus(e.target.value)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              onClick={handleSaveAdminSettings}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
            >
              Save Admin Preferences
            </button>
          </div>
        </section>
      </div>

      {/* OTP Modal */}
      {isOtpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Verify OTP</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              A 6-digit verification code has been sent to your email. Please enter it below to confirm your password change.
            </p>
            <div className="space-y-4">
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                className="w-full text-center text-2xl tracking-widest px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsOtpModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyOtp}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Confirm Change
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Dashboard>
  );
}
