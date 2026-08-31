"use client";

import Dashboard from "@/components/Dashboard";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { api } from "@/lib/api";
import SupplierHealthCard from "@/components/suppliers/SupplierHealthCard";
import CredentialsModal from "@/components/suppliers/CredentialsModal";
import CronHealthTable from "@/components/suppliers/CronHealthTable";
import IntegrationLogsTable from "@/components/suppliers/IntegrationLogsTable";
import TopupQueueTable from "@/components/suppliers/TopupQueueTable";
import { SupplierHealth, CronJobRun, SupplierLogEntry, TopupOrder } from "@/types/supplier.types";

type Tab = "activity" | "cron" | "topups";

const LIMIT = 25;

export default function SuppliersPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.user_type === "super_admin";

  const [suppliers, setSuppliers] = useState<SupplierHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<SupplierHealth | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>("activity");
  const [selectedSupplier, setSelectedSupplier] = useState("wgcards");

  // ── Activity log ──────────────────────────────────────────────────────
  const [logs, setLogs] = useState<SupplierLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);

  // ── Cron health ────────────────────────────────────────────────────────
  const [cronJobs, setCronJobs] = useState<CronJobRun[]>([]);
  const [cronLoading, setCronLoading] = useState(false);

  // ── Top-up queue (Flow F) ─────────────────────────────────────────────
  const [topups, setTopups] = useState<TopupOrder[]>([]);
  const [topupsLoading, setTopupsLoading] = useState(false);
  const [topupStatus, setTopupStatus] = useState("");
  const [topupsPage, setTopupsPage] = useState(1);
  const [topupsTotalPages, setTopupsTotalPages] = useState(1);

  const loadSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.getSuppliers();
      setSuppliers(result.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSuppliers(); }, [loadSuppliers]);

  const loadLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      const result = await api.getSupplierLogs(selectedSupplier, { errorsOnly, page: logsPage, limit: LIMIT });
      setLogs(result.data || []);
      setLogsTotalPages(Math.max(1, Math.ceil((result.pagination?.total || 0) / LIMIT)));
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, [selectedSupplier, errorsOnly, logsPage]);

  const loadCronJobs = useCallback(async () => {
    try {
      setCronLoading(true);
      const result = await api.getCronStatus();
      setCronJobs(result.data || []);
    } catch {
      setCronJobs([]);
    } finally {
      setCronLoading(false);
    }
  }, []);

  const loadTopups = useCallback(async () => {
    try {
      setTopupsLoading(true);
      const result = await api.getSupplierTopups(selectedSupplier, { status: topupStatus || undefined, page: topupsPage, limit: LIMIT });
      setTopups(result.data || []);
      setTopupsTotalPages(Math.max(1, Math.ceil((result.pagination?.total || 0) / LIMIT)));
    } catch {
      setTopups([]);
    } finally {
      setTopupsLoading(false);
    }
  }, [selectedSupplier, topupStatus, topupsPage]);

  useEffect(() => {
    if (activeTab === "activity") loadLogs();
    else if (activeTab === "cron") loadCronJobs();
    else if (activeTab === "topups") loadTopups();
  }, [activeTab, loadLogs, loadCronJobs, loadTopups]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "activity", label: "Integration Activity" },
    { id: "cron", label: "Cron Health" },
    { id: "topups", label: "Direct Top-Up Queue" },
  ];

  return (
    <Dashboard>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Suppliers</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Integration health, credentials{isSuperAdmin ? " & balance" : ""}, activity log, and scheduled job status.
          </p>
        </div>

        {successMsg && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center justify-between">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">{successMsg}</p>
            <button onClick={() => setSuccessMsg(null)} className="text-green-500 text-lg leading-none">×</button>
          </div>
        )}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* ── Health cards ──────────────────────────────────────────────── */}
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading suppliers...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {suppliers.map((s) => (
              <SupplierHealthCard
                key={s.supplierName}
                supplier={s}
                isSuperAdmin={isSuperAdmin}
                onEditCredentials={() => setEditingSupplier(s)}
              />
            ))}
          </div>
        )}

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 pt-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {(activeTab === "activity" || activeTab === "topups") && (
              <select
                value={selectedSupplier}
                onChange={(e) => { setSelectedSupplier(e.target.value); setLogsPage(1); setTopupsPage(1); }}
                className="mb-2 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                {suppliers.map((s) => (
                  <option key={s.supplierName} value={s.supplierName}>{s.supplierName}</option>
                ))}
              </select>
            )}
          </div>

          <div className="p-6">
            {activeTab === "activity" && (
              <IntegrationLogsTable
                logs={logs}
                errorsOnly={errorsOnly}
                onToggleErrorsOnly={(v) => { setErrorsOnly(v); setLogsPage(1); }}
                page={logsPage}
                totalPages={logsTotalPages}
                onPageChange={setLogsPage}
                loading={logsLoading}
              />
            )}
            {activeTab === "cron" && (
              cronLoading
                ? <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">Loading...</div>
                : <CronHealthTable jobs={cronJobs} />
            )}
            {activeTab === "topups" && (
              <TopupQueueTable
                topups={topups}
                statusFilter={topupStatus}
                onStatusFilterChange={(v) => { setTopupStatus(v); setTopupsPage(1); }}
                page={topupsPage}
                totalPages={topupsTotalPages}
                onPageChange={setTopupsPage}
                loading={topupsLoading}
              />
            )}
          </div>
        </section>
      </div>

      {editingSupplier && (
        <CredentialsModal
          supplierName={editingSupplier.supplierName}
          apiBaseUrl={editingSupplier.apiBaseUrl}
          lowBalanceThreshold={editingSupplier.lowBalanceThreshold}
          onClose={() => setEditingSupplier(null)}
          onSuccess={() => {
            setEditingSupplier(null);
            setSuccessMsg(`${editingSupplier.supplierName} credentials updated`);
            loadSuppliers();
          }}
        />
      )}
    </Dashboard>
  );
}
