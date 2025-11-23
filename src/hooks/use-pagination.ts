"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  useUrlParams?: boolean;
}

export function usePagination(options: UsePaginationOptions = {}) {
  const {
    initialPage = 1,
    initialLimit = 50,
    useUrlParams = true,
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get initial values from URL if useUrlParams is true
  const urlPage = useUrlParams ? parseInt(searchParams.get("page") || "1") : initialPage;
  const urlLimit = useUrlParams ? parseInt(searchParams.get("limit") || initialLimit.toString()) : initialLimit;

  const [page, setPageState] = useState(urlPage);
  const [limit, setLimitState] = useState(urlLimit);

  const updateUrl = useCallback((newPage: number, newLimit: number) => {
    if (!useUrlParams) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    params.set("limit", newLimit.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams, useUrlParams]);

  const setPage = useCallback((newPage: number) => {
    setPageState(newPage);
    updateUrl(newPage, limit);
  }, [limit, updateUrl]);

  const setLimit = useCallback((newLimit: number) => {
    setLimitState(newLimit);
    setPageState(1); // Reset to first page when changing limit
    updateUrl(1, newLimit);
  }, [updateUrl]);

  const nextPage = useCallback(() => {
    setPage(page + 1);
  }, [page, setPage]);

  const previousPage = useCallback(() => {
    setPage(Math.max(1, page - 1));
  }, [page, setPage]);

  const goToPage = useCallback((targetPage: number) => {
    setPage(Math.max(1, targetPage));
  }, [setPage]);

  return {
    page,
    limit,
    setPage,
    setLimit,
    nextPage,
    previousPage,
    goToPage,
  };
}
