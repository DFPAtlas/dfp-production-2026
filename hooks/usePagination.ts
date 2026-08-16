'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { PaginatedResult } from '@/lib/query-helpers';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, safeErrorFormat } from '@/lib/query-helpers';

interface UsePaginationOptions<T> {
  fetchFn: (page: number, pageSize: number) => Promise<{ data: T[]; count: number; error: unknown }>;
  initialPageSize?: number;
  maxPageSize?: number;
}

export function usePagination<T>({ fetchFn, initialPageSize = DEFAULT_PAGE_SIZE, maxPageSize = MAX_PAGE_SIZE }: UsePaginationOptions<T>) {
  const pageSize = Math.min(initialPageSize, maxPageSize);

  const [result, setResult] = useState<PaginatedResult<T>>({
    data: [],
    error: null,
    loading: true,
    total: 0,
    page: 1,
    pageSize,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
    lastUpdated: null,
  });

  const fetchIdRef = useRef(0);

  const load = useCallback(async (page: number) => {
    const fetchId = ++fetchIdRef.current;
    setResult((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data, count, error } = await fetchFn(page, pageSize);
      if (fetchId !== fetchIdRef.current) return;

      if (error) {
        setResult((prev) => ({
          ...prev,
          loading: false,
          error: safeErrorFormat(error),
          lastUpdated: null,
        }));
        return;
      }

      const total = count || 0;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));

      setResult({
        data,
        error: null,
        loading: false,
        total,
        page,
        pageSize,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
        lastUpdated: new Date().toISOString(),
      });
    } catch (err) {
      if (fetchId !== fetchIdRef.current) return;
      setResult((prev) => ({
        ...prev,
        loading: false,
        error: safeErrorFormat(err),
        lastUpdated: null,
      }));
    }
  }, [fetchFn, pageSize]);

  useEffect(() => {
    load(1);
  }, [load]);

  const goToPage = useCallback((page: number) => {
    const safePage = Math.max(1, Math.min(page, result.totalPages || 1));
    load(safePage);
  }, [load, result.totalPages]);

  const nextPage = useCallback(() => {
    if (result.hasNext) goToPage(result.page + 1);
  }, [result.hasNext, result.page, goToPage]);

  const previousPage = useCallback(() => {
    if (result.hasPrevious) goToPage(result.page - 1);
  }, [result.hasPrevious, result.page, goToPage]);

  const refresh = useCallback(() => {
    load(result.page || 1);
  }, [load, result.page]);

  return {
    ...result,
    goToPage,
    nextPage,
    previousPage,
    refresh,
  };
}