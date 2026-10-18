export type OrderStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED";

export type Theme = "corporate-steel" | "midnight-obsidian";
export type Density = "comfortable" | "compact";

export interface OrderItem {
  id?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  idempotencyKey?: string | null;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalSystemRecords?: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SystemStats {
  totalSystemRecords: number;
  statusCounts: Record<string, number>;
  totalRevenue: number;
}

export interface OrdersResponse {
  data: Order[];
  pagination: PaginationMeta;
  systemStats?: SystemStats;
}

export interface User {
  id: string;
  email: string;
  role: "ADMIN" | "AGENT";
}
