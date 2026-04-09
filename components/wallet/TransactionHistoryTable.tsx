"use client";

// components/wallet/TransactionHistoryTable.tsx
// Matches the Transaction shape returned by GET /api/v1/wallet/transactions/all

import { Transaction } from "@/app/wallet/page";

interface Props {
  transactions: Transaction[];
}

export default function TransactionHistoryTable({ transactions }: Props) {
  const formatDate = (d: string) =>
    new Date(d).toLocaleString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            {["ID", "Client", "Type", "Amount", "Balance After", "Description", "Date", "Processed By"].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {transactions.map((tx) => (
            <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">#{tx.id}</td>
              <td className="px-4 py-3">
                <div className="text-sm font-medium text-gray-900 dark:text-white">{tx.userName}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{tx.company}</div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    tx.type === "credit"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                  }`}
                >
                  {tx.type === "credit" ? "▲ Credit" : "▼ Debit"}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`text-sm font-bold ${
                    tx.type === "credit"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {tx.type === "credit" ? "+" : "-"}${tx.amount.toLocaleString()}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                ${tx.balanceAfter.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                {tx.description ?? (tx.referenceType ? `${tx.referenceType} #${tx.referenceId}` : "—")}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {formatDate(tx.createdAt)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                {tx.processedByName ?? "System"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {transactions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500 dark:text-gray-400">No transactions found</p>
        </div>
      )}
    </div>
  );
}