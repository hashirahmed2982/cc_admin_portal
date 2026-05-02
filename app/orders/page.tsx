"use client";

import { useState, useMemo, useEffect } from "react";
import Dashboard from "@/components/Dashboard";
import OrderStatsCards      from "@/components/orders/OrderStatsCards";
import OrdersTable          from "@/components/orders/OrdersTable";
import OrderDetailModal     from "@/components/orders/OrderDetailModal";
import CompleteResultModal  from "@/components/orders/CompleteResultModal";
import { useOrders }        from "@/hooks/useOrders";
import type { Order }       from "@/types/order.types";

type Tab = "all" | "pending";

export default function OrdersManagementPage() {
  const {
    orders, stats, loading, error,
    page, totalPages, total,
    setPage, reload, clearError,
    fetchDetail, completeOrder,
    completing, completeError, completeResult,
    clearCompleteError, clearCompleteResult,
    searchTerm, setSearchTerm,
  } = useOrders();

  const [activeTab,     setActiveTab]     = useState<Tab>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // ─── Derived lists ─────────────────────────────────────────────────────────
  const pendingOrders = useMemo(
    () => orders.filter(o => o.status === "pending" || o.status === "processing"),
    [orders]
  );
  const displayOrders = activeTab === "pending" ? pendingOrders : orders;

  // ─── Open detail modal ──────────────────────────────────────────────────────
  const handleView = async (order: Order) => {
    setSelectedOrder(order); // show immediately with summary data
    const detail = await fetchDetail(order.id);
    if (detail) setSelectedOrder(detail); // enrich with item breakdown
  };

  // ─── Complete + refresh modal if open ──────────────────────────────────────
  const handleComplete = async (id: string) => {
    await completeOrder(id);
    if (selectedOrder?.id === id) {
      const updated = await fetchDetail(id);
      if (updated) setSelectedOrder(updated);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <Dashboard>
      <div className="space-y-6">

        {/* Page header */}
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Order Management</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor client orders, fulfillment status, and complete pending deliveries
          </p>
        </div>

        {/* Error banners */}
        {error && (
          <ErrorBanner message={error} onDismiss={clearError} onRetry={reload} />
        )}
        {completeError && (
          <ErrorBanner message={completeError} onDismiss={clearCompleteError} />
        )}

        {/* Stats */}
        <OrderStatsCards stats={stats} loading={loading} />

        {/* Info banner */}
        <InfoBanner />

        {/* Search Input */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search orders by ID, client name, or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          />
        </div>

        {/* Tabs + table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {/* Tab nav */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              <TabButton
                active={activeTab === "all"}
                onClick={() => setActiveTab("all")}
                label="All Orders"
                count={total}
                badgeVariant="gray"
              />
              <TabButton
                active={activeTab === "pending"}
                onClick={() => setActiveTab("pending")}
                label="Pending / Partial"
                count={stats.pending + stats.processing}
                badgeVariant="orange"
              />
            </nav>
          </div>

          {/* Table */}
          <div className="p-6">
            {loading ? (
              <LoadingSkeleton rows={5} />
            ) : (
              <OrdersTable
                orders={displayOrders}
                onView={handleView}
                onComplete={handleComplete}
                completing={completing}
                showCompleteBtn={activeTab === "pending"}
              />
            )}

            {/* Pagination — all tab only */}
            {!loading && activeTab === "all" && totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                onPrev={() => setPage(p => Math.max(1, p - 1))}
                onNext={() => setPage(p => Math.min(totalPages, p + 1))}
              />
            )}
          </div>
        </div>
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onComplete={handleComplete}
          completing={completing === selectedOrder.id}
        />
      )}

      {/* Complete order result modal */}
      {completeResult && (
        <CompleteResultModal
          result={completeResult}
          onClose={clearCompleteResult}
        />
      )}
    </Dashboard>
  );
}

// ─── Inline micro-components (page-specific, too small for their own file) ────

function ErrorBanner({
  message, onDismiss, onRetry,
}: { message: string; onDismiss: () => void; onRetry?: () => void }) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center justify-between">
      <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
      <div className="flex gap-3 ml-4">
        {onRetry && (
          <button onClick={onRetry} className="text-sm underline text-red-700 dark:text-red-300">
            Retry
          </button>
        )}
        <button onClick={onDismiss} className="text-red-500 text-xl leading-none">×</button>
      </div>
    </div>
  );
}

function InfoBanner() {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div className="flex gap-3">
        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Fulfillment flow:</strong> Available codes are sent to the client immediately on order placement.
          Orders with insufficient stock are marked <strong>Pending</strong> or <strong>Processing</strong>.
          Upload inventory codes, then click <strong>Mark Complete</strong> to fulfill remaining items and notify the client by email.
        </p>
      </div>
    </div>
  );
}

function TabButton({
  active, onClick, label, count, badgeVariant,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  badgeVariant: "gray" | "orange";
}) {
  const badgeCls = badgeVariant === "orange"
    ? "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";

  return (
    <button
      onClick={onClick}
      className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-blue-500 text-blue-600 dark:text-blue-400"
          : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300"
      }`}
    >
      {label}
      {count > 0 && (
        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${badgeCls}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function LoadingSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

function Pagination({
  page, totalPages, total, onPrev, onNext,
}: {
  page: number; totalPages: number; total: number;
  onPrev: () => void; onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Page {page} of {totalPages} ({total} orders)
      </p>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={page === 1}
          className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={page === totalPages}
          className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
