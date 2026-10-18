import { useState, useEffect, useRef, useCallback } from "react";
import type { Order, PaginationMeta, OrdersResponse } from "../types/order";

interface UseOrdersParams {
  initialStatus?: string;
  initialPageSize?: number;
}

export function useOrders({ initialStatus = "ALL", initialPageSize = 25 }: UseOrdersParams = {}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: initialPageSize,
    totalRecords: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter / Query state
  const [status, setStatusState] = useState<string>(initialStatus);
  const [search, setSearchState] = useState<string>("");
  const [page, setPageState] = useState<number>(1);
  const [pageSize, setPageSizeState] = useState<number>(initialPageSize);
  const [sortBy, setSortByState] = useState<"createdAt" | "totalAmount" | "orderNumber">("createdAt");
  const [sortOrder, setSortOrderState] = useState<"asc" | "desc">("desc");

  // R1 Race condition counters
  const [abortedCount, setAbortedCount] = useState<number>(0);
  const [latestCompletedRequestId, setLatestCompletedRequestId] = useState<number>(0);

  // References for cancellation and sequence tracking
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdCounterRef = useRef<number>(0);

  const fetchOrders = useCallback(async () => {
    // 1. Abort any previous in-flight HTTP request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setAbortedCount((prev) => prev + 1);
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
        console.warn(`[R1 Guard] Discarded stale response for request #${currentRequestId} (latest is #${requestIdCounterRef.current})`);
        return;
      }

      setOrders(json.data);
      setPagination(json.pagination);
      setLatestCompletedRequestId(currentRequestId);
      setLoading(false);
    } catch (err: any) {
      if (err.name === "AbortError") {
        // Normal cancellation of an earlier slower request when user clicks fast
        console.info(`[R1 Guard] Successfully aborted in-flight request #${currentRequestId}`);
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

  return {
    orders,
    pagination,
    loading,
    error,
    status,
    search,
    page,
    pageSize,
    sortBy,
    sortOrder,
    abortedCount,
    latestCompletedRequestId,
    setStatus,
    setSearch,
    setPage,
    setPageSize,
    toggleSort,
    refresh: fetchOrders
  };
}
