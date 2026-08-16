'use client';

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { getSearchModules, type SearchResultItem, type CommandItem, getCommands, NAV_COMMANDS } from '@/lib/search-registry';

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS_PER_MODULE = 5;
const DEBOUNCE_MS = 250;
const SEARCH_TIMEOUT_MS = 8000;

interface SearchState {
  query: string;
  results: SearchResultItem[];
  commands: CommandItem[];
  loading: boolean;
  partialFailures: string[];
  error: string | null;
}

export function useGlobalSearch() {
  const [state, setState] = useState<SearchState>({
    query: '',
    results: [],
    commands: [],
    loading: false,
    partialFailures: [],
    error: null,
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchIdRef = useRef(0);

  const search = useCallback((rawQuery: string) => {
    const query = rawQuery.trim();
    setState((prev) => ({ ...prev, query, loading: query.length >= MIN_QUERY_LENGTH, partialFailures: [], error: null }));

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < MIN_QUERY_LENGTH) {
      setState((prev) => ({
        ...prev,
        query,
        results: [],
        commands: filterCommands(query),
        loading: false,
        partialFailures: [],
        error: null,
      }));
      return;
    }

    debounceRef.current = setTimeout(async () => {
      fetchIdRef.current += 1;
      const currentFetchId = fetchIdRef.current;

      const modules = getSearchModules();
      const failures: string[] = [];
      const allResults: SearchResultItem[] = [];

      const moduleQueries = modules.map(async (mod) => {
        try {
          const searchTerm = `%${query}%`;
          const conditions = mod.searchFields.map((field) => `${field}.ilike.%${query}%`).join(',');

          let queryBuilder = supabase
            .from(mod.tableName)
            .select(mod.searchFields.concat([mod.idField, mod.statusField || '', mod.updatedAtField || '']).filter(Boolean).join(','))
            .or(mod.searchFields.map((f) => `${f}.ilike.%${query}%`).join(','))
            .limit(MAX_RESULTS_PER_MODULE);

          if (mod.statusField) {
            queryBuilder = queryBuilder.order(mod.statusField as string, { ascending: true });
          }

          const { data, error } = await queryBuilder;

          if (error) {
            failures.push(mod.typeKey);
            return;
          }

          if (!data || data.length === 0) return;

          (data as unknown as Record<string, unknown>[]).slice(0, MAX_RESULTS_PER_MODULE).forEach((row, index) => {
            let rank = 0;
            const primaryVal = String(row[mod.displayField] || '');
            const q = query.toLowerCase();
            const pv = primaryVal.toLowerCase();

            if (pv === q) rank = 100;
            else if (pv.startsWith(q)) rank = 80;
            else if (pv.includes(q)) rank = 60;
            else rank = 40;

            rank += (MAX_RESULTS_PER_MODULE - index);

            const secondary = mod.secondaryField ? String(row[mod.secondaryField] || '') : '';
            const status = mod.statusField ? String(row[mod.statusField] || '') : null;

            allResults.push({
              type: mod.typeKey,
              id: String(row[mod.idField] || ''),
              label: primaryVal || 'Untitled',
              secondary,
              status,
              route: `${mod.routePrefix}${mod.typeKey !== 'client' && mod.typeKey !== 'lead' && mod.typeKey !== 'invoice' ? '' : ''}`,
              icon: mod.icon,
              updatedAt: mod.updatedAtField ? String(row[mod.updatedAtField] || '') : null,
              rank,
              permission: mod.permission,
              metadata: {
                tableName: mod.tableName,
                rawId: String(row[mod.idField] || ''),
              },
            });
          });
        } catch {
          failures.push(mod.typeKey);
        }
      });

      const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, SEARCH_TIMEOUT_MS));
      await Promise.race([Promise.all(moduleQueries), timeoutPromise]);

      if (currentFetchId !== fetchIdRef.current) return;

      allResults.sort((a, b) => b.rank - a.rank);

      const filteredCommands = filterCommands(query);

      setState({
        query,
        results: allResults,
        commands: filteredCommands,
        loading: false,
        partialFailures: failures,
        error: null,
      });
    }, DEBOUNCE_MS);
  }, []);

  const clearSearch = useCallback(() => {
    setState({
      query: '',
      results: [],
      commands: [],
      loading: false,
      partialFailures: [],
      error: null,
    });
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  return { ...state, search, clearSearch };
}

function filterCommands(query: string): CommandItem[] {
  if (!query || query.length < 1) return NAV_COMMANDS.slice(0, 8);
  const q = query.toLowerCase();
  return getCommands().filter((cmd) => {
    if (cmd.label.toLowerCase().includes(q)) return true;
    return cmd.keywords.some((kw) => kw.includes(q));
  }).slice(0, 6);
}

export function highlightMatch(text: string, query: string): { before: string; match: string; after: string } | null {
  if (!query || query.length < 1) return null;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return null;
  return {
    before: text.slice(0, idx),
    match: text.slice(idx, idx + query.length),
    after: text.slice(idx + query.length),
  };
}
