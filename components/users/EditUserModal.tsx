"use client";

import { useState } from "react";
import { User } from "@/app/users/page";

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSubmit: (userData: any) => void;
}

export default function EditUserModal({ user, onClose, onSubmit }: EditUserModalProps) {
  const isB2B = user.user_type === "b2b_client";

  const [formData, setFormData] = useState({
    name:         user.name,
    email:        user.email,
    company:      user.company,
    zip_password: "",           // blank = no change; filled = update
  });
  const [showZipPass, setShowZipPass] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      name:    formData.name,
      email:   formData.email,
      company: formData.company,
    };
    // Only send zip_password if the admin actually typed something
    if (isB2B && formData.zip_password.trim()) {
      payload.zip_password = formData.zip_password.trim();
    }
    onSubmit(payload);
  };

  const inputClass = "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">

        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Edit User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name
            </label>
            <input type="text" name="name" value={formData.name}
              onChange={handleChange} className={inputClass} required />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input type="email" name="email" value={formData.email}
              onChange={handleChange} className={inputClass} required />
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company Name
            </label>
            <input type="text" name="company" value={formData.company}
              onChange={handleChange} className={inputClass} />
          </div>

          {/* ZIP Password — only for B2B clients */}
          {isB2B && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ZIP Password
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Leave blank to keep the existing ZIP password. Enter a new value to update it.
              </p>
              <div className="relative">
                <input
                  type={showZipPass ? "text" : "password"}
                  name="zip_password"
                  value={formData.zip_password}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Enter new ZIP password or leave blank"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowZipPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  tabIndex={-1}
                >
                  {showZipPass ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                If updated, inform the client — this is the password they use to open their code ZIP files.
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Save Changes
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}