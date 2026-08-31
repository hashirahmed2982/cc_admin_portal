"use client";

import { CronJobRun } from "@/types/supplier.types";

interface CronHealthTableProps {
  jobs: CronJobRun[];
}

// The doc's own cadence per job (Master Plan §4 "Cron Jobs, Master Table") —
// used only to flag a job that's gone quiet well past its own schedule.
const EXPECTED_INTERVAL_MIN: Record<string, number> = {
  catalogSync: 360,
  stockSync: 60,
  orderPoller: 5,
  healthCheck: 15,
  balanceMonitor: 30,
  wgcardsTopupReconciler: 10,
};

function minutesAgo(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

function timeAgoLabel(mins: number | null): string {
  if (mins == null) return "never run";
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

export default function CronHealthTable({ jobs }: CronHealthTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Job</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Run</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {jobs.length === 0 && (
            <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No cron runs recorded yet.</td></tr>
          )}
          {jobs.map((job) => {
            const ago = minutesAgo(job.last_run_at);
            const expected = EXPECTED_INTERVAL_MIN[job.job_name];
            const overdue = ago != null && expected != null && ago > expected * 3; // 3x grace before flagging "stuck"
            return (
              <tr key={job.job_name} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{job.job_name}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                  {timeAgoLabel(ago)}
                  {overdue && <span className="ml-2 text-xs font-medium text-orange-600 dark:text-orange-400">(overdue — expected every {expected}m)</span>}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full ${
                    job.last_status === "success"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : job.last_status === "failed"
                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  }`}>
                    {job.last_status || "unknown"}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate" title={job.last_error || JSON.stringify(job.last_summary)}>
                  {job.last_error || (job.last_summary ? JSON.stringify(job.last_summary) : "—")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
