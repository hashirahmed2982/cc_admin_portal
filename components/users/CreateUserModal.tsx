"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface CreateUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
  currentUserType: "super_admin" | "admin";
}

export default function CreateUserModal({ onClose, onSuccess, currentUserType }: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    user_type: "b2b_client" as "admin" | "b2b_client",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Only super_admin can create admin accounts
  const canCreateAdmin = currentUserType === "super_admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
    if (formData.user_type === "b2b_client" && !formData.company.trim())
      newErrors.company = "Company is required for B2B clients";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password))
      newErrors.password = "Password must contain uppercase, lowercase, and number";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    try {
      await api.createUser({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        company: formData.user_type === "b2b_client" ? formData.company : undefined,
        user_type: formData.user_type,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrors({ submit: err.message || "Failed to create user" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Account</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Submit error */}
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-300">{errors.submit}</p>
            </div>
          )}

          {/* Account Type */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Account Type</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* B2B Client option */}
              <label className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                formData.user_type === "b2b_client"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-300 dark:border-gray-600 hover:border-blue-300"
              }`}>
                <div className="flex items-start gap-3">
                  <input
                    type="radio" name="user_type" value="b2b_client"
                    checked={formData.user_type === "b2b_client"}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">B2B Client</div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Client portal access with wallet</p>
                  </div>
                </div>
              </label>

              {/* Admin option — only selectable by super_admin */}
              <label className={`relative flex flex-col p-4 border-2 rounded-lg transition-all ${
                !canCreateAdmin
                  ? "opacity-40 cursor-not-allowed border-gray-200 dark:border-gray-700"
                  : formData.user_type === "admin"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 cursor-pointer"
                    : "border-gray-300 dark:border-gray-600 hover:border-blue-300 cursor-pointer"
              }`}>
                <div className="flex items-start gap-3">
                  <input
                    type="radio" name="user_type" value="admin"
                    checked={formData.user_type === "admin"}
                    onChange={handleChange}
                    disabled={!canCreateAdmin}
                    className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">Admin</span>
                      {!canCreateAdmin && (
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded">
                          Super Admin only
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Full admin portal access</p>
                  </div>
                </div>
              </label>
            </div>

            {/* Wallet note for b2b_client */}
            {formData.user_type === "b2b_client" && (
              <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium">Automatic Wallet Creation</p>
                    <p className="mt-1">A wallet will be automatically created for this user with an initial balance of $0.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Personal Information */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name *</label>
                <input
                  type="text" name="name" value={formData.name} onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                  placeholder="John Smith"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address *</label>
                <input
                  type="email" name="email" value={formData.email} onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                  placeholder="john@company.com"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
              </div>
            </div>
          </div>

          {/* Company — only for b2b_client */}
          {formData.user_type === "b2b_client" && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Company Information</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Name *</label>
                <input
                  type="text" name="company" value={formData.company} onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.company ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                  placeholder="Acme Corporation"
                />
                {errors.company && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.company}</p>}
              </div>
            </div>
          )}

          {/* Security */}
          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Security</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password *</label>
                <input
                  type="password" name="password" value={formData.password} onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                  placeholder="Minimum 8 characters"
                />
                {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm Password *</label>
                <input
                  type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                  placeholder="Re-enter password"
                />
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Creating..." : `Create ${formData.user_type === "admin" ? "Admin" : "B2B Client"} Account`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}