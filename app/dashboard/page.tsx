"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Dashboard from "@/components/Dashboard";
import { api } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  revenue: {
    total:          number;
    thisMonth:      number;
    lastMonth:      number;
    changePercent:  number | null;
  };
  users: {
    total:               number;
    active:              number;
    pendingVerification: number;
    locked:              number;
    activeClients:       number;
    newThisMonth:        number;
    changePercent:       number | null;
  };
  orders: {
    total:          number;
    pending:        number;
    processing:     number;
    completed:      number;
    failed:         number;
    thisMonth:      number;
    changePercent:  number | null;
  };
  wallet: {
    totalBalance:  number;
    totalWallets:  number;
    frozen:        number;
    pendingTopups: number;
    pendingAmount: number;
  };
  inventory: {
    totalProducts:    number;
    activeProducts:   number;
    inactiveProducts: number;
    outOfStock:       number;
    lowStock:         number;
  };
  recentActivity: {
    type:      string;
    actor:     string;
    detail:    string;
    timestamp: string;
  }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined, currency = true) {
  const num = parseFloat(String(n ?? 0)) || 0;
  if (currency) return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return num.toLocaleString();
}

function Change({ pct }: { pct: number | null }) {
  if (pct === null) return <p className="text-sm text-gray-400 mt-4">No previous data</p>;
  const up = pct >= 0;
  return (
    <p className={`text-sm mt-4 ${up ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
      {up ? "+" : ""}{pct}% from last month
    </p>
  );
}

function activityLabel(type: string) {
  const map: Record<string, string> = {
    user_registered:  "New user registered",
    topup_requested:  "Wallet topup requested",
    topup_approved:   "Wallet topup approved",
    topup_rejected:   "Wallet topup rejected",
    order_placed:     "Order placed",
  };
  return map[type] ?? type.replace(/_/g, " ");
}

function fmtTime(raw: string) {
  if (!raw) return "";
  const d    = new Date(raw);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60)   return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)    return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, change, color, icon, href, linkLabel,
}: {
  label:      string;
  value:      string | number;
  change?:    number | null;
  color:      string;
  icon:       React.ReactNode;
  href?:      string;
  linkLabel?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white mt-2">{value}</p>
        </div>
        <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      {change !== undefined
        ? <Change pct={change ?? null} />
        : href && linkLabel
          ? <Link href={href} className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-4 inline-block">{linkLabel} →</Link>
          : null
      }
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
      <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded mt-4" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router  = useRouter();
  const [user,    setUser]    = useState<{ full_name: string } | null>(null);
  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    const token    = localStorage.getItem("accessToken");
    const userData = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (userData) setUser(JSON.parse(userData));

    api.getAdminDashboard()
      .then(res => setData(res.data))
      .catch(e  => setError(e.message || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <Dashboard>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
            Welcome back, {user?.full_name || "Admin"}!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here's what's happening with your B2B portal today.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex justify-between items-center">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button onClick={() => window.location.reload()} className="text-sm underline text-red-600 dark:text-red-400 ml-4">Retry</button>
          </div>
        )}

        {/* Top 4 stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />) : data && (<>
            <StatCard
              label="Total Revenue"
              value={fmt(data.revenue.total)}
              change={data.revenue.changePercent}
              color="bg-blue-100 dark:bg-blue-900/20"
              icon={<svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
            />
            <StatCard
              label="Active Clients"
              value={fmt(data.users.activeClients, false)}
              change={data.users.changePercent}
              color="bg-green-100 dark:bg-green-900/20"
              icon={<svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>}
            />
            <StatCard
              label="Orders This Month"
              value={fmt(data.orders.thisMonth, false)}
              change={data.orders.changePercent}
              color="bg-purple-100 dark:bg-purple-900/20"
              icon={<svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>}
            />
            <StatCard
              label="Total Wallet Balance"
              value={fmt(data.wallet.totalBalance)}
              color="bg-orange-100 dark:bg-orange-900/20"
              icon={<svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>}
            />
          </>)}
        </div>

        {/* Activity + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Activity</h3>
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !data?.recentActivity?.length ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No activity yet.</p>
            ) : (
              <div className="space-y-4">
                {data.recentActivity.map((a, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {(a.actor?.[0] ?? "?").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{activityLabel(a.type)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{a.actor} · {fmtTime(a.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { href: "/users",    label: "Add User",      color: "blue",   icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" },
                { href: "/products", label: "Add Product",   color: "green",  icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
                { href: "/wallet",   label: "Manage Wallet", color: "purple", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
                { href: "/orders",   label: "View Orders",   color: "orange", icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" },
              ].map(({ href, label, color, icon }) => (
                <Link key={href} href={href}
                  className={`p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-${color}-500 hover:bg-${color}-50 dark:hover:bg-${color}-900/10 transition-colors group`}>
                  <svg className={`w-8 h-8 mx-auto mb-2 text-gray-400 group-hover:text-${color}-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                  </svg>
                  <p className={`text-sm text-gray-600 dark:text-gray-400 group-hover:text-${color}-600 dark:group-hover:text-${color}-400 text-center`}>{label}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom 3 alert cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? [...Array(3)].map((_, i) => <SkeletonCard key={i} />) : data && (<>
            <StatCard
              label="Pending Topups"
              value={data.wallet.pendingTopups}
              color="bg-orange-100 dark:bg-orange-900/20"
              href="/wallet"
              linkLabel="Review requests"
              icon={<svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
            />
            <StatCard
              label="Low Stock Items"
              value={data.inventory.lowStock + data.inventory.outOfStock}
              color="bg-red-100 dark:bg-red-900/20"
              href="/products"
              linkLabel="View inventory"
              icon={<svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>}
            />
            <StatCard
              label="Pending Verifications"
              value={data.users.pendingVerification}
              color="bg-yellow-100 dark:bg-yellow-900/20"
              href="/users"
              linkLabel="View users"
              icon={<svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>}
            />
          </>)}
        </div>
      </div>
    </Dashboard>
  );
}