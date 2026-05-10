"use client";

import Dashboard from "@/components/Dashboard";
import { useState, useEffect, useCallback } from "react";
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
import GenericOTPModal from "@/components/GenericOTPModal";

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

interface ApiUser {
  user_id: number;
  full_name: string;
  email: string;
  company_name?: string;
  user_type: User["user_type"];
  status: User["status"];
  wallet_id?: number;
  wallet_balance?: number;
  created_at?: string;
  last_login?: string;
  locked_reason?: string;
  restricted_products?: string[];
  viewer_accounts?: ViewerAccount[];
  permanent_block_reason?: string;
  permanent_block_date?: string;
  wallet_settled?: boolean;
  settlement_method?: string;
  settlement_reference?: string;
  settlement_date?: string;
  settlement_notes?: string;
}

type UserActionType =
  | "lock"
  | "unlock"
  | "reset_password"
  | "permanent_block"
  | "settle_wallet"
  | "edit";

export default function UsersPage() {
  const router = useRouter();
  const [searchTerm,      setSearchTerm]      = useState("");
  const [users,           setUsers]           = useState<User[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [filterStatus,    setFilterStatus]    = useState<string>("all");
  const [filterUserType,  setFilterUserType]  = useState<string>("all");
  const [selectedUser,    setSelectedUser]    = useState<User | null>(null);
  const [currentUserType, setCurrentUserType] = useState<"super_admin" | "admin">("admin");
  const [isAuthChecked,   setIsAuthChecked]   = useState(false);

  // ─── Modal states ─────────────────────────────────────────────────────────
  const [showCreateModal,        setShowCreateModal]        = useState(false);
  const [showEditModal,          setShowEditModal]          = useState(false);
  const [showLockModal,          setShowLockModal]          = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showAssignRoleModal,    setShowAssignRoleModal]    = useState(false);
  const [showViewerAccountsModal,setShowViewerAccountsModal]= useState(false);
  const [showPermanentBlockModal,setShowPermanentBlockModal]= useState(false);
  const [showSettleWalletModal,  setShowSettleWalletModal]  = useState(false);

  // ─── MFA state ────────────────────────────────────────────────────────────
  const [showMFAModal,   setShowMFAModal]   = useState(false);
  const [pendingAction,  setPendingAction]  = useState<{
    type: UserActionType;
    user: User;
    data?: any;
  } | null>(null);

  // ─── Auth check ───────────────────────────────────────────────────────────
  useEffect(() => {
    const storedUserStr = localStorage.getItem("user");
    const accessToken   = localStorage.getItem("accessToken");
    if (!storedUserStr || !accessToken) { router.push("/login"); return; }
    try {
      const storedUser = JSON.parse(storedUserStr);
      setCurrentUserType(storedUser.user_type === "super_admin" ? "super_admin" : "admin");
    } catch {
      setCurrentUserType("admin");
    }
    setIsAuthChecked(true);
  }, [router]);

  // ─── Load users ───────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    if (!isAuthChecked) return;
    setLoading(true);
    try {
      const response = await api.getUsers({
        page: 1,
        limit: 100,
        status:    filterStatus   !== "all" ? filterStatus   : undefined,
        user_type: filterUserType !== "all" ? filterUserType : undefined,
        search:    searchTerm || undefined,
      });

      const transformedUsers: User[] = response.data.map((u: ApiUser) => ({
        id:                   String(u.user_id),
        name:                 u.full_name,
        email:                u.email,
        company:              u.company_name || "N/A",
        role:                 u.user_type,
        user_type:            u.user_type,
        status:               u.status,
        walletId:             u.wallet_id ? `WALLET-${String(u.user_id).padStart(3, "0")}` : "—",
        walletBalance:        u.wallet_balance || 0,
        createdAt:            u.created_at?.split("T")[0] || "N/A",
        lastLogin:            u.last_login?.split("T")[0] || "Never",
        lockedReason:         u.locked_reason,
        restrictedProducts:   u.restricted_products || [],
        viewerAccounts:       u.viewer_accounts || [],
        permanentBlockReason: u.permanent_block_reason,
        permanentBlockDate:   u.permanent_block_date,
        walletSettled:        u.wallet_settled,
        settlementMethod:     u.settlement_method,
        settlementReference:  u.settlement_reference,
        settlementDate:       u.settlement_date,
        settlementNotes:      u.settlement_notes,
      }));

      setUsers(transformedUsers);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterUserType, searchTerm, isAuthChecked]);

  useEffect(() => {
    if (isAuthChecked) loadUsers();
  }, [isAuthChecked, loadUsers]);

  // ─── Action initiators (open MFA modal) ──────────────────────────────────

  const initiateEdit = (userData: any) => {
    if (!selectedUser) return;
    setPendingAction({ type: "edit", user: selectedUser, data: userData });
    setShowMFAModal(true);
  };

  const initiateLock = (reason: string) => {
    if (!selectedUser) return;
    setPendingAction({ type: "lock", user: selectedUser, data: reason });
    setShowMFAModal(true);
  };

  const initiateUnlock = (user: User) => {
    if (!user) return;
    setPendingAction({ type: "unlock", user });
    setShowMFAModal(true);
  };

  // Password reset goes through MFA like all other sensitive actions
  const initiateResetPassword = (password: string, sendEmail: boolean) => {
    if (!selectedUser) return;
    setPendingAction({
      type: "reset_password",
      user: selectedUser,
      data: { password, sendEmail },
    });
    setShowMFAModal(true);
  };

  const initiatePermanentBlock = (userId: string, reason: string, walletSettled: boolean, settlementDetails?: any) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    setPendingAction({ type: "permanent_block", user, data: { reason, walletSettled, settlementDetails } });
    setShowMFAModal(true);
  };

  const initiateSettleWallet = (userId: string, settlementData: any) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    setPendingAction({ type: "settle_wallet", user, data: settlementData });
    setShowMFAModal(true);
  };

  // ─── MFA verified — execute the action ───────────────────────────────────

  const handleMFAVerified = async (_otp: string) => {
    if (!pendingAction) return;
    const { type, user, data } = pendingAction;

    try {
      switch (type) {
        case "edit": {
          await api.updateUser(Number(user.id), data);
          setShowEditModal(false);
          break;
        }
        case "lock": {
          await api.lockUser(Number(user.id), data);
          setShowLockModal(false);
          break;
        }
        case "unlock": {
          await api.unlockUser(Number(user.id));
          break;
        }
        case "reset_password": {
          await api.resetUserPassword(Number(user.id), data.password, data.sendEmail);
          setShowResetPasswordModal(false);
          break;
        }
        case "permanent_block": {
          await api.permanentlyBlockUser(
            Number(user.id),
            data.reason,
            data.walletSettled,
            data.settlementDetails
          );
          setShowPermanentBlockModal(false);
          break;
        }
        case "settle_wallet": {
          await api.settleUserWallet(Number(user.id), data);
          setShowSettleWalletModal(false);
          break;
        }
      }
      loadUsers();
    } catch (error: any) {
      alert(error.message || "Action failed");
    } finally {
      setShowMFAModal(false);
      setPendingAction(null);
      setSelectedUser(null);
    }
  };

  // ─── Filtered users (client-side) ────────────────────────────────────────

  const filteredUsers = users.filter((user) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.company.toLowerCase().includes(q);
    const matchesStatus = filterStatus   === "all" || user.status    === filterStatus;
    const matchesType   = filterUserType === "all" || user.user_type === filterUserType;
    return matchesSearch && matchesStatus && matchesType;
  });

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Dashboard>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">User Management</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New User
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-4">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white">
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="locked">Locked</option>
              <option value="permanently_blocked">Permanently Blocked</option>
            </select>
            <select value={filterUserType} onChange={(e) => setFilterUserType(e.target.value)}
              className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white">
              <option value="all">All Types</option>
              {currentUserType === "super_admin" && <option value="admin">Admin</option>}
              <option value="b2b_client">B2B Client</option>
            </select>
          </div>
          <div className="relative w-full md:w-80">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="Search users by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <UserTable
            users={filteredUsers}
            currentUserType={currentUserType}
            onEdit={(u)           => { setSelectedUser(u); setShowEditModal(true); }}
            onLock={(u)           => { setSelectedUser(u); setShowLockModal(true); }}
            onUnlock={initiateUnlock}
            onResetPassword={(u)  => { setSelectedUser(u); setShowResetPasswordModal(true); }}
            onAssignRole={(u)     => { setSelectedUser(u); setShowAssignRoleModal(true); }}
            onManageViewers={(u)  => { setSelectedUser(u); setShowViewerAccountsModal(true); }}
            onPermanentBlock={(u) => { setSelectedUser(u); setShowPermanentBlockModal(true); }}
            onSettleWallet={(u)   => { setSelectedUser(u); setShowSettleWalletModal(true); }}
          />
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}

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
          onClose={() => { setShowEditModal(false); setSelectedUser(null); }}
          onSubmit={initiateEdit}
        />
      )}

      {showLockModal && selectedUser && (
        <LockUserModal
          user={selectedUser}
          onClose={() => { setShowLockModal(false); setSelectedUser(null); }}
          onSubmit={initiateLock}
        />
      )}

      {showResetPasswordModal && selectedUser && (
        <ResetPasswordModal
          user={selectedUser}
          onClose={() => { setShowResetPasswordModal(false); setSelectedUser(null); }}
          onSubmit={initiateResetPassword}
        />
      )}

      {showAssignRoleModal && selectedUser && (
        <AssignRoleModal
          user={selectedUser}
          onClose={() => { setShowAssignRoleModal(false); setSelectedUser(null); }}
          onSubmit={() => {}}
        />
      )}

      {showViewerAccountsModal && selectedUser && (
        <ViewerAccountsModal
          user={selectedUser}
          onClose={() => { setShowViewerAccountsModal(false); setSelectedUser(null); }}
        />
      )}

      {showPermanentBlockModal && selectedUser && (
        <PermanentBlockModal
          user={selectedUser}
          onClose={() => { setShowPermanentBlockModal(false); setSelectedUser(null); }}
          onConfirm={initiatePermanentBlock}
        />
      )}

      {showSettleWalletModal && selectedUser && (
        <SettleWalletModal
          user={selectedUser}
          onClose={() => { setShowSettleWalletModal(false); setSelectedUser(null); }}
          onConfirm={initiateSettleWallet}
        />
      )}

      {showMFAModal && pendingAction && (
        <GenericOTPModal
          title="Administrative Authorization"
          description={`Please verify your identity to perform this action on ${pendingAction.user.name}.`}
          actionType="user_management_action"
          confirmButtonText="Verify & Execute"
          details={
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-500 uppercase">Action</p>
              <p className="text-sm font-bold text-blue-600 capitalize">
                {pendingAction.type.replace(/_/g, " ")}
              </p>
              <div className="pt-2">
                <p className="text-xs font-bold text-gray-500 uppercase">Target User</p>
                <p className="text-sm text-gray-900 dark:text-white">{pendingAction.user.email}</p>
              </div>
            </div>
          }
          onVerified={handleMFAVerified}
          onClose={() => { setShowMFAModal(false); setPendingAction(null); }}
        />
      )}
    </Dashboard>
  );
}