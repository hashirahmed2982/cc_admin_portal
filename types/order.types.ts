// types/order.types.ts

export interface OrderItem {
  orderDetailId:  number;
  productId:      number;
  productName:    string;
  skuId:          number;
  quantity:       number;
  deliveredQty:   number;
  pendingQty:     number;
  unitPrice:      number;
  deliveryStatus: "pending" | "partial" | "completed" | "failed";
}

export interface Order {
  id:             string;
  orderNumber:    string;
  status:         "pending" | "processing" | "completed" | "failed" | "cancelled";
  deliveryStatus: "pending" | "partial" | "completed" | "failed";
  total:          number;
  currency:       string;
  createdAt:      string;
  completedAt:    string | null;
  clientName:     string;
  clientEmail:    string;
  clientCompany:  string;
  products:       string;
  totalQty:       number;
  deliveredQty:   number;
  items?:         OrderItem[];
}

export interface OrderStats {
  total:      number;
  pending:    number;
  processing: number;
  completed:  number;
  revenue:    number;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

export function mapOrderItem(i: any): OrderItem {
  const qty       = parseInt(i.quantity ?? 0);
  const delivered = parseInt(i.deliveredQty ?? i.delivered_qty ?? 0);
  return {
    orderDetailId:  i.orderDetailId  ?? i.order_detail_id ?? 0,
    productId:      i.productId      ?? i.product_id      ?? 0,
    productName:    i.productName    ?? i.product_name    ?? "",
    skuId:          i.skuId          ?? i.sku_id          ?? 0,
    quantity:       qty,
    deliveredQty:   delivered,
    pendingQty:     parseInt(i.pendingQty ?? i.pending_qty ?? (qty - delivered)),
    unitPrice:      parseFloat(i.unitPrice ?? i.unit_price ?? 0),
    deliveryStatus: i.deliveryStatus ?? i.item_delivery_status ?? "pending",
  };
}

export function mapOrder(o: any): Order {
  return {
    id:             String(o.id ?? o.order_id),
    orderNumber:    o.orderNumber    ?? o.order_number    ?? "",
    status:         o.status         ?? o.order_status    ?? "pending",
    deliveryStatus: o.deliveryStatus ?? o.delivery_status ?? "pending",
    total:          parseFloat(o.total ?? o.total_amount  ?? 0),
    currency:       o.currency       ?? "USD",
    createdAt:      o.createdAt      ?? o.created_at      ?? "",
    completedAt:    o.completedAt    ?? o.completed_at    ?? null,
    clientName:     o.clientName     ?? o.client_name     ?? "",
    clientEmail:    o.clientEmail    ?? o.client_email    ?? "",
    clientCompany:  o.clientCompany  ?? o.client_company  ?? "",
    products:       o.products       ?? "",
    totalQty:       parseInt(o.totalQty     ?? o.total_qty     ?? 0),
    deliveredQty:   parseInt(o.deliveredQty ?? o.delivered_qty ?? 0),
    items: Array.isArray(o.items) ? o.items.map(mapOrderItem) : undefined,
  };
}

export function computeStats(orders: Order[], serverTotal: number): OrderStats {
  return {
    total:      serverTotal,
    pending:    orders.filter(o => o.status === "pending").length,
    processing: orders.filter(o => o.status === "processing").length,
    completed:  orders.filter(o => o.status === "completed").length,
    revenue:    orders
      .filter(o => o.status === "completed")
      .reduce((s, o) => s + o.total, 0),
  };
}
