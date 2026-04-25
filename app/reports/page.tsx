"use client";

import Dashboard from "@/components/Dashboard";
import { useState, useCallback, useEffect, useRef, JSX } from "react";
import GenericOTPModal from "@/components/GenericOTPModal";

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
  { id: "channel-performance",      name: "Channel Performance",         description: "Measure sales performance per channel", purpose: "Compare Gross Sales, Net Sales, Commissions and Margin across B2B, Retail, and Wholesale channels", category: "channel-sales", keyFields: ["Channel","Gross Sales","Net Sales","Commission","Refund Rate","Chargeback Rate","Net Margin"], viewType: "bar+table",    needsDateRange: true,  accentColor: "#3b82f6", accentLight: "#eff6ff" },
  { id: "transaction-detailed",     name: "Transaction Detailed",        description: "Full transaction-level reconciliation",  purpose: "Order-by-order reconciliation with payment method, SKU face value vs selling price, and status tracking", category: "channel-sales", keyFields: ["Order ID","Date","Customer","SKU","Face Value","Selling Price","Payment Method","Status"], viewType: "table",       needsDateRange: true,  accentColor: "#3b82f6", accentLight: "#eff6ff" },
  { id: "most-selling",             name: "Most Selling Products",       description: "Top products by quantity and revenue",   purpose: "Rank SKUs by volume and paid amount across all channels to identify star performers", category: "channel-sales", keyFields: ["Channel","SKU","Quantity","Paid Amount"], viewType: "bar+table",    needsDateRange: true,  accentColor: "#3b82f6", accentLight: "#eff6ff" },
  { id: "master-inventory",         name: "Master Inventory",            description: "Stock, capital invested, quantities",    purpose: "Full inventory snapshot: imported vs sold vs remaining with unit costs and total stock value", category: "inventory",     keyFields: ["Brand","SKU","Batch ID","Qty Imported","Qty Sold","Remaining","Unit Cost","Stock Value"], viewType: "donut+table",  needsDateRange: false, accentColor: "#10b981", accentLight: "#f0fdf4" },
  { id: "code-lifecycle",           name: "Code Lifecycle",              description: "Track every code from import to sale",   purpose: "Individual code-level audit trail showing status transitions from import through reservation to sale", category: "inventory",     keyFields: ["Code ID","Batch","SKU","Status","Sold Date","Customer ID"], viewType: "table",       needsDateRange: false, accentColor: "#10b981", accentLight: "#f0fdf4" },
  { id: "corporate-account-summary",name: "Corporate Account Summary",   description: "B2B client credit and lifetime value",   purpose: "Monitor credit utilisation, outstanding balances, and lifetime purchase value per corporate account", category: "b2b",           keyFields: ["Company","Credit Limit","Used Credit","Outstanding","Lifetime Purchases"], viewType: "bar+table",    needsDateRange: false, accentColor: "#8b5cf6", accentLight: "#f5f3ff" },
  { id: "bulk-order",               name: "Bulk Order Report",           description: "Large-volume B2B order tracking",        purpose: "Track bulk orders with discount tiers, margin per order, and invoice references", category: "b2b",           keyFields: ["Bulk Order ID","Client","Quantity","Discount %","Margin","Invoice No"], viewType: "table",       needsDateRange: true,  accentColor: "#8b5cf6", accentLight: "#f5f3ff" },
  { id: "accounts-receivable-aging",name: "Accounts Receivable Aging",  description: "Overdue payment tracking by aging bucket",purpose: "Bucket outstanding payments by age (0–30, 31–60, 61–90, 90+ days) to manage credit risk", category: "b2b",           keyFields: ["Client","0–30 Days","31–60 Days","61–90 Days","90+ Days","Total"], viewType: "table+aging",  needsDateRange: false, accentColor: "#8b5cf6", accentLight: "#f5f3ff" },
  { id: "real-margin",              name: "Real Margin Report",          description: "True profit after all fees deducted",    purpose: "Calculate net margin after commissions, gateway fees, FX charges, and cost price per SKU", category: "finance",       keyFields: ["SKU","Selling Price","Commission","Gateway Fee","FX Fee","Cost Price","Net Margin"], viewType: "line+table",   needsDateRange: true,  accentColor: "#f59e0b", accentLight: "#fffbeb" },
  { id: "admin-activity-log",       name: "Admin Activity Log",         description: "All admin actions for security audit",   purpose: "Full audit trail of admin operations including user changes, pricing updates, and approvals", category: "admin-audit",   keyFields: ["Admin","Action","Date","IP Address","Details"], viewType: "table",       needsDateRange: true,  accentColor: "#ef4444", accentLight: "#fef2f2" },
  { id: "price-sync-log",           name: "Price Sync Log",             description: "Automated and manual price changes",     purpose: "Track every price change across SKUs whether triggered by the sync bot or made manually", category: "automation",    keyFields: ["SKU","Old Price","New Price","Updated By","Timestamp"], viewType: "line+table",   needsDateRange: true,  accentColor: "#06b6d4", accentLight: "#ecfeff" },
];

// ─── Mock data ────────────────────────────────────────────────────────────────

function getMockData(id: string): { columns: string[]; rows: any[][]; chartData?: ChartPoint[] } {
  const d: Record<string, any> = {
    "channel-performance": {
      columns: ["Channel","Gross Sales","Net Sales","Commission","Refund Rate","Chargeback Rate","Net Margin"],
      rows: [["B2B Direct","$128,400","$121,980","$6,420","1.2%","0.3%","18.4%"],["Retail Online","$89,200","$83,100","$6,100","2.8%","0.7%","14.2%"],["Wholesale","$54,700","$52,900","$1,800","0.5%","0.1%","22.1%"]],
      chartData: [{label:"B2B Direct",value:128400,color:"#3b82f6"},{label:"Retail Online",value:89200,color:"#60a5fa"},{label:"Wholesale",value:54700,color:"#93c5fd"}],
    },
    "transaction-detailed": {
      columns: ["Order ID","Date","Customer","SKU","Face Value","Selling Price","Payment Method","Status"],
      rows: [["ORD-9821","2024-02-13","Acme Corp","AMZN-50","$50.00","$44.50","Wallet","Completed"],["ORD-9820","2024-02-13","TechStart","NFLX-100","$100.00","$91.00","Credit Card","Completed"],["ORD-9819","2024-02-12","Global Ltd","STEAM-25","$25.00","$22.75","Wallet","Refunded"],["ORD-9818","2024-02-12","Innovate.io","GOOG-200","$200.00","$184.00","Bank Transfer","Pending"]],
    },
    "most-selling": {
      columns: ["Channel","SKU","Quantity","Paid Amount"],
      rows: [["B2B Direct","AMZN-50","4,820","$214,490"],["Retail Online","NFLX-100","2,341","$212,881"],["B2B Direct","STEAM-25","6,102","$138,821"],["Wholesale","GOOG-200","698","$128,432"],["Retail Online","XBOX-50","1,890","$94,500"]],
      chartData: [{label:"AMZN-50",value:214490,color:"#3b82f6"},{label:"NFLX-100",value:212881,color:"#60a5fa"},{label:"STEAM-25",value:138821,color:"#93c5fd"},{label:"GOOG-200",value:128432,color:"#bfdbfe"},{label:"XBOX-50",value:94500,color:"#dbeafe"}],
    },
    "master-inventory": {
      columns: ["Brand","SKU","Batch ID","Qty Imported","Qty Sold","Remaining","Unit Cost","Stock Value"],
      rows: [["Amazon","AMZN-50","B-1042","10,000","8,240","1,760","$43.50","$76,560"],["Netflix","NFLX-100","B-1043","5,000","4,120","880","$88.00","$77,440"],["Steam","STEAM-25","B-1044","15,000","12,890","2,110","$22.00","$46,420"],["Google","GOOG-200","B-1045","2,000","1,820","180","$178.00","$32,040"]],
      chartData: [{label:"AMZN-50",value:1760,color:"#10b981"},{label:"NFLX-100",value:880,color:"#34d399"},{label:"STEAM-25",value:2110,color:"#6ee7b7"},{label:"GOOG-200",value:180,color:"#a7f3d0"}],
    },
    "code-lifecycle": {
      columns: ["Code ID","Batch","SKU","Status","Sold Date","Customer ID"],
      rows: [["CODE-88821","B-1042","AMZN-50","Sold","2024-02-13","USR-001"],["CODE-88822","B-1042","AMZN-50","Available","—","—"],["CODE-88823","B-1043","NFLX-100","Sold","2024-02-12","USR-004"],["CODE-88824","B-1043","NFLX-100","Reserved","—","USR-007"],["CODE-88825","B-1044","STEAM-25","Sold","2024-02-11","USR-002"]],
    },
    "corporate-account-summary": {
      columns: ["Company","Credit Limit","Used Credit","Outstanding","Lifetime Purchases"],
      rows: [["Acme Corporation","$50,000","$32,400","$12,400","$284,200"],["TechStart Inc","$30,000","$18,900","$8,900","$142,000"],["Global Ltd","$75,000","$41,200","$21,200","$398,500"],["Innovate Solutions","$20,000","$4,800","$0","$68,100"]],
      chartData: [{label:"Acme",value:284200,color:"#8b5cf6"},{label:"TechStart",value:142000,color:"#a78bfa"},{label:"Global",value:398500,color:"#7c3aed"},{label:"Innovate",value:68100,color:"#c4b5fd"}],
    },
    "bulk-order": {
      columns: ["Bulk Order ID","Client","Quantity","Discount %","Margin","Invoice No"],
      rows: [["BO-441","Acme Corporation","5,000 codes","12%","14.2%","INV-2024-0441"],["BO-440","Global Ltd","8,200 codes","15%","12.8%","INV-2024-0440"],["BO-439","TechStart Inc","2,100 codes","8%","17.4%","INV-2024-0439"]],
    },
    "accounts-receivable-aging": {
      columns: ["Client","0–30 Days","31–60 Days","61–90 Days","90+ Days","Total"],
      rows: [["Acme Corporation","$12,400","$0","$0","$0","$12,400"],["TechStart Inc","$8,900","$0","$0","$0","$8,900"],["Global Ltd","$6,200","$9,800","$5,200","$0","$21,200"],["Innovate Solutions","$0","$0","$0","$0","$0"],["Bright Co","$0","$2,400","$4,800","$7,200","$14,400"]],
    },
    "real-margin": {
      columns: ["SKU","Selling Price","Commission","Gateway Fee","FX Fee","Cost Price","Net Margin"],
      rows: [["AMZN-50","$44.50","$2.23","$0.89","$0.45","$38.50","6.14%"],["NFLX-100","$91.00","$4.55","$1.82","$0.91","$78.00","6.29%"],["STEAM-25","$22.75","$1.14","$0.46","$0.23","$19.50","6.26%"],["GOOG-200","$184.00","$9.20","$3.68","$1.84","$158.00","6.13%"]],
      chartData: [{label:"AMZN-50",value:6.14,color:"#f59e0b"},{label:"NFLX-100",value:6.29,color:"#fbbf24"},{label:"STEAM-25",value:6.26,color:"#fcd34d"},{label:"GOOG-200",value:6.13,color:"#fde68a"}],
    },
    "admin-activity-log": {
      columns: ["Admin","Action","Date","IP Address","Details"],
      rows: [["Super Admin","User account locked","2024-02-13 10:30","192.168.1.1","User: USR-042"],["Admin User 1","Price updated","2024-02-13 09:15","192.168.1.2","SKU: AMZN-50 $43→$44"],["Super Admin","Topup approved","2024-02-12 17:00","192.168.1.1","REQ-012, $500"],["Admin User 2","Code batch imported","2024-02-12 14:20","192.168.1.3","Batch B-1046, 2000 codes"]],
    },
    "price-sync-log": {
      columns: ["SKU","Old Price","New Price","Updated By","Timestamp"],
      rows: [["AMZN-50","$43.50","$44.50","Admin User 1","2024-02-13 09:15:22"],["NFLX-100","$87.00","$88.00","Price Sync Bot","2024-02-13 08:00:00"],["STEAM-25","$21.50","$22.00","Price Sync Bot","2024-02-12 08:00:00"],["GOOG-200","$175.00","$178.00","Super Admin","2024-02-11 14:32:10"]],
      chartData: [{label:"AMZN-50",value:44.50,color:"#06b6d4"},{label:"NFLX-100",value:88.00,color:"#22d3ee"},{label:"STEAM-25",value:22.00,color:"#67e8f9"},{label:"GOOG-200",value:178.00,color:"#a5f3fc"}],
    },
  };
  return d[id] || { columns: [], rows: [] };
}

// ─── SVG Bar Chart ────────────────────────────────────────────────────────────

function BarChart({ data, height = 220 }: { data: ChartPoint[]; height?: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(t); }, []);

  const W = 600, H = height, PAD = { top: 20, right: 20, bottom: 50, left: 70 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const max = Math.max(...data.map(d => d.value)) * 1.15;
  const barW = Math.min(60, (innerW / data.length) * 0.6);
  const gap = innerW / data.length;

  const fmt = (v: number) => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `${v.toFixed(2)}%`;

  const yTicks = 5;
  const yLines = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = (max / yTicks) * i;
    const y = PAD.top + innerH - (val / max) * innerH;
    return { val, y };
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      {/* Grid lines */}
      {yLines.map((line, i) => (
        <g key={i}>
          <line x1={PAD.left} y1={line.y} x2={W - PAD.right} y2={line.y} stroke="currentColor" strokeOpacity={0.08} strokeWidth={1} />
          <text x={PAD.left - 8} y={line.y + 4} textAnchor="end" fontSize={10} fill="currentColor" fillOpacity={0.45}>
            {fmt(line.val)}
          </text>
        </g>
      ))}

      {/* Bars */}
      {data.map((d, i) => {
        const barH = animated ? (d.value / max) * innerH : 0;
        const x = PAD.left + gap * i + gap / 2 - barW / 2;
        const y = PAD.top + innerH - barH;
        const color = d.color || "#3b82f6";

        return (
          <g key={i}>
            <rect x={x + 3} y={y + 3} width={barW} height={barH} rx={6} fill={color} opacity={0.15} />
            <rect
              x={x} y={y} width={barW} height={barH} rx={6}
              fill={`url(#grad-${i})`}
              style={{ transition: "height 0.7s cubic-bezier(0.34,1.56,0.64,1), y 0.7s cubic-bezier(0.34,1.56,0.64,1)" }}
            />
            {barH > 20 && (
              <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize={10} fontWeight="600" fill={color}>
                {fmt(d.value)}
              </text>
            )}
            <text x={x + barW / 2} y={H - PAD.bottom + 16} textAnchor="middle" fontSize={10} fill="currentColor" fillOpacity={0.6}>
              {d.label.length > 10 ? d.label.slice(0, 9) + "…" : d.label}
            </text>
            <defs>
              <linearGradient id={`grad-${i}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={1} />
                <stop offset="100%" stopColor={color} stopOpacity={0.6} />
              </linearGradient>
            </defs>
          </g>
        );
      })}

      {/* X axis */}
      <line x1={PAD.left} y1={PAD.top + innerH} x2={W - PAD.right} y2={PAD.top + innerH} stroke="currentColor" strokeOpacity={0.15} strokeWidth={1} />
    </svg>
  );
}

// ─── SVG Donut Chart ──────────────────────────────────────────────────────────

function DonutChart({ data }: { data: ChartPoint[] }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 150); return () => clearTimeout(t); }, []);

  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = 120, cy = 120, r = 90, ir = 58;
  let cumAngle = -Math.PI / 2;

  const slices = data.map(d => {
    const angle = (d.value / total) * 2 * Math.PI;
    const startAngle = cumAngle;
    cumAngle += angle;
    const endAngle = cumAngle;
    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
    const ix1 = cx + ir * Math.cos(startAngle), iy1 = cy + ir * Math.sin(startAngle);
    const ix2 = cx + ir * Math.cos(endAngle), iy2 = cy + ir * Math.sin(endAngle);
    const large = angle > Math.PI ? 1 : 0;
    const path = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${ir} ${ir} 0 ${large} 0 ${ix1} ${iy1} Z`;
    return { path, color: d.color || "#3b82f6", label: d.label, value: d.value, pct: ((d.value / total) * 100).toFixed(1) };
  });

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 240 240" className="flex-shrink-0" style={{ width: 180, height: 180 }}>
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} opacity={animated ? 1 : 0}
            style={{ transition: `opacity 0.5s ease ${i * 0.1}s`, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}
            className="hover:opacity-80 transition-opacity cursor-pointer"
          />
        ))}
        <circle cx={cx} cy={cy} r={ir - 4} fill="white" className="dark:fill-gray-800" />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={11} fill="currentColor" fillOpacity={0.5}>Total</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={16} fontWeight="700" fill="currentColor">
          {total.toLocaleString()}
        </text>
      </svg>
      <div className="flex flex-col gap-2 min-w-0">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{s.label}</span>
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 ml-auto pl-2">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────

function LineChart({ data, color = "#f59e0b", height = 180 }: { data: ChartPoint[]; color?: string; height?: number }) {
  const [animated, setAnimated] = useState(false);
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLen, setPathLen] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(t); }, []);
  useEffect(() => { if (pathRef.current) setPathLen(pathRef.current.getTotalLength()); }, [data]);

  const W = 600, H = height, PAD = { top: 24, right: 20, bottom: 44, left: 60 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const max = Math.max(...data.map(d => d.value)) * 1.2;
  const min = Math.min(...data.map(d => d.value)) * 0.85;
  const range = max - min;

  const pts = data.map((d, i) => ({
    x: PAD.left + (i / (data.length - 1)) * innerW,
    y: PAD.top + innerH - ((d.value - min) / range) * innerH,
    ...d,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length-1].x} ${PAD.top + innerH} L ${pts[0].x} ${PAD.top + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="linearea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {[0,0.25,0.5,0.75,1].map((t, i) => {
        const val = min + range * (1 - t);
        const y = PAD.top + innerH * t;
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={W-PAD.right} y2={y} stroke="currentColor" strokeOpacity={0.07} strokeWidth={1} />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={9} fill="currentColor" fillOpacity={0.4}>{val.toFixed(2)}</text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#linearea)" />
      <path ref={pathRef} d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={pathLen} strokeDashoffset={animated ? 0 : pathLen}
        style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
      />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={5} fill="white" stroke={color} strokeWidth={2} className="dark:fill-gray-800"
            opacity={animated ? 1 : 0} style={{ transition: `opacity 0.3s ease ${0.8 + i * 0.05}s` }}
          />
          <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize={9} fontWeight="600" fill={color} opacity={animated ? 1 : 0}
            style={{ transition: `opacity 0.3s ease ${0.9 + i * 0.05}s` }}
          >
            {p.value.toFixed(2)}
          </text>
          <text x={p.x} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={9} fill="currentColor" fillOpacity={0.5}>
            {p.label.length > 8 ? p.label.slice(0, 7) + "…" : p.label}
          </text>
        </g>
      ))}
      <line x1={PAD.left} y1={PAD.top + innerH} x2={W - PAD.right} y2={PAD.top + innerH} stroke="currentColor" strokeOpacity={0.12} />
    </svg>
  );
}

// ─── Status badge for table cells ─────────────────────────────────────────────

function StatusBadge({ value }: { value: string }) {
  const v = value.toLowerCase();
  if (v === "completed" || v === "sold" || v === "available")
    return <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">{value}</span>;
  if (v === "pending" || v === "reserved" || v === "processing")
    return <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">{value}</span>;
  if (v === "refunded" || v === "failed")
    return <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">{value}</span>;
  return <span>{value}</span>;
}

// ─── Data table ───────────────────────────────────────────────────────────────

function DataTable({ columns, rows, accentColor }: { columns: string[]; rows: any[][]; accentColor: string }) {
  const isStatus = (v: string) => ["completed","pending","refunded","failed","sold","available","reserved","processing"].includes(v.toLowerCase());
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700/60">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: accentColor + "12" }}>
            {columns.map((col, i) => (
              <th key={i} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                style={{ color: accentColor }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={`border-t border-gray-100 dark:border-gray-700/40 ${ri % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/30"} hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors`}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300 text-xs">
                  {isStatus(String(cell)) ? <StatusBadge value={String(cell)} /> : String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Aging table ──────────────────────────────────────────────────────────────

function AgingTable({ columns, rows }: { columns: string[]; rows: any[][] }) {
  const agingCellStyle = (val: string, colIdx: number) => {
    if (colIdx === 0 || val === "$0") return "";
    const styles = ["","text-green-700 dark:text-green-400 font-semibold","text-amber-600 dark:text-amber-400 font-semibold","text-orange-600 dark:text-orange-400 font-semibold","text-red-600 dark:text-red-400 font-semibold",""];
    return val !== "$0" ? styles[colIdx] || "" : "";
  };
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700/60">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-violet-50/80 dark:bg-violet-900/20">
            {columns.map((col, i) => (
              <th key={i} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${i===0?"text-violet-700 dark:text-violet-300":i===1?"text-green-700 dark:text-green-400":i===2?"text-amber-700 dark:text-amber-400":i===3?"text-orange-700 dark:text-orange-400":i===4?"text-red-700 dark:text-red-400":"text-gray-700 dark:text-gray-300"}`}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={`border-t border-gray-100 dark:border-gray-700/40 ${ri%2===0?"bg-white dark:bg-gray-900":"bg-gray-50/50 dark:bg-gray-800/30"} hover:bg-violet-50/20 transition-colors`}>
              {row.map((cell, ci) => (
                <td key={ci} className={`px-4 py-3 whitespace-nowrap text-xs ${agingCellStyle(String(cell), ci) || "text-gray-700 dark:text-gray-300"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Export helpers ───────────────────────────────────────────────────────────

function exportCSV(report: ReportType, data: { columns: string[]; rows: any[][] }) {
  const csv = [data.columns.join(","), ...data.rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = `${report.id}-${new Date().toISOString().split("T")[0]}.csv`; a.click();
}

function exportJSON(report: ReportType, data: { columns: string[]; rows: any[][] }) {
  const objects = data.rows.map(r => Object.fromEntries(data.columns.map((c, i) => [c, r[i]])));
  const blob = new Blob([JSON.stringify(objects, null, 2)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = `${report.id}-${new Date().toISOString().split("T")[0]}.json`; a.click();
}

// ─── Date Range Step ──────────────────────────────────────────────────────────

function DateRangeStep({ report, onConfirm, onCancel }: { report: ReportType; onConfirm: (dr: DateRange) => void; onCancel: () => void }) {
  const today = new Date().toISOString().split("T")[0];
  const [dr, setDr] = useState<DateRange>({ from: "", to: today });
  const [err, setErr] = useState("");

  const confirm = () => {
    if (!dr.from || !dr.to) { setErr("Both dates required"); return; }
    if (dr.from > dr.to) { setErr("'From' must be before 'To'"); return; }
    onConfirm(dr);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="h-1.5" style={{ backgroundColor: report.accentColor }} />
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{report.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">Select report date range</p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">From Date</label>
              <input type="date" value={dr.from} max={today} onChange={e => { setDr({ ...dr, from: e.target.value }); setErr(""); }}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">To Date</label>
              <input type="date" value={dr.to} max={today} onChange={e => { setDr({ ...dr, to: e.target.value }); setErr(""); }}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
              />
            </div>
            {err && <p className="text-xs text-red-500 font-medium">{err}</p>}
          </div>

          <div className="flex gap-3 mt-8">
            <button onClick={onCancel} className="flex-1 px-4 py-2.5 text-gray-500 dark:text-gray-400 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">
              Cancel
            </button>
            <button onClick={confirm} className="flex-1 px-4 py-2.5 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20"
              style={{ backgroundColor: report.accentColor }}>
              Next: Verify MFA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Report Viewer Modal ──────────────────────────────────────────────────────

function ReportViewer({ report, dateRange, onClose }: { report: ReportType; dateRange: DateRange; onClose: () => void }) {
  const data = getMockData(report.id);
  const meta = CATEGORY_META[report.category];

  const kpis = data.rows.length > 0 ? data.columns.slice(1, 4).map((col, i) => ({
    label: col, value: data.rows[0][i + 1] as string,
  })) : [];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 pt-6">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl mb-6 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="relative px-8 py-6 overflow-hidden" style={{ background: `linear-gradient(135deg, ${report.accentColor}22 0%, ${report.accentColor}08 100%)` }}>
          <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full opacity-10" style={{ backgroundColor: report.accentColor }} />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl text-white flex items-center justify-center shadow-lg flex-shrink-0"
                style={{ backgroundColor: report.accentColor }}>
                <div className="w-7 h-7">{getCategoryIcon(report.category)}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{report.name}</h2>
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${meta.light} ${meta.text} ${meta.border} border`}>
                    {meta.label}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl">{report.purpose}</p>
                {report.needsDateRange && dateRange.from && (
                  <p className="text-xs mt-1 font-medium" style={{ color: report.accentColor }}>
                    📅 {dateRange.from} → {dateRange.to}
                  </p>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          {kpis.length > 0 && (
            <div className="flex gap-4 mt-5">
              {kpis.map((kpi, i) => (
                <div key={i} className="bg-white/70 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/50 dark:border-gray-700/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{kpi.label}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{kpi.value}</p>
                </div>
              ))}
              <div className="bg-white/70 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/50 dark:border-gray-700/50">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Records</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{data.rows.length}</p>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-8 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700/60">
          <div className="flex flex-wrap gap-1.5">
            {report.keyFields.map((f, i) => (
              <span key={i} className="px-2 py-0.5 text-xs rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">{f}</span>
            ))}
          </div>
          <div className="flex gap-2 flex-shrink-0 ml-4">
            <button onClick={() => exportCSV(report, data)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 transition-colors"><DownloadIcon /> CSV</button>
            <button onClick={() => exportJSON(report, data)} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white transition-opacity hover:opacity-90" style={{ backgroundColor: report.accentColor }}><DownloadIcon /> JSON</button>
          </div>
        </div>
        {data.chartData && data.chartData.length > 0 && (
          <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700/60">
            <div className="bg-gray-50/60 dark:bg-gray-800/40 rounded-2xl p-4">
              {report.viewType === "donut+table" && <DonutChart data={data.chartData} />}
              {report.viewType === "line+table" && <LineChart data={data.chartData} color={report.accentColor} />}
              {report.viewType === "bar+table"  && <BarChart data={data.chartData} />}
            </div>
          </div>
        )}
        <div className="px-8 py-6">
          {report.viewType === "table+aging" ? <AgingTable columns={data.columns} rows={data.rows} /> : <DataTable columns={data.columns} rows={data.rows} accentColor={report.accentColor} />}
        </div>
        <div className="px-8 py-4 border-t border-gray-100 dark:border-gray-700/60 flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Report Card ──────────────────────────────────────────────────────────────

function ReportCard({ report, onView, index }: { report: ReportType; onView: () => void; index: number }) {
  const meta = CATEGORY_META[report.category];
  return (
    <div className="group relative bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700/60 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
      style={{ animationDelay: `${index * 60}ms` }} onClick={onView}>
      <div className="h-1" style={{ backgroundColor: report.accentColor }} />
      <div className="p-5 flex flex-col flex-1 relative">
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: report.accentColor }}>
            <div className="w-5 h-5">{getCategoryIcon(report.category)}</div>
          </div>
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${meta.light} ${meta.text} ${meta.border}`}>{meta.label}</span>
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1.5 leading-snug">{report.name}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4 flex-1">{report.description}</p>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/50">
          <div className="flex gap-2 text-[10px] text-gray-400">
            {report.viewType !== "table" && <span className="flex items-center gap-0.5"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>Chart</span>}
            {report.needsDateRange && <span className="flex items-center gap-0.5"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>Dates</span>}
          </div>
          <div className="text-xs font-bold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: report.accentColor }}>View Report</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportingAnalyticsPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [viewingReport, setViewingReport] = useState<ReportType | null>(null);
  const [pendingReport, setPendingReport] = useState<ReportType | null>(null);
  const [reportDateRange, setReportDateRange] = useState<DateRange | null>(null);
  const [showMFA, setShowMFA] = useState(false);
  const [activeDateRange, setActiveDateRange] = useState<DateRange>({ from: "", to: "" });

  const filtered = REPORTS.filter(r => {
    const matchesCat = activeCategory === "all" || r.category === activeCategory;
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleViewRequest = (report: ReportType) => {
    setPendingReport(report);
    if (report.needsDateRange) {
      // Show date picker first
    } else {
      setShowMFA(true);
    }
  };

  const onDateConfirmed = (dr: DateRange) => {
    setReportDateRange(dr);
    setShowMFA(true);
  };

  const onMFAVerified = (otp: string) => {
    if (!pendingReport) return;
    // OTP verified, now show the report (using provided otp if needed for real API call later)
    if (reportDateRange) setActiveDateRange(reportDateRange);
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
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">Reporting & Analytics</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">View live reports with charts and tables</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 px-5 py-3 shadow-sm flex items-center gap-2">
            <span className="text-2xl font-bold">{REPORTS.length}</span>
            <span className="text-xs text-gray-400">Reports<br/>Total</span>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {Object.entries(CATEGORY_META).map(([key, meta]) => (
            <button key={key} onClick={() => setActiveCategory(activeCategory === key ? "all" : key)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${activeCategory === key ? "text-white shadow-lg" : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"}`}
              style={activeCategory === key ? { backgroundColor: meta.color, borderColor: meta.color } : {}}>
              <span className="text-xl font-bold">{categoryCounts[key]}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">{meta.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((report, i) => (
            <ReportCard key={report.id} report={report} index={i} onView={() => handleViewRequest(report)} />
          ))}
        </div>
      </div>

      {/* Workflow: Step 1 - Date Range (if required) */}
      {pendingReport && pendingReport.needsDateRange && !reportDateRange && !showMFA && (
        <DateRangeStep report={pendingReport} onConfirm={onDateConfirmed} onCancel={() => setPendingReport(null)} />
      )}

      {/* Workflow: Step 2 - MFA Verification */}
      {showMFA && pendingReport && (
        <GenericOTPModal
          title="Verify Report Request"
          description={`Please enter the code sent to your email to generate the ${pendingReport.name}.`}
          actionType="report_generation_action"
          confirmButtonText="Verify & View Report"
          details={
            <div className="text-sm">
              <p className="text-gray-500 font-medium">Requesting Report:</p>
              <p className="text-gray-900 dark:text-white font-bold">{pendingReport.name}</p>
              {reportDateRange && <p className="text-blue-600 font-semibold mt-1">📅 {reportDateRange.from} to {reportDateRange.to}</p>}
            </div>
          }
          onVerified={onMFAVerified}
          onClose={() => { setShowMFA(false); setPendingReport(null); setReportDateRange(null); }}
        />
      )}

      {/* Final Step: Show Report */}
      {viewingReport && (
        <ReportViewer report={viewingReport} dateRange={activeDateRange} onClose={() => setViewingReport(null)} />
      )}
    </Dashboard>
  );
}

function getCategoryIcon(cat: string) {
  const icons: Record<string, JSX.Element> = {
    "channel-sales": <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    "inventory":     <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
    "b2b":           <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    "finance":       <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    "admin-audit":   <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    "automation":    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  };
  return icons[cat] || <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
}

function DownloadIcon() {
  return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
}
