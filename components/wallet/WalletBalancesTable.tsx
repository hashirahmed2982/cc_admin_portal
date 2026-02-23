"use client";

import { WalletBalance } from "@/app/wallet/page";
import { useState } from "react";

interface WalletBalancesTableProps {
  balances: WalletBalance[];
}

export default function WalletBalancesTable({ balances }: WalletBalancesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"balance" | "totalTopups" | "totalSpent">("balance");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filteredBalances = balances.filter((balance) =>
    balance.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    balance.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    balance.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedBalances = [...filteredBalances].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
  });

  const handleSort = (column: "balance" | "totalTopups" | "totalSpent") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-4">
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
          placeholder="Search by client name, company, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Client
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort("balance")}
              >
                <div className="flex items-center gap-1">
                  Current Balance
                  {sortBy === "balance" && (
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        sortOrder === "asc" ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Last Topup
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort("totalTopups")}
              >
                <div className="flex items-center gap-1">
                  Total Topups
                  {sortBy === "totalTopups" && (
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        sortOrder === "asc" ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort("totalSpent")}
              >
                <div className="flex items-center gap-1">
                  Total Spent
                  {sortBy === "totalSpent" && (
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        sortOrder === "asc" ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedBalances.map((balance) => (
              <tr
                key={balance.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {balance.userName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {balance.company}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {balance.userEmail}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    ${balance.balance.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Wallet ID: {balance.id}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {balance.lastTopup ? (
                    <div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {balance.lastTopup}
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">
                        +${balance.lastTopupAmount?.toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">No topups yet</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-green-600 dark:text-green-400">
                    ${balance.totalTopups.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-red-600 dark:text-red-400">
                    ${balance.totalSpent.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {balance.createdAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedBalances.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600"
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
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No wallets found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your search criteria
          </p>
        </div>
      )}

      {/* Summary */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Total Balance</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            ${sortedBalances.reduce((sum, b) => sum + b.balance, 0).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Total Topups</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">
            ${sortedBalances.reduce((sum, b) => sum + b.totalTopups, 0).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Total Spent</p>
          <p className="text-lg font-bold text-red-600 dark:text-red-400">
            ${sortedBalances.reduce((sum, b) => sum + b.totalSpent, 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
