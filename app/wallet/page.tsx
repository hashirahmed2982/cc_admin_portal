"use client";

import Dashboard from "@/components/Dashboard";
import { useState, useEffect, useCallback } from "react";
import TopupRequestsTable from "@/components/wallet/TopupRequestsTable";
import WalletBalancesTable from "@/components/wallet/WalletBalancesTable";
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
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  company: string;
  type: "topup" | "purchase" | "refund" | "adjustment";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceType: string;
  referenceId: string;
  processedByName: string;
  createdAt: string;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapTopupRequest(r: any): TopupRequest {
  return {
    id:              String(r.id ?? r.request_id),
    userId:          String(r.userId ?? r.user_id ?? ""),
    userName:        r.userName  ?? r.user_name  ?? "",
    userEmail:       r.userEmail ?? r.user_email ?? "",
    company:         r.company   ?? r.company_name ?? "",
    amount:          Number(r.amount),
    receiptUrl:      r.receiptUrl ?? r.receipt_url ?? "",
    requestDate:     r.requestDate ?? r.request_date ?? r.created_at ?? "",
    status:          r.status,
    reviewedBy:      r.reviewedBy      ?? r.reviewed_by      ?? undefined,
    reviewedAt:      r.reviewedAt      ?? r.reviewed_at      ?? undefined,
    rejectionReason: r.rejectionReason ?? r.rejection_reason ?? undefined,
  };
}

function mapWalletBalance(w: any): WalletBalance {
  return {
    id:              String(w.id ?? w.wallet_id),
    userId:          String(w.userId ?? w.user_id),
    userName:        w.userName  ?? w.user_name  ?? "",
    userEmail:       w.userEmail ?? w.user_email ?? "",
    company:         w.company   ?? w.company_name ?? "",
    balance:         Number(w.balance),
    lastTopup:       w.lastTopup ?? w.last_topup ?? undefined,
    lastTopupAmount: w.lastTopupAmount != null || w.last_topup_amount != null
                       ? Number(w.lastTopupAmount ?? w.last_topup_amount)
                       : undefined,
    totalTopups:     Number(w.totalTopups ?? w.total_topups ?? 0),
    totalSpent:      Number(w.totalSpent  ?? w.total_spent  ?? 0),
    createdAt:       w.createdAt ?? w.created_at ?? "",
  };
}

function mapTransaction(t: any): Transaction {
  const rawType = t.type ?? t.transaction_type ?? "";
  const typeMap: Record<string, Transaction["type"]> = {
    credit: "topup", debit: "purchase",
    refund: "refund", adjustment: "adjustment",
    topup: "topup",  purchase: "purchase",
  };
  const mappedType = typeMap[rawType] ?? "adjustment";
  const rawAmount  = Number(t.amount);
  const amount = mappedType === "purchase" || mappedType === "adjustment"
    ? -Math.abs(rawAmount) : Math.abs(rawAmount);

  return {
    id:              String(t.id ?? t.transaction_id),
    userId:          String(t.userId ?? t.user_id ?? ""),
    userName:        t.userName    ?? t.user_name    ?? "",
    userEmail:       t.userEmail   ?? t.user_email   ?? "",
    company:         t.company     ?? t.company_name ?? "",
    type:            mappedType,
    amount,
    balanceBefore:   Number(t.balanceBefore ?? t.balance_before ?? 0),
    balanceAfter:    Number(t.balanceAfter  ?? t.balance_after  ?? 0),
    description:     t.description  ?? "",
    referenceType:   t.referenceType ?? t.reference_type ?? "",
    referenceId:     String(t.referenceId ?? t.reference_id ?? ""),
    processedByName: t.processedByName ?? t.processed_by_name ?? "System",
    createdAt:       t.createdAt ?? t.created_at ?? "",
  };
}

function formatDate(raw: string) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleString(undefined, {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

// ─── Transaction History Table (display only) ─────────────────────────────────

interface TxTableProps {
  transactions:  Transaction[];
  pagination:    { page: number; totalPages: number; total: number };
  loading:       boolean;
  clientFilter:  string;
  dateFrom:      string;
  dateTo:        string;
  today:         string;
  onClientFilter:(v: string) => void;
  onDateFrom:    (v: string) => void;
  onDateTo:      (v: string) => void;
  onPageChange:  (p: number) => void;
  onReset:       () => void;
}

function TransactionHistoryTable({
  transactions, pagination, loading,
  clientFilter, dateFrom, dateTo, today,
  onClientFilter, onDateFrom, onDateTo,
  onPageChange, onReset,
}: TxTableProps) {
  const isDefault = !clientFilter && dateFrom === today && dateTo === today;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input type="text"
            placeholder="Filter by client, company or email..."
            value={clientFilter}
            onChange={e => onClientFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input type="date" value={dateFrom} onChange={e => onDateFrom(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          <span className="text-gray-400 text-sm">→</span>
          <input type="date" value={dateTo} onChange={e => onDateTo(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          {!isDefault && (
            <button onClick={onReset}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors">
              Reset to Today
            </button>
          )}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {isDefault
          ? `${pagination.total} transaction${pagination.total !== 1 ? "s" : ""} today`
          : `${pagination.total} transaction${pagination.total !== 1 ? "s" : ""} found`}
      </p>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="animate-pulse space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded"/>)}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {["ID", "Client", "Type", "Amount", "Balance After", "Description", "Date", "Processed By"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">#{tx.id}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{tx.userName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{tx.company}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      tx.type === "topup" || tx.type === "refund"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                    }`}>
                      {tx.type === "topup" || tx.type === "refund" ? "▲ Credit" : "▼ Debit"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-bold ${
                      tx.type === "topup" || tx.type === "refund"
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}>
                      {tx.amount >= 0 ? "+" : ""}${Math.abs(tx.amount).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    ${Number(tx.balanceAfter).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-[180px] truncate"
                    title={tx.description}>
                    {tx.description || (tx.referenceType ? `${tx.referenceType} #${tx.referenceId}` : "—")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {formatDate(tx.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {tx.processedByName || "System"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && transactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isDefault ? "No transactions today" : "No transactions found"}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              ← Prev
            </button>
            <button disabled={pagination.page >= pagination.totalPages} onClick={() => onPageChange(pagination.page + 1)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WalletManagementPage() {
const today = new Date().toLocaleDateString("en-CA");
  const [topupRequests,   setTopupRequests]   = useState<TopupRequest[]>([]);
  const [walletBalances,  setWalletBalances]  = useState<WalletBalance[]>([]);
  const [transactions,    setTransactions]    = useState<Transaction[]>([]);
  const [txPagination,    setTxPagination]    = useState({ page: 1, totalPages: 1, total: 0 });
  const [txLoading,       setTxLoading]       = useState(false);
  const [activeTab,       setActiveTab]       = useState<"requests" | "balances" | "history">("requests");
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<TopupRequest | null>(null);
  const [showReceiptModal,setShowReceiptModal] = useState(false);
  const [showMFAModal,    setShowMFAModal]    = useState(false);
  const [pendingAction,   setPendingAction]   = useState<{
    type: "approve" | "reject";
    request: TopupRequest;
    reason?: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Transaction filter state — lives here so changes trigger API re-fetch
  const [txClientFilter, setTxClientFilter] = useState("");
  const [txDateFrom,     setTxDateFrom]     = useState(today);
  const [txDateTo,       setTxDateTo]       = useState(today);
  const [txPage,         setTxPage]         = useState(1);

  // ─── Loaders ────────────────────────────────────────────────────────────────

  const loadRequests = useCallback(async () => {
    const res = await api.getTopupRequests();
    setTopupRequests((res.data ?? []).map(mapTopupRequest));
  }, []);

  const loadBalances = useCallback(async () => {
    const res = await api.getAllWalletBalances();
    setWalletBalances((res.data ?? []).map(mapWalletBalance));
  }, []);

  const loadTransactions = useCallback(async (
    page         = 1,
    clientSearch = "",
    dateFrom     = today,
    dateTo       = today,
  ) => {
    setTxLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (dateFrom)     params.set("dateFrom", dateFrom);
      if (dateTo)       params.set("dateTo",   dateTo);
      if (clientSearch) params.set("search",   clientSearch);

      const res = await api.getAllTransactions(params.toString());
      setTransactions((res.data ?? []).map(mapTransaction));
      if (res.pagination) setTxPagination(res.pagination);
    } catch (e: any) {
      setError(e.message ?? "Failed to load transactions");
    } finally {
      setTxLoading(false);
    }
  }, [today]);

  // Initial load — requests + balances only
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([loadRequests(), loadBalances()]);
      } catch (e: any) {
        setError(e.message ?? "Failed to load wallet data");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [loadRequests, loadBalances]);

  // Re-fetch transactions on filter/page change (debounce text filter)
  useEffect(() => {
    const timer = setTimeout(
      () => loadTransactions(txPage, txClientFilter, txDateFrom, txDateTo),
      txClientFilter ? 400 : 0
    );
    return () => clearTimeout(timer);
  }, [txPage, txClientFilter, txDateFrom, txDateTo, loadTransactions]);

  // ─── Filter handlers ──────────────────────────────────────────────────────

  const handleTxClientFilter = (v: string) => { setTxClientFilter(v); setTxPage(1); };
  const handleTxDateFrom     = (v: string) => { setTxDateFrom(v);     setTxPage(1); };
  const handleTxDateTo       = (v: string) => { setTxDateTo(v);       setTxPage(1); };
  const handleTxReset        = ()          => {
    setTxClientFilter(""); setTxDateFrom(today); setTxDateTo(today); setTxPage(1);
  };

  // ─── Topup actions ────────────────────────────────────────────────────────

  const initiateApproval  = (request: TopupRequest) => {
    setPendingAction({ type: "approve", request });
    setShowMFAModal(true);
  };
  const initiateRejection = (request: TopupRequest, reason: string) => {
    setPendingAction({ type: "reject", request, reason });
    setShowMFAModal(true);
  };

  const handleMFAVerified = async (otp: string) => {
    if (!pendingAction) return;
    try {
      if (pendingAction.type === "approve") {
        await api.approveTopup(Number(pendingAction.request.id), otp);
      } else {
        await api.rejectTopup(Number(pendingAction.request.id), pendingAction.reason ?? "", otp);
      }
      await Promise.all([
        loadRequests(),
        loadBalances(),
        loadTransactions(txPage, txClientFilter, txDateFrom, txDateTo),
      ]);
    } catch (e: any) {
      setError(e.message ?? "Action failed. Please try again.");
    } finally {
      setShowMFAModal(false);
      setPendingAction(null);
    }
  };

  // ─── Derived ──────────────────────────────────────────────────────────────

  const stats = {
    pendingRequests:    topupRequests.filter(r => r.status === "pending").length,
    totalWalletBalance: walletBalances.reduce((s, w) => s + w.balance, 0),
    pendingAmount:      topupRequests.filter(r => r.status === "pending").reduce((s, r) => s + r.amount, 0),
  };

  const q = searchTerm.toLowerCase();
  const filteredRequests = topupRequests.filter(r =>
    r.userName.toLowerCase().includes(q) || r.userEmail.toLowerCase().includes(q) ||
    r.company.toLowerCase().includes(q)  || r.id.toLowerCase().includes(q)
  );
  const filteredBalances = walletBalances.filter(b =>
    b.userName.toLowerCase().includes(q) || b.userEmail.toLowerCase().includes(q) ||
    b.company.toLowerCase().includes(q)
  );

  // ─── Render ───────────────────────────────────────────────────────────────

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
            <button onClick={() => setError(null)} className="text-sm underline text-red-700 dark:text-red-300 ml-4">Dismiss</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending Requests</p>
            <p className="text-2xl font-bold text-orange-500 dark:text-orange-400 mt-1">{loading ? "—" : stats.pendingRequests}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">${stats.pendingAmount.toLocaleString()} awaiting approval</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Wallet Balance</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{loading ? "—" : `$${stats.totalWalletBalance.toLocaleString()}`}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Across all clients</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Wallets</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{loading ? "—" : walletBalances.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Client wallets</p>
          </div>
        </div>

        {/* OTP notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>OTP Required</strong> — Topup approvals and rejections require a one-time code sent to your registered email.
            </p>
          </div>
        </div>

        {/* Search — requests + balances only */}
        {activeTab !== "history" && (
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="search"
              placeholder={`Search ${activeTab === "requests" ? "topup requests" : "wallet balances"}...`}
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              {(["requests", "balances", "history"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}>
                  {tab === "requests" ? (
                    <span className="flex items-center gap-2">
                      Topup Requests
                      {stats.pendingRequests > 0 && (
                        <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 rounded-full">
                          {stats.pendingRequests}
                        </span>
                      )}
                    </span>
                  ) : tab === "balances" ? "Wallet Balances" : "Transaction History"}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded"/>)}
              </div>
            ) : (
              <>
                {activeTab === "requests" && (
                  <TopupRequestsTable requests={filteredRequests}
                    onViewReceipt={r => { setSelectedReceipt(r); setShowReceiptModal(true); }}
                    onApprove={initiateApproval} onReject={initiateRejection}
                  />
                )}
                {activeTab === "balances" && <WalletBalancesTable balances={filteredBalances} />}
                {activeTab === "history" && (
                  <TransactionHistoryTable
                    transactions={transactions}
                    pagination={txPagination}
                    loading={txLoading}
                    clientFilter={txClientFilter}
                    dateFrom={txDateFrom}
                    dateTo={txDateTo}
                    today={today}
                    onClientFilter={handleTxClientFilter}
                    onDateFrom={handleTxDateFrom}
                    onDateTo={handleTxDateTo}
                    onPageChange={setTxPage}
                    onReset={handleTxReset}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showReceiptModal && selectedReceipt && (
        <ViewReceiptModal request={selectedReceipt}
          onClose={() => { setShowReceiptModal(false); setSelectedReceipt(null); }} />
      )}

      {showMFAModal && pendingAction && (
        <GenericOTPModal
          title={pendingAction.type === "approve" ? "Authorize Topup Approval" : "Authorize Topup Rejection"}
          actionType="wallet_topup_action"
          confirmButtonText={pendingAction.type === "approve" ? "Verify & Approve" : "Verify & Reject"}
          details={
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Action</p>
                <p className={`font-bold capitalize ${pendingAction.type === "approve" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {pendingAction.type} Topup
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Client</p>
                <p className="text-gray-900 dark:text-white">{pendingAction.request.userName}</p>
                <p className="text-xs text-gray-500">{pendingAction.request.company}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Amount</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">${pendingAction.request.amount.toLocaleString()}</p>
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