import type { ConnectionStatus } from './supabase.types';

export interface QueryResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  lastUpdated: string | null;
}

export interface PaginatedResult<T> {
  data: T[];
  error: string | null;
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  lastUpdated: string | null;
}

export function emptyQueryResult<T>(): QueryResult<T> {
  return {
    data: null,
    error: null,
    loading: false,
    lastUpdated: null,
  };
}

export function loadingQueryResult<T>(): QueryResult<T> {
  return {
    data: null,
    error: null,
    loading: true,
    lastUpdated: null,
  };
}

export function successQueryResult<T>(data: T): QueryResult<T> {
  return {
    data,
    error: null,
    loading: false,
    lastUpdated: new Date().toISOString(),
  };
}

export function errorQueryResult<T>(error: string): QueryResult<T> {
  return {
    data: null,
    error,
    loading: false,
    lastUpdated: null,
  };
}

export function emptyPaginatedResult<T>(pageSize: number): PaginatedResult<T> {
  return {
    data: [],
    error: null,
    loading: false,
    total: 0,
    page: 1,
    pageSize,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
    lastUpdated: null,
  };
}

export function loadingPaginatedResult<T>(pageSize: number): PaginatedResult<T> {
  return {
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
  };
}

export function safeErrorFormat(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as { message: string }).message || 'Unknown error occurred';
  }
  return 'Unknown error occurred';
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
}

export function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function isValidDate(d: string): boolean {
  const date = new Date(d);
  return !isNaN(date.getTime());
}

export function getConnectionStatus(hasConfig: boolean, error: string | null): ConnectionStatus {
  if (!hasConfig) return 'Configuration Required';
  if (error) return 'Failed';
  return 'Connected';
}

export const MAX_PAGE_SIZE = 50;
export const DEFAULT_PAGE_SIZE = 20;