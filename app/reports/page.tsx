"use client";

import Dashboard from "@/components/Dashboard";
import { useState, useCallback, useEffect, useRef } from "react";
import GenericOTPModal from "@/components/GenericOTPModal";
import { api } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReportType {
  id: string;
  name: string;
  description: string;
  purpose: string;
  category: "channel-sales" | "inventory" | "b2b" | "finance" | "admin-audit" | "automation";
  keyFields: string[];
  viewType: "table" | "bar+table" | "line+table" | "donut+table" | "table+aging";
  needsDateRange: boolean;
  accentColor: string;
  accentLight: string;
}

type DateRange = { from: string; to: string };
type ChartPoint = { label: string; value: number; color?: string };

type ReportData = {
  columns: string[];
  rows: (string | number)[][];
  chartData?: ChartPoint[];
  pagination?: { page: number; limit: number; total: number };
};

// ─── Category metadata ────────────────────────────────────────────────────────

const CATEGORY_META = {
  "channel-sales": { label: "Channel & Sales", color: "#3b82f6", bg: "bg-blue-500",    light: "bg-blue-50 dark:bg-blue-900/20",  text: "text-blue-700 dark:text-blue-300",  border: "border-blue-200 dark:border-blue-800" },
  "inventory":     { label: "Inventory",        color: "#10b981", bg: "bg-emerald-500", light: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800" },
  "b2b":           { label: "B2B",              color: "#8b5cf6", bg: "bg-violet-500",  light: "bg-violet-50 dark:bg-violet-900/20",  text: "text-violet-700 dark:text-violet-300",  border: "border-violet-200 dark:border-violet-800" },
  "finance":       { label: "Finance",          color: "#f59e0b", bg: "bg-amber-500",   light: "bg-amber-50 dark:bg-amber-900/20",   text: "text-amber-700 dark:text-amber-300",   border: "border-amber-200 dark:border-amber-800" },
  "admin-audit":   { label: "Admin & Audit",    color: "#ef4444", bg: "bg-red-500",     light: "bg-red-50 dark:bg-red-900/20",     text: "text-red-700 dark:text-red-300",     border: "border-red-200 dark:border-red-800" },
  "automation":    { label: "Automation",        color: "#06b6d4", bg: "bg-cyan-500",    light: "bg-cyan-50 dark:bg-cyan-900/20",    text: "text-cyan-700 dark:text-cyan-300",    border: "border-cyan-200 dark:border-cyan-800" },
} as const;

// ─── Report definitions ───────────────────────────────────────────────────────

const REPORTS: ReportType[] = [
  { id: "channel-performance",       name: "Channel Performance",          description: "Sales breakdown by order channel",         purpose: "Compare B2B Portal vs API channel gross/net sales and margin",                          category: "channel-sales", keyFields: ["Channel","Total Orders","Gross Sales","Net Sales","Refund Rate%","Margin"], viewType: "bar+table",    needsDateRange: true,  accentColor: "#3b82f6", accentLight: "#eff6ff" },
  { id: "transaction-detailed",      name: "Detailed Transactions",        description: "Full order-level transaction list",         purpose: "Every order with product, price, client, payment method, and status",                   category: "channel-sales", keyFields: ["Order ID","Date","Client","Product","Unit Price","Qty","Total","Status"],    viewType: "table",        needsDateRange: true,  accentColor: "#6366f1", accentLight: "#eef2ff" },
  { id: "most-selling",              name: "Most Selling Products",        description: "Top products by units and revenue",         purpose: "Identify best-performing SKUs by quantity sold and revenue generated",                  category: "channel-sales", keyFields: ["Product","Brand","Category","Units Sold","Revenue","Margin"],               viewType: "bar+table",    needsDateRange: true,  accentColor: "#0ea5e9", accentLight: "#f0f9ff" },
  { id: "master-inventory",          name: "Master Inventory",             description: "Full stock snapshot across all SKUs",       purpose: "Current available, reserved, and unlimited-stock SKUs with cost and price",            category: "inventory",     keyFields: ["Product","Brand","Face Value","Sell Price","Cost","Available","Reserved"],   viewType: "donut+table",  needsDateRange: false, accentColor: "#10b981", accentLight: "#ecfdf5" },
  { id: "code-lifecycle",            name: "Code Lifecycle",               description: "Status of every digital code",              purpose: "Track available, reserved, sold, and invalid codes per batch and SKU",                category: "inventory",     keyFields: ["Code ID","Batch","Product","Face Value","Status","Sold Date","Customer"],   viewType: "table",        needsDateRange: true,  accentColor: "#14b8a6", accentLight: "#f0fdfa" },
  { id: "corporate-account-summary", name: "Corporate Account Summary",    description: "B2B client overview with wallet & orders",  purpose: "Lifetime purchases, wallet balance, and order count per corporate client",            category: "b2b",           keyFields: ["Company","Client","Email","Status","Wallet Balance","Lifetime","Orders"],   viewType: "bar+table",    needsDateRange: false, accentColor: "#8b5cf6", accentLight: "#f5f3ff" },
  { id: "bulk-order",                name: "Bulk Order Report",            description: "Orders with 10+ codes",                     purpose: "High-volume orders with discount, margin, and line-item breakdown",                   category: "b2b",           keyFields: ["Order ID","Client","Date","Total Qty","Avg Discount%","Total Amount"],      viewType: "table",        needsDateRange: true,  accentColor: "#a855f7", accentLight: "#faf5ff" },
  { id: "accounts-receivable-aging", name: "Accounts Receivable Aging",   description: "Outstanding pending orders by age bucket",  purpose: "Identify overdue pending orders per client across 0–30, 31–60, 61–90, 90+ days",    category: "b2b",           keyFields: ["Client","Company","0–30 Days","31–60 Days","61–90 Days","90+ Days","Total"], viewType: "table+aging",  needsDateRange: false, accentColor: "#8b5cf6", accentLight: "#f5f3ff" },
  { id: "real-margin",               name: "Real Margin Report",           description: "True profit per SKU after cost deduction",  purpose: "Net margin per product: selling price minus cost price, aggregated by SKU",          category: "finance",       keyFields: ["Product","Face Value","Sell Price","Cost Price","Units Sold","Margin %"],   viewType: "line+table",   needsDateRange: true,  accentColor: "#f59e0b", accentLight: "#fffbeb" },
  { id: "admin-activity-log",        name: "Admin Activity Log",           description: "All admin actions for security audit",      purpose: "Full audit trail: user changes, pricing updates, order completions, and approvals",  category: "admin-audit",   keyFields: ["Admin","Action","Entity","Result","IP Address","Date"],                     viewType: "table",        needsDateRange: true,  accentColor: "#ef4444", accentLight: "#fef2f2" },
];

// ─── Colour palette for charts ────────────────────────────────────────────────
const CHART_COLORS = ["#3b82f6","#10b981","#f59e0b","#8b5cf6","#ef4444","#06b6d4","#ec4899","#84cc16"];

// ─── Simple bar chart ─────────────────────────────────────────────────────────
function BarChart({ data, color }: { data: ChartPoint[]; color: string }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-2 mb-6">
      {data.slice(0, 8).map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-28 text-xs text-gray-500 dark:text-gray-400 truncate text-right">{d.label}</div>
          <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
            <div
              className="h-full rounded-full flex items-center justify-end pr-2"
              style={{ width: `${Math.max(4, (d.value / max) * 100)}%`, backgroundColor: d.color || CHART_COLORS[i % CHART_COLORS.length] }}
            >
              <span className="text-white text-[10px] font-bold whitespace-nowrap">
                {d.value >= 1000 ? `$${(d.value/1000).toFixed(1)}k` : d.value}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Simple donut chart ───────────────────────────────────────────────────────
function DonutChart({ data }: { data: ChartPoint[] }) {
  if (!data?.length) return null;
  const total = data.reduce((s, d) => s + d.value, 0);
  let cumulative = 0;
  const r = 80, cx = 100, cy = 100;
  const segments = data.slice(0, 6).map((d, i) => {
    const pct = total > 0 ? d.value / total : 0;
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    cumulative += pct;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    return { d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${pct > 0.5 ? 1 : 0},1 ${x2},${y2} Z`, color: CHART_COLORS[i % CHART_COLORS.length], label: d.label, value: d.value };
  });
  return (
    <div className="flex items-center gap-6 mb-6">
      <svg viewBox="0 0 200 200" className="w-40 h-40 shrink-0">
        {segments.map((s, i) => <path key={i} d={s.d} fill={s.color} opacity={0.85} />)}
        <circle cx={cx} cy={cy} r={50} fill="white" className="dark:fill-gray-800" />
      </svg>
      <div className="space-y-1.5 text-xs">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-gray-600 dark:text-gray-300 truncate max-w-[120px]">{s.label}</span>
            <span className="font-bold text-gray-800 dark:text-white ml-auto">{s.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Date range picker ────────────────────────────────────────────────────────
function DateRangePicker({ report, onConfirm, onCancel }: { report: ReportType; onConfirm: (dr: DateRange) => void; onCancel: () => void }) {
  const today = new Date().toISOString().split("T")[0];
  const [dr, setDr] = useState<DateRange>({ from: "", to: today });
  const [err, setErr] = useState("");

  const confirm = () => {
    if (!dr.from) return setErr("Please select a start date");
    if (dr.to && dr.from > dr.to) return setErr("Start date must be before end date");
    onConfirm(dr);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm p-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: report.accentLight }}>
          <svg className="w-6 h-6" fill="none" stroke={report.accentColor} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Select Date Range</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{report.name}</p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">From Date</label>
            <input type="date" value={dr.from} max={today} onChange={e => { setDr({ ...dr, from: e.target.value }); setErr(""); }}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">To Date</label>
            <input type="date" value={dr.to} max={today} onChange={e => { setDr({ ...dr, to: e.target.value }); setErr(""); }}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
          </div>
          {err && <p className="text-xs text-red-500 font-medium">{err}</p>}
        </div>
        <div className="flex gap-3 mt-8">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 text-gray-500 dark:text-gray-400 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">Cancel</button>
          <button onClick={confirm} className="flex-1 px-4 py-2.5 text-white font-bold rounded-xl" style={{ backgroundColor: report.accentColor }}>Next: Verify MFA</button>
        </div>
      </div>
    </div>
  );
}

// ─── Report Viewer Modal ──────────────────────────────────────────────────────
function ReportViewer({ report, dateRange, onClose }: { report: ReportType; dateRange: DateRange; onClose: () => void }) {
  const [data, setData]       = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [page, setPage]       = useState(1);
  const meta = CATEGORY_META[report.category];

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getReport(report.id, {
        from:  dateRange.from || undefined,
        to:    dateRange.to   || undefined,
        page:  p,
        limit: 100,
      });
      setData(res.data);
      setPage(p);
    } catch (e: any) {
      setError(e.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [report.id, dateRange]);

  useEffect(() => { load(1); }, [load]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: report.accentLight }}>
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: report.accentColor }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{report.name}</h2>
              {(dateRange.from || dateRange.to) && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {dateRange.from && `From ${dateRange.from}`}{dateRange.from && dateRange.to && " · "}{dateRange.to && `To ${dateRange.to}`}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: report.accentColor, borderTopColor: "transparent" }} />
              <p className="text-sm text-gray-400">Loading report data…</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-red-500 font-medium">{error}</p>
              <button onClick={() => load(page)} className="text-sm text-blue-600 underline">Retry</button>
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* KPI strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="rounded-2xl p-4 border" style={{ backgroundColor: report.accentLight, borderColor: report.accentColor + "30" }}>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Rows</p>
                  <p className="text-2xl font-bold" style={{ color: report.accentColor }}>{data.pagination?.total ?? data.rows.length}</p>
                </div>
                {data.chartData && data.chartData.length > 0 && (
                  <div className="rounded-2xl p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Top Entry</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{data.chartData[0].label}</p>
                  </div>
                )}
              </div>

              {/* Chart */}
              {data.chartData && data.chartData.length > 0 && (
                <>
                  {(report.viewType === "bar+table" || report.viewType === "line+table") && (
                    <BarChart data={data.chartData} color={report.accentColor} />
                  )}
                  {report.viewType === "donut+table" && <DonutChart data={data.chartData} />}
                </>
              )}

              {/* Table */}
              {data.rows.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm font-medium">No data found for the selected range</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: report.accentLight }}>
                        {data.columns.map((col, i) => (
                          <th key={i} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide whitespace-nowrap" style={{ color: report.accentColor }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((row, ri) => (
                        <tr key={ri} className={ri % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/50"}>
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {/* Colour-code status cells */}
                              {["completed","active"].includes(String(cell).toLowerCase()) ? (
                                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-medium">{cell}</span>
                              ) : ["failed","locked","permanently_blocked","invalid"].includes(String(cell).toLowerCase()) ? (
                                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-medium">{cell}</span>
                              ) : ["pending","reserved"].includes(String(cell).toLowerCase()) ? (
                                <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs font-medium">{cell}</span>
                              ) : String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {data.pagination && data.pagination.total > data.pagination.limit && (
                <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                  <span>
                    Showing {((page - 1) * data.pagination.limit) + 1}–{Math.min(page * data.pagination.limit, data.pagination.total)} of {data.pagination.total}
                  </span>
                  <div className="flex gap-2">
                    <button disabled={page <= 1} onClick={() => load(page - 1)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      ← Prev
                    </button>
                    <button disabled={page * data.pagination.limit >= data.pagination.total} onClick={() => load(page + 1)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Report Card ──────────────────────────────────────────────────────────────
function ReportCard({ report, onView }: { report: ReportType; onView: (r: ReportType) => void }) {
  const meta = CATEGORY_META[report.category];
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className="h-1.5" style={{ backgroundColor: report.accentColor }} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: report.accentLight }}>
            <span className="w-4 h-4 rounded-full" style={{ backgroundColor: report.accentColor }} />
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${meta.light} ${meta.text}`}>{meta.label}</span>
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{report.name}</h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 leading-relaxed">{report.description}</p>
        <div className="flex flex-wrap gap-1 mb-4">
          {report.keyFields.slice(0, 4).map(f => (
            <span key={f} className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{f}</span>
          ))}
          {report.keyFields.length > 4 && (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-400">+{report.keyFields.length - 4}</span>
          )}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/50">
          <div className="flex gap-2 text-[10px] text-gray-400">
            {report.viewType !== "table" && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Chart
              </span>
            )}
            {report.needsDateRange && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Dates
              </span>
            )}
          </div>
          <button onClick={() => onView(report)} className="text-xs font-bold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: report.accentColor }}>
            View Report
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReportingAnalyticsPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch]                 = useState("");
  const [viewingReport, setViewingReport]   = useState<ReportType | null>(null);
  const [pendingReport, setPendingReport]   = useState<ReportType | null>(null);
  const [reportDateRange, setReportDateRange] = useState<DateRange | null>(null);
  const [showMFA, setShowMFA]               = useState(false);
  const [activeDateRange, setActiveDateRange] = useState<DateRange>({ from: "", to: "" });

  const filtered = REPORTS.filter(r => {
    const matchesCat    = activeCategory === "all" || r.category === activeCategory;
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleViewRequest = (report: ReportType) => {
    setPendingReport(report);
    if (report.needsDateRange) {
      // show date picker first — MFA after
    } else {
      setShowMFA(true);
    }
  };

  const onDateConfirmed = (dr: DateRange) => {
    setReportDateRange(dr);
    setShowMFA(true);
  };

  const onMFAVerified = () => {
    if (!pendingReport) return;
    setActiveDateRange(reportDateRange ?? { from: "", to: "" });
    setViewingReport(pendingReport);
    setShowMFA(false);
    setPendingReport(null);
    setReportDateRange(null);
  };

  const categoryCounts = Object.keys(CATEGORY_META).reduce((acc, k) => {
    acc[k] = REPORTS.filter(r => r.category === k).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Dashboard>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">Reporting & Analytics</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Live reports powered by real data</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 px-5 py-3 shadow-sm flex items-center gap-2">
            <span className="text-2xl font-bold">{REPORTS.length}</span>
            <span className="text-xs text-gray-400">Reports<br/>Total</span>
          </div>
        </div>

        {/* Category pills */}
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
          <button onClick={() => setActiveCategory("all")}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${activeCategory === "all" ? "bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 border-transparent shadow-lg" : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}>
            <span className="text-base font-bold">{REPORTS.length}</span>
            <span className="text-[10px] font-medium mt-0.5">All</span>
          </button>
          {Object.entries(CATEGORY_META).map(([key, meta]) => (
            <button key={key} onClick={() => setActiveCategory(activeCategory === key ? "all" : key)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${activeCategory === key ? "text-white shadow-lg border-transparent" : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}
              style={activeCategory === key ? { backgroundColor: meta.color } : {}}>
              <span className="text-base font-bold">{categoryCounts[key]}</span>
              <span className="text-[10px] font-medium mt-0.5 text-center leading-tight">{meta.label}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports…"
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" />
        </div>

        {/* Cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-semibold">No reports match your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(r => <ReportCard key={r.id} report={r} onView={handleViewRequest} />)}
          </div>
        )}
      </div>

      {/* Date range picker */}
      {pendingReport && !showMFA && pendingReport.needsDateRange && (
        <DateRangePicker
          report={pendingReport}
          onConfirm={onDateConfirmed}
          onCancel={() => setPendingReport(null)}
        />
      )}

      {/* MFA modal */}
      {showMFA && pendingReport && (
        <GenericOTPModal
          actionType="Generate Report"
          title="Verify Access"
          description={`Enter your MFA code to view: ${pendingReport.name}`}
          onVerified={onMFAVerified}
          onClose={() => { setShowMFA(false); setPendingReport(null); setReportDateRange(null); }}
        />
      )}

      {/* Report viewer */}
      {viewingReport && (
        <ReportViewer
          report={viewingReport}
          dateRange={activeDateRange}
          onClose={() => setViewingReport(null)}
        />
      )}
    </Dashboard>
  );
}