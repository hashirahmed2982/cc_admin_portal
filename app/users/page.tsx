"use client";

import Dashboard from "@/components/Dashboard";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import UserTable from "@/components/users/UserTable";
import CreateUserModal from "@/components/users/CreateUserModal";
import EditUserModal from "@/components/users/EditUserModal";
import LockUserModal from "@/components/users/LockUserModal";
import ResetPasswordModal from "@/components/users/ResetPasswordModal";
import AssignRoleModal from "@/components/users/AssignRoleModal";
import ViewerAccountsModal from "@/components/users/ViewerAccountsModal";
import PermanentBlockModal from "@/components/users/PermanentBlockModal";
import SettleWalletModal from "@/components/users/SettleWalletModal";

export interface ViewerAccount {
  id: string;
  name: string;
  email: string;
  permissions: string[];
  status: "active" | "inactive";
  createdAt: string;
  lastLogin?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  user_type: "super_admin" | "admin" | "b2b_client" | "viewer";
  status: "active" | "locked" | "pending" | "permanently_blocked";
  walletId: string;
  walletBalance: number;
  createdAt: string;
  lastLogin: string;
  lockedReason?: string;
  restrictedProducts?: string[];
  viewerAccounts?: ViewerAccount[];
  permanentBlockReason?: string;
  permanentBlockDate?: string;
  walletSettled?: boolean;
  settlementMethod?: string;
  settlementReference?: string;
  settlementDate?: string;
  settlementNotes?: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterUserType, setFilterUserType] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentUserType, setCurrentUserType] = useState<"super_admin" | "admin">("admin");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
  const [showViewerAccountsModal, setShowViewerAccountsModal] = useState(false);
  const [showPermanentBlockModal, setShowPermanentBlockModal] = useState(false);
  const [showSettleWalletModal, setShowSettleWalletModal] = useState(false);

  // Check authentication and load users
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }
    // Read logged-in user's type from localStorage
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (storedUser.user_type === "super_admin") {
        setCurrentUserType("super_admin");
      } else {
        setCurrentUserType("admin");
      }
    } catch {
      setCurrentUserType("admin");
    }
    loadUsers();
  }, [router]);

  // Load users from API
  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.getUsers({
        page: 1,
        limit: 100,
        status: filterStatus !== "all" ? filterStatus : undefined,
        user_type: filterUserType !== "all" ? filterUserType : undefined,
        search: searchTerm || undefined,
      });

      // Transform API response to match User interface
      const transformedUsers: User[] = response.data.map((apiUser: any) => ({
        id: String(apiUser.user_id),
        name: apiUser.full_name,
        email: apiUser.email,
        company: apiUser.company_name || "N/A",
        role: apiUser.user_type,
        user_type: apiUser.user_type,
        status: apiUser.status,
        walletId: apiUser.wallet_id ? `WALLET-${String(apiUser.user_id).padStart(3, "0")}` : "—",
        walletBalance: apiUser.wallet_balance || 0,
        createdAt: apiUser.created_at?.split("T")[0] || "N/A",
        lastLogin: apiUser.last_login?.split("T")[0] || "Never",
        lockedReason: apiUser.locked_reason,
        restrictedProducts: apiUser.restricted_products || [],
        viewerAccounts: apiUser.viewer_accounts || [],
        permanentBlockReason: apiUser.permanent_block_reason,
        permanentBlockDate: apiUser.permanent_block_date,
        walletSettled: apiUser.wallet_settled,
        settlementMethod: apiUser.settlement_method,
        settlementReference: apiUser.settlement_reference,
        settlementDate: apiUser.settlement_date,
        settlementNotes: apiUser.settlement_notes,
      }));

      setUsers(transformedUsers);
    } catch (error: any) {
      console.error("Error loading users:", error);
      alert(error.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || user.status === filterStatus;
    const matchesType = filterUserType === "all" || user.user_type === filterUserType;

    return matchesSearch && matchesStatus && matchesType;
  });

  // ─── HANDLERS ────────────────────────────────────────────────────────────

  const handleEditUser = async (userData: any) => {
    if (!selectedUser) return;
    try {
      await api.updateUser(Number(selectedUser.id), {
        name: userData.name,
        company: userData.company,
        phone: userData.phone,
      });
      setShowEditModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error: any) {
      alert(error.message || "Failed to update user");
    }
  };

  const handleLockUser = async (reason: string) => {
    if (!selectedUser) return;
    try {
      await api.lockUser(Number(selectedUser.id), reason);
      setShowLockModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error: any) {
      alert(error.message || "Failed to lock user");
    }
  };

  const handleUnlockUser = async (userId: string) => {
    try {
      await api.unlockUser(Number(userId));
      loadUsers();
    } catch (error: any) {
      alert(error.message || "Failed to unlock user");
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    try {
      const response = await api.resetUserPassword(Number(selectedUser.id));
      setShowResetPasswordModal(false);
      setSelectedUser(null);
      if (response.data?.temporaryPassword) {
        alert(`Temporary password: ${response.data.temporaryPassword}\n\nPlease share this with the user.`);
      } else {
        alert("Password reset email sent to user!");
      }
    } catch (error: any) {
      alert(error.message || "Failed to reset password");
    }
  };

  const handleAssignRole = async (role: string, permissions: string[]) => {
    if (!selectedUser) return;
    try {
      await api.updateUser(Number(selectedUser.id), {});
      setShowAssignRoleModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error: any) {
      alert(error.message || "Failed to assign role");
    }
  };

  const handlePermanentBlock = async (
    userId: string,
    reason: string,
    walletSettled: boolean,
    settlementDetails?: {
      settlementMethod: string;
      transactionReference: string;
      settlementNotes: string;
      settlementDate: string;
    }
  ) => {
    try {
      await api.permanentlyBlockUser(Number(userId), reason, walletSettled, settlementDetails);
      setShowPermanentBlockModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error: any) {
      alert(error.message || "Failed to block user");
    }
  };

  const handleSettleWallet = async (
    userId: string,
    settlementData: {
      settlementMethod: string;
      transactionReference: string;
      settlementNotes: string;
      settlementDate: string;
    }
  ) => {
    try {
      await api.settleUserWallet(Number(userId), settlementData);
      setShowSettleWalletModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error: any) {
      alert(error.message || "Failed to settle wallet");
    }
  };

  return (
    <Dashboard>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
              User Management
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage B2B client accounts, roles, and permissions
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create New User
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Users
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  {users.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Active Users
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  {users.filter((u) => u.status === "active").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-400"
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
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Locked Users
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  {users.filter((u) => u.status === "locked").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Wallets
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  $
                  {users
                    .reduce((sum, u) => sum + Number(u.walletBalance), 0)
                    .toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search users by name, email, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="locked">Locked</option>
              <option value="permanently_blocked">Permanently Blocked</option>
            </select>

            <select
              value={filterUserType}
              onChange={(e) => setFilterUserType(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              {currentUserType === "super_admin" && (
                <option value="admin">Admin</option>
              )}
              <option value="b2b_client">B2B Client</option>
              <option value="viewer">Viewer</option>
            </select>

            <button
              onClick={loadUsers}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          </div>
        ) : (
          <UserTable
            users={filteredUsers}
            currentUserType={currentUserType}
            onEdit={(user) => {
              setSelectedUser(user);
              setShowEditModal(true);
            }}
            onLock={(user) => {
              setSelectedUser(user);
              setShowLockModal(true);
            }}
            onUnlock={handleUnlockUser}
            onResetPassword={(user) => {
              setSelectedUser(user);
              setShowResetPasswordModal(true);
            }}
            onAssignRole={(user) => {
              setSelectedUser(user);
              setShowAssignRoleModal(true);
            }}
            onManageViewers={(user) => {
              setSelectedUser(user);
              setShowViewerAccountsModal(true);
            }}
            onPermanentBlock={(user) => {
              setSelectedUser(user);
              setShowPermanentBlockModal(true);
            }}
            onSettleWallet={(user) => {
              setSelectedUser(user);
              setShowSettleWalletModal(true);
            }}
          />
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadUsers}
          currentUserType={currentUserType}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSubmit={handleEditUser}
        />
      )}

      {showLockModal && selectedUser && (
        <LockUserModal
          user={selectedUser}
          onClose={() => {
            setShowLockModal(false);
            setSelectedUser(null);
          }}
          onSubmit={handleLockUser}
        />
      )}

      {showResetPasswordModal && selectedUser && (
        <ResetPasswordModal
          user={selectedUser}
          onClose={() => {
            setShowResetPasswordModal(false);
            setSelectedUser(null);
          }}
          onSubmit={handleResetPassword}
        />
      )}

      {showAssignRoleModal && selectedUser && (
        <AssignRoleModal
          user={selectedUser}
          onClose={() => {
            setShowAssignRoleModal(false);
            setSelectedUser(null);
          }}
          onSubmit={handleAssignRole}
        />
      )}

      {showViewerAccountsModal && selectedUser && (
        <ViewerAccountsModal
          user={selectedUser}
          onClose={() => {
            setShowViewerAccountsModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {showPermanentBlockModal && selectedUser && (
        <PermanentBlockModal
          user={selectedUser}
          onClose={() => {
            setShowPermanentBlockModal(false);
            setSelectedUser(null);
          }}
          onConfirm={handlePermanentBlock}
        />
      )}

      {showSettleWalletModal && selectedUser && (
        <SettleWalletModal
          user={selectedUser}
          onClose={() => {
            setShowSettleWalletModal(false);
            setSelectedUser(null);
          }}
          onConfirm={handleSettleWallet}
        />
      )}
    </Dashboard>
  );
}