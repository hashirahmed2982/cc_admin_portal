// types/supplier.types.ts
export interface SupplierHealth {
  supplierName: string;
  isActive: boolean;
  integrationStatus: "healthy" | "down";
  consecutiveFailures: number;
  downSince: string | null;
  lastSync: string | null;
  apiBaseUrl: string;
  // Only populated for super_admin — plain admin gets null for all of these.
  balance: number | null;
  balanceCurrency: string | null;
  balanceCheckedAt: string | null;
  lowBalanceThreshold: number | null;
}

export interface SupplierLogEntry {
  api_log_id: number;
  endpoint: string;
  method: string;
  status_code: number;
  response_time: number;
  supplier_request: Record<string, unknown> | null;
  supplier_response: Record<string, unknown> | null;
  supplier_name: string;
  error_message: string | null;
  created_at: string;
}

export interface CronJobRun {
  job_name: string;
  last_run_at: string | null;
  last_status: "success" | "failed" | null;
  last_summary: Record<string, unknown> | null;
  last_error: string | null;
  updated_at: string;
}

// Master Plan §10 — one supplier's offer for one canonical SKU. The
// dispatcher (supplierSelection.service.js) reads is_active/
// admin_priority_override directly; this is the admin-facing view/control
// of the same row.
export interface SkuSupplierLink {
  link_id: number;
  sku_id: number;
  sku_name: string;
  supplier: string;
  supplier_ref: string | null;
  supplier_sku_ref: string;
  cost_price: number;
  cost_currency: string;
  cost_price_base_currency: number | null;
  stock_status: "in_stock" | "out_of_stock" | "unknown";
  is_active: boolean | number;
  admin_priority_override: "always_prefer" | "never_use" | null;
  last_synced_at: string | null;
}

export interface TopupOrder {
  topup_order_id: number;
  order_reference: string;
  wgcards_order_id: string | null;
  target_account: string | null;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "confirmed" | "failed" | "cancelled";
  webhook_status: number | null;
  webhook_attempts: number;
  resolved_via: "webhook" | "reconciler" | null;
  created_at: string;
  resolved_at: string | null;
  userEmail: string;
  product_name: string;
}
