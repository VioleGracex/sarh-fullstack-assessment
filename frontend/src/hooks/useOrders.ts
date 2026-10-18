import { useState, useEffect, useRef, useCallback } from "react";
import type { Order, PaginationMeta, OrdersResponse, SystemStats } from "../types/order";

interface UseOrdersParams {
  initialStatus?: string;
  initialPageSize?: number;
}

const DEFAULT_SYSTEM_STATS: SystemStats = {
  totalSystemRecords: 0,
  statusCounts: {
    ALL: 0,
    PENDING: 0,
    PROCESSING: 0,
    COMPLETED: 0,
    CANCELLED: 0
  },
  totalRevenue: 0
};

export function useOrders({ initialStatus = "ALL", initialPageSize = 25 }: UseOrdersParams = {}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: initialPageSize,
    totalRecords: 0,
    totalSystemRecords: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [systemStats, setSystemStats] = useState<SystemStats>(DEFAULT_SYSTEM_STATS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter / Query state
  const [status, setStatusState] = useState<string>(initialStatus);
  const [search, setSearchState] = useState<string>("");
  const [page, setPageState] = useState<number>(1);
  const [pageSize, setPageSizeState] = useState<number>(initialPageSize);
  const [sortBy, setSortByState] = useState<"createdAt" | "totalAmount" | "orderNumber">("createdAt");
  const [sortOrder, setSortOrderState] = useState<"asc" | "desc">("desc");

  // References for cancellation and sequence tracking (R1 AbortController under the hood)
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdCounterRef = useRef<number>(0);

  const fetchOrders = useCallback(async () => {
    // 1. Silently abort any previous in-flight HTTP request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 2. Create fresh AbortController and increment monotonic sequence ID
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const currentRequestId = ++requestIdCounterRef.current;

    setLoading(true);
    setError(null);

    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      sortBy,
      sortOrder
    });

    if (status && status !== "ALL") {
      queryParams.set("status", status);
    }
    if (search.trim()) {
      queryParams.set("search", search.trim());
    }

    try {
      const response = await fetch(`/api/orders?${queryParams.toString()}`, {
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const json: OrdersResponse = await response.json();

      // 3. Strict Race Condition Guard: Ignore response if a newer request has started
      if (currentRequestId !== requestIdCounterRef.current) {
        return;
      }

      setOrders(json.data);
      setPagination(json.pagination);
      if (json.systemStats) {
        setSystemStats(json.systemStats);
      }
      setLoading(false);
    } catch (err: any) {
      if (err.name === "AbortError") {
        // Normal cancellation of an earlier slower request when user navigates/filters fast
        return;
      }

      // Only set error if this is still the active request
      if (currentRequestId === requestIdCounterRef.current) {
        setError(err.message || "Failed to load orders");
        setLoading(false);
      }
    }
  }, [page, pageSize, status, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchOrders();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchOrders]);

  const setStatus = (newStatus: string) => {
    setStatusState(newStatus);
    setPageState(1);
  };

  const setSearch = (newSearch: string) => {
    setSearchState(newSearch);
    setPageState(1);
  };

  const setPage = (newPage: number) => {
    setPageState(newPage);
  };

  const setPageSize = (newSize: number) => {
    setPageSizeState(newSize);
    setPageState(1);
  };

  const toggleSort = (column: "createdAt" | "totalAmount" | "orderNumber") => {
    if (sortBy === column) {
      setSortOrderState((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortByState(column);
      setSortOrderState("desc");
    }
    setPageState(1);
  };

  const applySort = (column: "createdAt" | "totalAmount" | "orderNumber", order: "asc" | "desc") => {
    setSortByState(column);
    setSortOrderState(order);
    setPageState(1);
  };

  return {
    orders,
    pagination,
    systemStats,
    loading,
    error,
    status,
    search,
    page,
    pageSize,
    sortBy,
    sortOrder,
    setStatus,
    setSearch,
    setPage,
    setPageSize,
    toggleSort,
    applySort,
    refresh: fetchOrders
  };
}
