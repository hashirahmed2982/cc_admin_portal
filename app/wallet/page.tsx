"use client";

import Dashboard from "@/components/Dashboard";
import { useState, useEffect, useCallback } from "react";
import TopupRequestsTable from "@/components/wallet/TopupRequestsTable";
import WalletBalancesTable from "@/components/wallet/WalletBalancesTable";
import TransactionHistoryTable from "@/components/wallet/TransactionHistoryTable";
import ViewReceiptModal from "@/components/wallet/ViewReceiptModal";
import GenericOTPModal from "@/components/GenericOTPModal";
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
  processedByName: string;
  createdAt: string;
  referenceId: any;
  referenceType: any;
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
      w.lastTopupAmount != null || w.last_top_amount != null
        ? Number(w.lastTopupAmount ?? w.last_topup_amount)
        : undefined,
    totalTopups: Number(w.totalTopups ?? w.total_topups ?? 0),
    totalSpent: Number(w.totalSpent ?? w.total_spent ?? 0),
    createdAt: w.createdAt ?? w.created_at ?? "",
  };
}

function mapTransaction(t: any): Transaction {
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
  const rawAmount = Number(t.amount);
  const amount = mappedType === "purchase" || mappedType === "adjustment" ? -Math.abs(rawAmount) : Math.abs(rawAmount);

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
    processedByName: "",
    createdAt: "",
    referenceId: undefined,
    referenceType: undefined
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

  const initiateApproval = (request: TopupRequest) => {
    setPendingAction({ type: "approve", request });
    setShowMFAModal(true);
  };

  const initiateRejection = (request: TopupRequest, reason: string) => {
    setPendingAction({ type: "reject", request, reason });
    setShowMFAModal(true);
  };

  const handleMFAVerified = async (otp: string) => {
    if (!pendingAction) return;
    const currentDate = new Date().toISOString();

    try {
      if (pendingAction.type === "approve") {
        await api.approveTopup(Number(pendingAction.request.id), otp);
        setTopupRequests((prev) => prev.map((req) => req.id === pendingAction.request.id ? { ...req, status: "approved", reviewedBy: "Admin User", reviewedAt: currentDate } : req));
      } else {
        await api.rejectTopup(Number(pendingAction.request.id), pendingAction.reason ?? "", otp);
        setTopupRequests((prev) => prev.map((req) => req.id === pendingAction.request.id ? { ...req, status: "rejected", reviewedBy: "Admin User", reviewedAt: currentDate, rejectionReason: pendingAction.reason } : req));
      }
      await Promise.all([loadRequests(), loadBalances(), loadTransactions()]);
    } catch (e: any) {
      setError(e.message ?? "Action failed. Please try again.");
    }

    setShowMFAModal(false);
    setPendingAction(null);
  };

  const stats = {
    pendingRequests: topupRequests.filter((r) => r.status === "pending").length,
    totalWalletBalance: walletBalances.reduce((sum, w) => sum + w.balance, 0),
    todayTransactions: transactions.filter((t) => t.timestamp.startsWith(new Date().toISOString().split("T")[0])).length,
    pendingAmount: topupRequests.filter((r) => r.status === "pending").reduce((sum, r) => sum + r.amount, 0),
  };

  return (
    <Dashboard>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Wallet Management</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage client wallet topup requests and balances</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center justify-between">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button onClick={() => setError(null)} className="text-sm underline text-red-700 dark:text-red-300">Dismiss</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Pending Requests</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.pendingRequests}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Balance</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">${stats.totalWalletBalance.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex">
              {["requests", "balances", "history"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors capitalize ${
                    activeTab === tab ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {tab === "requests" ? "Topup Requests" : tab === "balances" ? "Wallet Balances" : "History"}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="animate-pulse space-y-4"><div className="h-10 bg-gray-100 dark:bg-gray-700 rounded w-full"></div><div className="h-10 bg-gray-100 dark:bg-gray-700 rounded w-full"></div></div>
            ) : (
              <>
                {activeTab === "requests" && <TopupRequestsTable requests={topupRequests} onViewReceipt={(r) => { setSelectedReceipt(r); setShowReceiptModal(true); }} onApprove={initiateApproval} onReject={initiateRejection} />}
                {activeTab === "balances" && <WalletBalancesTable balances={walletBalances} />}
                {activeTab === "history" && <TransactionHistoryTable transactions={transactions} />}
              </>
            )}
          </div>
        </div>
      </div>

      {showReceiptModal && selectedReceipt && <ViewReceiptModal request={selectedReceipt} onClose={() => setShowReceiptModal(false)} />}
      
      {showMFAModal && pendingAction && (
        <GenericOTPModal
          title={pendingAction.type === "approve" ? "Authorize Top-up Approval" : "Authorize Top-up Rejection"}
          actionType="wallet_topup_action"
          confirmButtonText={pendingAction.type === "approve" ? "Verify & Approve" : "Verify & Reject"}
          details={
            <div className="space-y-1 text-sm">
              <p className="text-gray-500 dark:text-gray-400 font-medium">Authorizing for:</p>
              <p className="text-gray-900 dark:text-white font-bold">{pendingAction.request.userName} · {pendingAction.request.company}</p>
              <p className="text-blue-600 dark:text-blue-400 font-bold text-lg">${pendingAction.request.amount.toLocaleString()}</p>
            </div>
          }
          onVerified={handleMFAVerified}
          onClose={() => { setShowMFAModal(false); setPendingAction(null); }}
        />
      )}
    </Dashboard>
  );
}
