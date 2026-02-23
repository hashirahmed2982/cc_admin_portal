"use client";

import Dashboard from "@/components/Dashboard";
import { useState } from "react";
import TopupRequestsTable from "@/components/wallet/TopupRequestsTable";
import WalletBalancesTable from "@/components/wallet/WalletBalancesTable";
import TransactionHistoryTable from "@/components/wallet/TransactionHistoryTable";
import ViewReceiptModal from "@/components/wallet/ViewReceiptModal";
import MFAVerificationModal from "@/components/wallet/MFAVerificationModal";

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

// Mock data
const mockTopupRequests: TopupRequest[] = [
  {
    id: "REQ-001",
    userId: "USR-001",
    userName: "John Smith",
    userEmail: "john@acmecorp.com",
    company: "Acme Corporation",
    amount: 500,
    receiptUrl: "/receipts/receipt-001.pdf",
    requestDate: "2024-02-13 10:30:00",
    status: "pending",
  },
  {
    id: "REQ-002",
    userId: "USR-002",
    userName: "Sarah Johnson",
    userEmail: "sarah@techstart.com",
    company: "TechStart Inc",
    amount: 1000,
    receiptUrl: "/receipts/receipt-002.pdf",
    requestDate: "2024-02-13 09:15:00",
    status: "pending",
  },
  {
    id: "REQ-003",
    userId: "USR-003",
    userName: "Mike Davis",
    userEmail: "mike@globalltd.com",
    company: "Global Ltd",
    amount: 250,
    receiptUrl: "/receipts/receipt-003.pdf",
    requestDate: "2024-02-12 16:45:00",
    status: "approved",
    reviewedBy: "Admin User",
    reviewedAt: "2024-02-12 17:00:00",
  },
  {
    id: "REQ-004",
    userId: "USR-004",
    userName: "Emily Chen",
    userEmail: "emily@innovate.io",
    company: "Innovate Solutions",
    amount: 750,
    receiptUrl: "/receipts/receipt-004.pdf",
    requestDate: "2024-02-12 14:20:00",
    status: "rejected",
    reviewedBy: "Admin User",
    reviewedAt: "2024-02-12 15:00:00",
    rejectionReason: "Receipt does not match the amount requested",
  },
];

const mockWalletBalances: WalletBalance[] = [
  {
    id: "WALLET-001",
    userId: "USR-001",
    userName: "John Smith",
    userEmail: "john@acmecorp.com",
    company: "Acme Corporation",
    balance: 15000,
    lastTopup: "2024-02-10",
    lastTopupAmount: 5000,
    totalTopups: 25000,
    totalSpent: 10000,
    createdAt: "2024-01-15",
  },
  {
    id: "WALLET-002",
    userId: "USR-002",
    userName: "Sarah Johnson",
    userEmail: "sarah@techstart.com",
    company: "TechStart Inc",
    balance: 8500,
    lastTopup: "2024-02-08",
    lastTopupAmount: 3000,
    totalTopups: 18000,
    totalSpent: 9500,
    createdAt: "2024-01-20",
  },
  {
    id: "WALLET-003",
    userId: "USR-003",
    userName: "Mike Davis",
    userEmail: "mike@globalltd.com",
    company: "Global Ltd",
    balance: 2300,
    lastTopup: "2024-02-12",
    lastTopupAmount: 250,
    totalTopups: 8000,
    totalSpent: 5700,
    createdAt: "2024-02-01",
  },
];

const mockTransactions: Transaction[] = [
  {
    id: "TXN-001",
    userId: "USR-001",
    userName: "John Smith",
    company: "Acme Corporation",
    type: "topup",
    amount: 5000,
    balanceBefore: 10000,
    balanceAfter: 15000,
    description: "Wallet topup via bank transfer",
    timestamp: "2024-02-10 14:30:00",
    performedBy: "Admin User",
  },
  {
    id: "TXN-002",
    userId: "USR-001",
    userName: "John Smith",
    company: "Acme Corporation",
    type: "purchase",
    amount: -500,
    balanceBefore: 15000,
    balanceAfter: 14500,
    description: "Purchase: Netflix Premium Gift Card - $50 (10 codes)",
    timestamp: "2024-02-11 10:15:00",
    performedBy: "System",
  },
  {
    id: "TXN-003",
    userId: "USR-002",
    userName: "Sarah Johnson",
    company: "TechStart Inc",
    type: "topup",
    amount: 3000,
    balanceBefore: 5500,
    balanceAfter: 8500,
    description: "Wallet topup via bank transfer",
    timestamp: "2024-02-08 09:20:00",
    performedBy: "Admin User",
  },
  {
    id: "TXN-004",
    userId: "USR-003",
    userName: "Mike Davis",
    company: "Global Ltd",
    type: "topup",
    amount: 250,
    balanceBefore: 2050,
    balanceAfter: 2300,
    description: "Wallet topup via bank transfer",
    timestamp: "2024-02-12 17:00:00",
    performedBy: "Admin User",
  },
  {
    id: "TXN-005",
    userId: "USR-002",
    userName: "Sarah Johnson",
    company: "TechStart Inc",
    type: "refund",
    amount: 100,
    balanceBefore: 8400,
    balanceAfter: 8500,
    description: "Refund: Invalid gift card code",
    timestamp: "2024-02-09 16:45:00",
    performedBy: "Admin User",
  },
];

export default function WalletManagementPage() {
  const [topupRequests, setTopupRequests] = useState<TopupRequest[]>(mockTopupRequests);
  const [walletBalances, setWalletBalances] = useState<WalletBalance[]>(mockWalletBalances);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  
  const [activeTab, setActiveTab] = useState<"requests" | "balances" | "history">("requests");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  const [selectedReceipt, setSelectedReceipt] = useState<TopupRequest | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "approve" | "reject";
    request: TopupRequest;
    reason?: string;
  } | null>(null);

  // Calculate stats
  const stats = {
    pendingRequests: topupRequests.filter((r) => r.status === "pending").length,
    totalWalletBalance: walletBalances.reduce((sum, w) => sum + w.balance, 0),
    todayTransactions: transactions.filter(
      (t) => t.timestamp.startsWith(new Date().toISOString().split("T")[0])
    ).length,
    pendingAmount: topupRequests
      .filter((r) => r.status === "pending")
      .reduce((sum, r) => sum + r.amount, 0),
  };

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

  const handleMFAVerified = () => {
    if (!pendingAction) return;

    const currentDate = new Date().toISOString();

    if (pendingAction.type === "approve") {
      // Approve the request
      setTopupRequests(
        topupRequests.map((req) =>
          req.id === pendingAction.request.id
            ? {
                ...req,
                status: "approved" as const,
                reviewedBy: "Admin User",
                reviewedAt: currentDate,
              }
            : req
        )
      );

      // Update wallet balance
      setWalletBalances(
        walletBalances.map((wallet) =>
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

      // Add transaction
      const wallet = walletBalances.find(
        (w) => w.userId === pendingAction.request.userId
      );
      if (wallet) {
        const newTransaction: Transaction = {
          id: `TXN-${transactions.length + 1}`,
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
        setTransactions([newTransaction, ...transactions]);
      }
    } else {
      // Reject the request
      setTopupRequests(
        topupRequests.map((req) =>
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

    setShowMFAModal(false);
    setPendingAction(null);
  };

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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pending Requests
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  {stats.pendingRequests}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-orange-600 dark:text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              ${stats.pendingAmount.toLocaleString()} pending
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Wallet Balance
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  ${stats.totalWalletBalance.toLocaleString()}
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
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Across all clients
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Today's Transactions
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  {stats.todayTransactions}
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Topups, purchases, refunds
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Active Wallets
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                  {walletBalances.length}
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
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Client wallets
            </p>
          </div>
        </div>

        {/* MFA Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
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