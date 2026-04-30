// hooks/useOrders.ts
"use client";

import { useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import { mapOrder, computeStats } from "@/types/order.types";
import type { Order, OrderStats } from "@/types/order.types";

const LIMIT = 20;

interface UseOrdersReturn {
  orders:       Order[];
  stats:        OrderStats;
  loading:      boolean;
  error:        string | null;
  page:         number;
  totalPages:   number;
  total:        number;
  searchTerm:   string;
  setSearchTerm:(term: string) => void;
  setPage:      (p: number | ((prev: number) => number)) => void;
  reload:       () => void;
  clearError:   () => void;
  fetchDetail:  (id: string) => Promise<Order | null>;
  completeOrder:      (id: string) => Promise<void>;
  completing:         string | null;
  completeError:      string | null;
  completeResult:     CompleteResult | null;
  clearCompleteError: () => void;
  clearCompleteResult:() => void;
}
 
export interface FulfilledItem {
  productName: string;
  quantity:    number;
  delivered:   number;
}
 
export interface PendingItem {
  productName: string;
  quantity:    number;
  delivered:   number;
  pending:     number;
  reason:      string;
}
 
export interface CompleteResult {
  orderNumber:    string;
  orderStatus:    string;
  deliveryStatus: string;
  fulfilledItems: FulfilledItem[];
  pendingItems:   PendingItem[];
}

export function useOrders(): UseOrdersReturn {
  const [orders,    setOrders]    = useState<Order[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);
  const [totalPages,setTotalPages]= useState(1);
  const [searchTerm,setSearchTerm]= useState("");
 
  const [completing,      setCompleting]      = useState<string | null>(null);
  const [completeError,   setCompleteError]   = useState<string | null>(null);
  const [completeResult,  setCompleteResult]  = useState<CompleteResult | null>(null);
 
  // ─── Load page ─────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAllOrders({ 
        page, 
        limit: LIMIT,
        search: searchTerm || undefined 
      });
      const mapped = (res.data ?? []).map(mapOrder);
      setOrders(mapped);
      setTotal(res.pagination?.total ?? 0);
      setTotalPages(res.pagination?.totalPages ?? 1);
    } catch (e: any) {
      setError(e.message ?? "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);
 
  useEffect(() => { 
    const timer = setTimeout(() => {
        load(); 
    }, 500); // debounce search
    return () => clearTimeout(timer);
  }, [load]);
 
  // ─── Fetch single order detail ──────────────────────────────────────────────
  const fetchDetail = useCallback(async (id: string): Promise<Order | null> => {
    try {
      const res = await api.getAdminOrderById(id);
      return res.data ? mapOrder(res.data) : null;
    } catch { return null; }
  }, []);
 
  // ─── Complete order ─────────────────────────────────────────────────────────
  const completeOrder = useCallback(async (id: string) => {
    setCompleting(id);
    setCompleteError(null);
    setCompleteResult(null);
    try {
      const res = await api.completeOrder(id);
      if (res.data) {
        setCompleteResult({
          orderNumber:    res.data.orderNumber    ?? "",
          orderStatus:    res.data.orderStatus    ?? res.data.status ?? "",
          deliveryStatus: res.data.deliveryStatus ?? "",
          fulfilledItems: res.data.fulfilledItems ?? [],
          pendingItems:   res.data.pendingItems   ?? [],
        });
      }
      await load();
    } catch (e: any) {
      setCompleteError(e.message ?? "Failed to complete order");
    } finally {
      setCompleting(null);
    }
  }, [load]);
 
  const stats = computeStats(orders, total);
 
  return {
    orders,
    stats,
    loading,
    error,
    page,
    totalPages,
    total,
    searchTerm,
    setSearchTerm,
    setPage,
    reload:              load,
    clearError:          () => setError(null),
    fetchDetail,
    completeOrder,
    completing,
    completeError,
    completeResult,
    clearCompleteError:  () => setCompleteError(null),
    clearCompleteResult: () => setCompleteResult(null),
  };
}