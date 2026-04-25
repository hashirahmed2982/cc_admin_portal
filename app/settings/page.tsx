"use client";

import Dashboard from "@/components/Dashboard";
import { useState } from "react";

export default function SettingsPage() {
  // Authentication & Security
  const [requireMfaForWithdrawals, setRequireMfaForWithdrawals] = useState(true);
  const [requireMfaForAdminLogin, setRequireMfaForAdminLogin] = useState(true);
  
  // User Management
  const [autoApproveB2BClients, setAutoApproveB2BClients] = useState(false);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  
  // Wallet & Finance
  const [autoSettleBlockedWallets, setAutoSettleBlockedWallets] = useState(false);
  const [minTopupAmount, setMinTopupAmount] = useState(10);
  
  // Product & Inventory
  const [trimImportedData, setTrimImportedData] = useState(true);
  const [defaultProductStatus, setDefaultProductStatus] = useState("inactive");

  const handleSave = () => {
    // Logic to save settings to backend would go here
    alert("Admin settings updated successfully!");
  };

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

  return (
    <Dashboard>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Portal Settings</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Configure system-wide behaviors and security policies.</p>
        </div>

        {/* Security Section */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="font-semibold text-gray-900 dark:text-white">Authentication & Security</h3>
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
          </div>
        </section>

        {/* User Management Section */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="font-semibold text-gray-900 dark:text-white">User Management</h3>
          </div>
          <div className="p-6 space-y-6">
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
        </section>

        {/* Wallet Section */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="font-semibold text-gray-900 dark:text-white">Wallet & Finance</h3>
          </div>
          <div className="p-6 space-y-6">
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
        </section>

        {/* Product Section */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="font-semibold text-gray-900 dark:text-white">Product & Inventory</h3>
          </div>
          <div className="p-6 space-y-6">
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
        </section>

        <div className="pt-4 flex justify-end">
          <button 
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
          >
            Save Admin Preferences
          </button>
        </div>
      </div>
    </Dashboard>
  );
}
