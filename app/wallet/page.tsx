"use client";

import Dashboard from "@/components/Dashboard";
import { useState, useEffect, useCallback } from "react";
import TopupRequestsTable from "@/components/wallet/TopupRequestsTable";
import WalletBalancesTable from "@/components/wallet/WalletBalancesTable";
import TransactionHistoryTable from "@/components/wallet/TransactionHistoryTable";
import ViewReceiptModal from "@/components/wallet/ViewReceiptModal";
import MFAVerificationModal from "@/components/wallet/MFAVerificationModal";
import { api } from "@/lib/api";

export interface TopupRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  company: string;
  amount: number;
  receiptUrl: string;
  requestDate: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface WalletBalance {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  company: string;
  balance: number;
  lastTopup?: string;
  lastTopupAmount?: number;
  totalTopups: number;
  totalSpent: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  company: string;
  type: "topup" | "purchase" | "refund" | "adjustment";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  timestamp: string;
  performedBy: string;
}

// ─── API response → local interface mappers ───────────────────────────────────

function mapTopupRequest(r: any): TopupRequest {
  return {
    id: String(r.id ?? r.request_id),
    userId: String(r.userId ?? r.user_id ?? ""),
    userName: r.userName ?? r.user_name ?? "",
    userEmail: r.userEmail ?? r.user_email ?? "",
    company: r.company ?? r.company_name ?? "",
    amount: Number(r.amount),
    receiptUrl: r.receiptUrl ?? r.receipt_url ?? "",
    requestDate: r.requestDate ?? r.request_date ?? r.created_at ?? "",
    status: r.status,
    reviewedBy: r.reviewedBy ?? r.reviewed_by ?? undefined,
    reviewedAt: r.reviewedAt ?? r.reviewed_at ?? undefined,
    rejectionReason: r.rejectionReason ?? r.rejection_reason ?? undefined,
  };
}

function mapWalletBalance(w: any): WalletBalance {
  return {
    id: String(w.id ?? w.wallet_id),
    userId: String(w.userId ?? w.user_id),
    userName: w.userName ?? w.user_name ?? "",
    userEmail: w.userEmail ?? w.user_email ?? "",
    company: w.company ?? w.company_name ?? "",
    balance: Number(w.balance),
    lastTopup: w.lastTopup ?? w.last_topup ?? undefined,
    lastTopupAmount:
      w.lastTopupAmount != null || w.last_topup_amount != null
        ? Number(w.lastTopupAmount ?? w.last_topup_amount)
        : undefined,
    totalTopups: Number(w.totalTopups ?? w.total_topups ?? 0),
    totalSpent: Number(w.totalSpent ?? w.total_spent ?? 0),
    createdAt: w.createdAt ?? w.created_at ?? "",
  };
}

function mapTransaction(t: any): Transaction {
  // DB uses "credit"/"debit"; UI expects "topup"/"purchase"/"refund"/"adjustment"
  const rawType = t.type ?? t.transaction_type ?? "";
  const typeMap: Record<string, Transaction["type"]> = {
    credit: "topup",
    debit: "purchase",
    refund: "refund",
    adjustment: "adjustment",
    topup: "topup",
    purchase: "purchase",
  };
  const mappedType: Transaction["type"] = typeMap[rawType] ?? "adjustment";

  // Debit amounts should be negative in the UI (matching mock data pattern)
  const rawAmount = Number(t.amount);
  const amount =
    mappedType === "purchase" || mappedType === "adjustment"
      ? -Math.abs(rawAmount)
      : Math.abs(rawAmount);

  return {
    id: String(t.id ?? t.transaction_id),
    userId: String(t.userId ?? t.user_id ?? ""),
    userName: t.userName ?? t.user_name ?? "",
    company: t.company ?? t.company_name ?? "",
    type: mappedType,
    amount,
    balanceBefore: Number(t.balanceBefore ?? t.balance_before ?? 0),
    balanceAfter: Number(t.balanceAfter ?? t.balance_after ?? 0),
    description: t.description ?? "",
    timestamp: t.timestamp ?? t.createdAt ?? t.created_at ?? "",
    performedBy: t.performedBy ?? t.processedByName ?? t.processed_by_name ?? "System",
  };
}

export default function WalletManagementPage() {
  const [topupRequests, setTopupRequests] = useState<TopupRequest[]>([]);
  const [walletBalances, setWalletBalances] = useState<WalletBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [activeTab, setActiveTab] = useState<"requests" | "balances" | "history">("requests");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedReceipt, setSelectedReceipt] = useState<TopupRequest | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const [showMFAModal, setShowMFAModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "approve" | "reject";
    request: TopupRequest;
    reason?: string;
  } | null>(null);

  // ─── Data loaders ─────────────────────────────────────────────────────────

  const loadRequests = useCallback(async () => {
    const res = await api.getTopupRequests();
    setTopupRequests((res.data ?? []).map(mapTopupRequest));
  }, []);

  const loadBalances = useCallback(async () => {
    const res = await api.getAllWalletBalances();
    setWalletBalances((res.data ?? []).map(mapWalletBalance));
  }, []);

  const loadTransactions = useCallback(async () => {
    const res = await api.getAllTransactions();
    setTransactions((res.data ?? []).map(mapTransaction));
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([loadRequests(), loadBalances(), loadTransactions()]);
      } catch (e: any) {
        setError(e.message ?? "Failed to load wallet data");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadRequests, loadBalances, loadTransactions]);

  // ─── Stats ────────────────────────────────────────────────────────────────

  const stats = {
    pendingRequests: topupRequests.filter((r) => r.status === "pending").length,
    totalWalletBalance: walletBalances.reduce((sum, w) => sum + w.balance, 0),
    todayTransactions: transactions.filter((t) =>
      t.timestamp.startsWith(new Date().toISOString().split("T")[0])
    ).length,
    pendingAmount: topupRequests
      .filter((r) => r.status === "pending")
      .reduce((sum, r) => sum + r.amount, 0),
  };

  // ─── Action handlers ──────────────────────────────────────────────────────

  const handleViewReceipt = (request: TopupRequest) => {
    setSelectedReceipt(request);
    setShowReceiptModal(true);
  };

  const initiateApproval = (request: TopupRequest) => {
    setPendingAction({ type: "approve", request });
    setShowMFAModal(true);
  };

  const initiateRejection = (request: TopupRequest, reason: string) => {
    setPendingAction({ type: "reject", request, reason });
    setShowMFAModal(true);
  };

  // MFAVerificationModal calls onVerified() after its own OTP simulation passes.
  // We then call the real API using the same demo code ("123456") the modal uses.
  // In production, swap MFA_CODE for the actual token collected from the modal.
  const handleMFAVerified = async () => {
    if (!pendingAction) return;

    const currentDate = new Date().toISOString();
    const MFA_CODE = "123456"; // matches the modal's demo OTP — swap for real token in prod

    try {
      if (pendingAction.type === "approve") {
        await api.approveTopup(Number(pendingAction.request.id), MFA_CODE);

        // Update requests list
        setTopupRequests((prev) =>
          prev.map((req) =>
            req.id === pendingAction.request.id
              ? { ...req, status: "approved" as const, reviewedBy: "Admin User", reviewedAt: currentDate }
              : req
          )
        );

        // Update wallet balance
        setWalletBalances((prev) =>
          prev.map((wallet) =>
            wallet.userId === pendingAction.request.userId
              ? {
                  ...wallet,
                  balance: wallet.balance + pendingAction.request.amount,
                  lastTopup: currentDate.split("T")[0],
                  lastTopupAmount: pendingAction.request.amount,
                  totalTopups: wallet.totalTopups + pendingAction.request.amount,
                }
              : wallet
          )
        );

        // Add new transaction entry
        const wallet = walletBalances.find((w) => w.userId === pendingAction.request.userId);
        if (wallet) {
          const newTransaction: Transaction = {
            id: `TXN-${Date.now()}`,
            userId: pendingAction.request.userId,
            userName: pendingAction.request.userName,
            company: pendingAction.request.company,
            type: "topup",
            amount: pendingAction.request.amount,
            balanceBefore: wallet.balance,
            balanceAfter: wallet.balance + pendingAction.request.amount,
            description: `Wallet topup via bank transfer (Request: ${pendingAction.request.id})`,
            timestamp: currentDate,
            performedBy: "Admin User",
          };
          setTransactions((prev) => [newTransaction, ...prev]);
        }
      } else {
        await api.rejectTopup(
          Number(pendingAction.request.id),
          pendingAction.reason ?? "",
          MFA_CODE
        );

        setTopupRequests((prev) =>
          prev.map((req) =>
            req.id === pendingAction.request.id
              ? {
                  ...req,
                  status: "rejected" as const,
                  reviewedBy: "Admin User",
                  reviewedAt: currentDate,
                  rejectionReason: pendingAction.reason,
                }
              : req
          )
        );
      }
    } catch (e: any) {
      setError(e.message ?? "Action failed. Please try again.");
    }

    setShowMFAModal(false);
    setPendingAction(null);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Dashboard>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
            Wallet Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage client wallet topup requests and balances (USD only)
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center justify-between">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                Promise.all([loadRequests(), loadBalances(), loadTransactions()])
                  .catch((e) => setError(e.message))
                  .finally(() => setLoading(false));
              }}
              className="ml-4 text-sm underline text-red-700 dark:text-red-300 hover:opacity-75"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  {loading ? "—" : stats.pendingRequests}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {loading ? "Loading..." : `$${stats.pendingAmount.toLocaleString()} pending`}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Wallet Balance</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  {loading ? "—" : `$${stats.totalWalletBalance.toLocaleString()}`}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Across all clients</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Today's Transactions</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  {loading ? "—" : stats.todayTransactions}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Topups, purchases, refunds</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Wallets</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  {loading ? "—" : walletBalances.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Client wallets</p>
          </div>
        </div>

        {/* MFA Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium">MFA Required for All Actions</p>
              <p className="mt-1">
                All topup approvals and rejections require Multi-Factor Authentication verification for security.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("requests")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "requests"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
                }`}
              >
                Topup Requests
                {stats.pendingRequests > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 rounded-full">
                    {stats.pendingRequests}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("balances")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "balances"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
                }`}
              >
                Wallet Balances
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "history"
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
                }`}
              >
                Transaction History
              </button>
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                {activeTab === "requests" && (
                  <TopupRequestsTable
                    requests={topupRequests}
                    onViewReceipt={handleViewReceipt}
                    onApprove={initiateApproval}
                    onReject={initiateRejection}
                  />
                )}
                {activeTab === "balances" && (
                  <WalletBalancesTable balances={walletBalances} />
                )}
                {activeTab === "history" && (
                  <TransactionHistoryTable transactions={transactions} />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showReceiptModal && selectedReceipt && (
        <ViewReceiptModal
          request={selectedReceipt}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedReceipt(null);
          }}
        />
      )}

      {showMFAModal && pendingAction && (
        <MFAVerificationModal
          action={pendingAction.type}
          request={pendingAction.request}
          onVerified={handleMFAVerified}
          onClose={() => {
            setShowMFAModal(false);
            setPendingAction(null);
          }}
        />
      )}
    </Dashboard>
  );
}