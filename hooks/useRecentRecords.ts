'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface RecentRecord {
  type: string;
  id: string;
  label: string;
  route: string;
  icon: string;
  viewedAt: string;
}

const STORAGE_KEY_PREFIX = 'df_recent_records_';
const MAX_RECENT = 12;

function getStorageKey(userId: string): string {
  return STORAGE_KEY_PREFIX + (userId || 'anon');
}

function loadRecentRecords(userId: string): RecentRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function saveRecentRecords(userId: string, records: RecentRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(records.slice(0, MAX_RECENT)));
  } catch {}
}

export function useRecentRecords() {
  const [records, setRecords] = useState<RecentRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      const uid = data?.user?.id || 'anon';
      setUserId(uid);
      setRecords(loadRecentRecords(uid));
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, []);

  const addRecord = useCallback((record: Omit<RecentRecord, 'viewedAt'>) => {
    const uid = userId || 'anon';
    setRecords((prev) => {
      const filtered = prev.filter((r) => !(r.type === record.type && r.id === record.id));
      const updated = [{ ...record, viewedAt: new Date().toISOString() }, ...filtered].slice(0, MAX_RECENT);
      saveRecentRecords(uid, updated);
      return updated;
    });
  }, [userId]);

  const clearRecords = useCallback(() => {
    const uid = userId || 'anon';
    setRecords([]);
    saveRecentRecords(uid, []);
  }, [userId]);

  return { records, loaded, addRecord, clearRecords };
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: Record<string, string>;
  createdAt: string;
}

const SAVED_KEY = 'df_saved_searches_';

function loadSavedSearches(): SavedSearch[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveSavedSearches(searches: SavedSearch[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(searches));
  } catch {}
}

export function useSavedSearches() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSearches(loadSavedSearches());
    setLoaded(true);
  }, []);

  const addSearch = useCallback((name: string, query: string, filters: Record<string, string> = {}) => {
    const newSearch: SavedSearch = {
      id: 'ss_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      query,
      filters,
      createdAt: new Date().toISOString(),
    };
    setSearches((prev) => {
      const updated = [newSearch, ...prev].slice(0, 20);
      saveSavedSearches(updated);
      return updated;
    });
    return newSearch;
  }, []);

  const removeSearch = useCallback((id: string) => {
    setSearches((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      saveSavedSearches(updated);
      return updated;
    });
  }, []);

  return { searches, loaded, addSearch, removeSearch };
}

const RECENT_SEARCH_KEY = 'df_recent_searches_';
const MAX_RECENT_SEARCHES = 10;

interface RecentSearch {
  text: string;
  time: string;
}

export function useRecentSearches() {
  const [searches, setSearches] = useState<RecentSearch[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_SEARCH_KEY);
      if (raw) setSearches(JSON.parse(raw));
    } catch {}
  }, []);

  const addSearch = useCallback((text: string) => {
    setSearches((prev) => {
      const filtered = prev.filter((s) => s.text !== text);
      const updated = [{ text, time: new Date().toISOString() }, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      try { localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const clearSearches = useCallback(() => {
    setSearches([]);
    try { localStorage.removeItem(RECENT_SEARCH_KEY); } catch {}
  }, []);

  return { searches, addSearch, clearSearches };
}