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
import { useSearch } from "@/app/context/SearchContext";

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

type UserActionType = "lock" | "unlock" | "reset_password" | "permanent_block" | "settle_wallet" | "edit";

export default function UsersPage() {
  const router = useRouter();
  const { searchTerm } = useSearch();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterUserType, setFilterUserType] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentUserType, setCurrentUserType] = useState<"super_admin" | "admin">("admin");
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showAssignRoleModal, setShowAssignRoleModal] = useState(false);
  const [showViewerAccountsModal, setShowViewerAccountsModal] = useState(false);
  const [showPermanentBlockModal, setShowPermanentBlockModal] = useState(false);
  const [showSettleWalletModal, setShowSettleWalletModal] = useState(false);
  
  // MFA state
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: UserActionType;
    user: User;
    data?: any;
  } | null>(null);

  useEffect(() => {
    // Check for auth in localStorage directly as per your requirement
    const storedUserStr = localStorage.getItem("user");
    const accessToken = localStorage.getItem("accessToken");

    if (!storedUserStr || !accessToken) {
      router.push("/login");
      return;
    }
    
    try {
      const storedUser = JSON.parse(storedUserStr);
      setCurrentUserType(storedUser.user_type === "super_admin" ? "super_admin" : "admin");
    } catch {
      setCurrentUserType("admin");
    }
    setIsAuthChecked(true);
  }, [router]);

  const loadUsers = useCallback(async () => {
    if (!isAuthChecked) return;
    setLoading(true);
    try {
      const response = await api.getUsers({
        page: 1,
        limit: 100,
        status: filterStatus !== "all" ? filterStatus : undefined,
        user_type: filterUserType !== "all" ? filterUserType : undefined,
        search: searchTerm || undefined,
      });

      const transformedUsers: User[] = response.data.map((apiUser: ApiUser) => ({
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
    } catch (error: unknown) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterUserType, searchTerm, isAuthChecked]);

  useEffect(() => {
    if (isAuthChecked) {
      loadUsers();
    }
  }, [isAuthChecked, loadUsers]);

  // ─── ACTION INITIATORS (Sensitive Actions) ────────────────────────────────

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

  const initiateUnlock = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    setPendingAction({ type: "unlock", user });
    setShowMFAModal(true);
  };

  const initiateResetPassword = () => {
    if (!selectedUser) return;
    setPendingAction({ type: "reset_password", user: selectedUser });
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

  // ─── REAL ACTION HANDLERS (Called after MFA) ─────────────────────────────

  const handleMFAVerified = async (otp: string) => {
    if (!pendingAction) return;
    const { type, user, data } = pendingAction;

    try {
      switch (type) {
        case "edit":
          await api.updateUser(Number(user.id), data);
          setShowEditModal(false);
          break;
        case "lock":
          await api.lockUser(Number(user.id), data);
          setShowLockModal(false);
          break;
        case "unlock":
          await api.unlockUser(Number(user.id));
          break;
        case "reset_password":
          const res = await api.resetUserPassword(Number(user.id));
          setShowResetPasswordModal(false);
          if (res.data?.temporaryPassword) alert(`Temp Password: ${res.data.temporaryPassword}`);
          break;
        case "permanent_block":
          await api.permanentlyBlockUser(Number(user.id), data.reason, data.walletSettled, data.settlementDetails);
          setShowPermanentBlockModal(false);
          break;
        case "settle_wallet":
          await api.settleUserWallet(Number(user.id), data);
          setShowSettleWalletModal(false);
          break;
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

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || user.status === filterStatus;
    const matchesType = filterUserType === "all" || user.user_type === filterUserType;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <Dashboard>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">User Management</h2>
          <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Create New User</button>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex gap-4">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white">
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="locked">Locked</option>
            <option value="permanently_blocked">Permanently Blocked</option>
          </select>
          <select value={filterUserType} onChange={(e) => setFilterUserType(e.target.value)} className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white">
            <option value="all">All Types</option>
            {currentUserType === "super_admin" && <option value="admin">Admin</option>}
            <option value="b2b_client">B2B Client</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>
        ) : (
          <UserTable
            users={filteredUsers}
            currentUserType={currentUserType}
            onEdit={(u) => { setSelectedUser(u); setShowEditModal(true); }}
            onLock={(u) => { setSelectedUser(u); setShowLockModal(true); }}
            onUnlock={initiateUnlock}
            onResetPassword={(u) => { setSelectedUser(u); setShowResetPasswordModal(true); }}
            onAssignRole={(u) => { setSelectedUser(u); setShowAssignRoleModal(true); }}
            onManageViewers={(u) => { setSelectedUser(u); setShowViewerAccountsModal(true); }}
            onPermanentBlock={(u) => { setSelectedUser(u); setShowPermanentBlockModal(true); }}
            onSettleWallet={(u) => { setSelectedUser(u); setShowSettleWalletModal(true); }}
          />
        )}
      </div>

      {showCreateModal && <CreateUserModal onClose={() => setShowCreateModal(false)} onSuccess={loadUsers} currentUserType={currentUserType} />}
      
      {showEditModal && selectedUser && <EditUserModal user={selectedUser} onClose={() => { setShowEditModal(false); setSelectedUser(null); }} onSubmit={initiateEdit} />}
      
      {showLockModal && selectedUser && <LockUserModal user={selectedUser} onClose={() => { setShowLockModal(false); setSelectedUser(null); }} onSubmit={initiateLock} />}
      
      {showResetPasswordModal && selectedUser && <ResetPasswordModal user={selectedUser} onClose={() => { setShowResetPasswordModal(false); setSelectedUser(null); }} onSubmit={initiateResetPassword} />}
      
      {showAssignRoleModal && selectedUser && <AssignRoleModal user={selectedUser} onClose={() => { setShowAssignRoleModal(false); setSelectedUser(null); }} onSubmit={() => {}} />}
      
      {showViewerAccountsModal && selectedUser && <ViewerAccountsModal user={selectedUser} onClose={() => { setShowViewerAccountsModal(false); setSelectedUser(null); }} />}
      
      {showPermanentBlockModal && selectedUser && <PermanentBlockModal user={selectedUser} onClose={() => { setShowPermanentBlockModal(false); setSelectedUser(null); }} onConfirm={initiatePermanentBlock} />}
      
      {showSettleWalletModal && selectedUser && <SettleWalletModal user={selectedUser} onClose={() => { setShowSettleWalletModal(false); setSelectedUser(null); }} onConfirm={initiateSettleWallet} />}

      {showMFAModal && pendingAction && (
        <GenericOTPModal
          title="Administrative Authorization"
          description={`Please verify your identity to perform this action on ${pendingAction.user.name}.`}
          actionType="user_management_action"
          confirmButtonText="Verify & Execute"
          details={
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-500 uppercase">Action</p>
              <p className="text-sm font-bold text-blue-600 capitalize">{pendingAction.type.replace("_", " ")}</p>
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
