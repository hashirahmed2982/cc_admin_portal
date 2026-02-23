"use client";

import Dashboard from "@/components/Dashboard";
import { useState } from "react";
import RequestReport2FAModal from "@/components/reports/RequestReport2FAModal";

export interface ReportType {
  id: string;
  name: string;
  description: string;
  category: "sales" | "products" | "audit" | "clients";
  icon: React.ReactNode;
  estimatedTime: string;
  requiresSuperAdmin: boolean;
}

const reportTypes: ReportType[] = [
  {
    id: "sales-daily",
    name: "Daily Sales Report",
    description: "Comprehensive sales data for the selected date",
    category: "sales",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    estimatedTime: "2-3 minutes",
    requiresSuperAdmin: true,
  },
  {
    id: "sales-weekly",
    name: "Weekly Sales Report",
    description: "Sales summary and trends for the past 7 days",
    category: "sales",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    estimatedTime: "3-4 minutes",
    requiresSuperAdmin: true,
  },
  {
    id: "sales-monthly",
    name: "Monthly Sales Report",
    description: "Complete monthly sales analysis with charts and insights",
    category: "sales",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    estimatedTime: "4-5 minutes",
    requiresSuperAdmin: true,
  },
  {
    id: "price-list",
    name: "Price List Report",
    description: "All products currently available for sale with prices",
    category: "products",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
    estimatedTime: "1-2 minutes",
    requiresSuperAdmin: true,
  },
  {
    id: "price-comparison",
    name: "Price Comparison Report",
    description: "Compare supplier prices vs internal inventory pricing",
    category: "products",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    estimatedTime: "3-4 minutes",
    requiresSuperAdmin: true,
  },
  {
    id: "audit-log",
    name: "Audit Log Report",
    description: "All administrative activities and system changes",
    category: "audit",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    estimatedTime: "5-7 minutes",
    requiresSuperAdmin: true,
  },
  {
    id: "client-activity",
    name: "Client Activity Report",
    description: "User login activity, session duration, and engagement metrics",
    category: "clients",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    estimatedTime: "3-4 minutes",
    requiresSuperAdmin: true,
  },
  {
    id: "purchase-history",
    name: "Purchase History Report",
    description: "Complete purchase history across all clients with detailed breakdowns",
    category: "sales",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    estimatedTime: "4-6 minutes",
    requiresSuperAdmin: true,
  },
];

interface ReportRequest {
  id: string;
  reportType: string;
  reportName: string;
  requestedBy: string;
  requestedAt: string;
  status: "processing" | "sent" | "failed";
  emailSentTo: string;
  completedAt?: string;
  dateRange?: {
    from: string;
    to: string;
  };
}

const mockRecentRequests: ReportRequest[] = [
  {
    id: "RPT-001",
    reportType: "sales-monthly",
    reportName: "Monthly Sales Report",
    requestedBy: "Super Admin",
    requestedAt: "2024-02-13 10:30:00",
    status: "sent",
    emailSentTo: "superadmin@company.com",
    completedAt: "2024-02-13 10:35:00",
    dateRange: { from: "2024-01-01", to: "2024-01-31" },
  },
  {
    id: "RPT-002",
    reportType: "audit-log",
    reportName: "Audit Log Report",
    requestedBy: "Super Admin",
    requestedAt: "2024-02-12 16:20:00",
    status: "sent",
    emailSentTo: "superadmin@company.com",
    completedAt: "2024-02-12 16:27:00",
  },
  {
    id: "RPT-003",
    reportType: "sales-daily",
    reportName: "Daily Sales Report",
    requestedBy: "Super Admin",
    requestedAt: "2024-02-13 09:15:00",
    status: "processing",
    emailSentTo: "superadmin@company.com",
  },
];

export default function ReportingAnalyticsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [recentRequests, setRecentRequests] = useState<ReportRequest[]>(mockRecentRequests);
  
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);

  const categories = [
    { id: "all", name: "All Reports", count: reportTypes.length },
    {
      id: "sales",
      name: "Sales Reports",
      count: reportTypes.filter((r) => r.category === "sales").length,
    },
    {
      id: "products",
      name: "Product Reports",
      count: reportTypes.filter((r) => r.category === "products").length,
    },
    {
      id: "audit",
      name: "Audit Reports",
      count: reportTypes.filter((r) => r.category === "audit").length,
    },
    {
      id: "clients",
      name: "Client Reports",
      count: reportTypes.filter((r) => r.category === "clients").length,
    },
  ];

  const filteredReports = reportTypes.filter((report) => {
    const matchesCategory =
      selectedCategory === "all" || report.category === selectedCategory;
    const matchesSearch = report.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleRequestReport = (report: ReportType) => {
    setSelectedReport(report);
    setShowRequestModal(true);
  };

  const handleReportRequested = (dateRange?: { from: string; to: string }) => {
    if (!selectedReport) return;

    const newRequest: ReportRequest = {
      id: `RPT-${recentRequests.length + 1}`,
      reportType: selectedReport.id,
      reportName: selectedReport.name,
      requestedBy: "Super Admin",
      requestedAt: new Date().toISOString(),
      status: "processing",
      emailSentTo: "superadmin@company.com",
      dateRange,
    };

    setRecentRequests([newRequest, ...recentRequests]);
    setShowRequestModal(false);
    setSelectedReport(null);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      sent: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      failed: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    };
    return styles[status as keyof typeof styles];
  };

  return (
    <Dashboard>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
            Reporting & Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Generate and receive comprehensive reports via email
          </p>
        </div>

        {/* Security Notice */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
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
            <div className="text-sm text-red-700 dark:text-red-300">
              <p className="font-medium">Super Admin Access Required with 2FA</p>
              <p className="mt-1">
                All reports require Two-Factor Authentication (2FA) verification. Reports are generated as PDFs and sent directly to your registered email address. Reports are never displayed on the portal for security reasons.
              </p>
            </div>
          </div>
        </div>

        {/* Info Box */}
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
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium">How It Works:</p>
              <ol className="mt-2 space-y-1 list-decimal list-inside">
                <li>Select a report type from the options below</li>
                <li>Enter OTP code sent to your email address</li>
                <li>System generates the report as a PDF (2-7 minutes)</li>
                <li>PDF is automatically sent to your registered email</li>
                <li>Check your recent requests below for status updates</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === category.id
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {category.name}
              <span className="ml-2 px-2 py-0.5 text-xs bg-white bg-opacity-20 rounded-full">
                {category.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                  {report.icon}
                </div>
                {report.requiresSuperAdmin && (
                  <span className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 rounded">
                    Super Admin
                  </span>
                )}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {report.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {report.description}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                <span className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4"
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
                  {report.estimatedTime}
                </span>
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                  {report.category}
                </span>
              </div>

              <button
                onClick={() => handleRequestReport(report)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Request Report
              </button>
            </div>
          ))}
        </div>

        {/* Recent Requests */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Report Requests
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Report
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Requested
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {request.reportName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {request.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {request.requestedAt}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {request.dateRange
                        ? `${request.dateRange.from} to ${request.dateRange.to}`
                        : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(
                          request.status
                        )}`}
                      >
                        {request.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {request.emailSentTo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Request Modal with 2FA */}
      {showRequestModal && selectedReport && (
        <RequestReport2FAModal
          report={selectedReport}
          onClose={() => {
            setShowRequestModal(false);
            setSelectedReport(null);
          }}
          onConfirm={handleReportRequested}
        />
      )}
    </Dashboard>
  );
}