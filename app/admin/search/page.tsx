'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import type { SearchResultItem } from '@/lib/search-registry';
import { getSearchModules, getLucideIcon } from '@/lib/search-registry';
import { highlightMatch } from '@/hooks/useGlobalSearch';
import { useRecentSearches } from '@/hooks/useRecentRecords';
import AdminShell from '../../../components/admin/AdminShell';
import { motion } from '@/components/motion';
import {
  Search, X, Loader2, ArrowRight, Filter, Clock, History, Bookmark,
  FolderKanban, Users, UserCircle, Target, FileText, Bug,
  MessageSquare, Sparkles, ListTodo,
} from 'lucide-react';

const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  Users, UserCircle, FolderKanban, Target, FileText, Bug, MessageSquare,
  Sparkles, ListTodo,
};

const MODULE_FILTERS = [
  { value: 'all', label: 'All Modules' },
  { value: 'client', label: 'Clients' },
  { value: 'lead', label: 'Leads' },
  { value: 'project', label: 'Projects' },
  { value: 'milestone', label: 'Milestones' },
  { value: 'invoice', label: 'Invoices' },
  { value: 'uat_job', label: 'UAT Jobs' },
  { value: 'uat_feedback', label: 'UAT Feedback' },
  { value: 'submission', label: 'Submissions' },
  { value: 'task', label: 'Tasks' },
];

const STATUS_FILTERS: Record<string, { value: string; label: string }[]> = {
  client: [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'prospect', label: 'Prospect' },
  ],
  lead: [
    { value: 'all', label: 'All Status' },
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
  ],
  project: [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'at_risk', label: 'At Risk' },
    { value: 'completed', label: 'Completed' },
  ],
};

export default function AdminSearchPage() {
  return (
    <Suspense fallback={<AdminShell><div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 text-[#06B6D4] animate-spin" /></div></AdminShell>}>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlQuery = searchParams.get('q') || '';
  const urlModule = searchParams.get('module') || 'all';
  const urlStatus = searchParams.get('status') || 'all';

  const [query, setQuery] = useState(urlQuery);
  const [inputValue, setInputValue] = useState(urlQuery);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [moduleFilter, setModuleFilter] = useState(urlModule);
  const [statusFilter, setStatusFilter] = useState(urlStatus);
  const [partialFailures, setPartialFailures] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const { searches: recentSearches, addSearch: addRecentSearch } = useRecentSearches();

  const doSearch = useCallback(async (q: string, mod: string, status: string) => {
    if (q.length < 2) {
      setResults([]);
      setTotalCount(0);
      return;
    }

    setLoading(true);
    setPartialFailures([]);

    const modules = getSearchModules();
    const filteredModules = mod === 'all' ? modules : modules.filter((m) => m.typeKey === mod);
    const failures: string[] = [];
    const allResults: SearchResultItem[] = [];

    const moduleQueries = filteredModules.map(async (m) => {
      try {
        let queryBuilder = supabase
          .from(m.tableName)
          .select(m.searchFields.concat([m.idField, m.statusField || '', m.updatedAtField || '']).filter(Boolean).join(','))
          .or(m.searchFields.map((f) => `${f}.ilike.%${q}%`).join(','))
          .limit(50);

        if (status !== 'all' && m.statusField && STATUS_FILTERS[m.typeKey]) {
          queryBuilder = queryBuilder.eq(m.statusField as string, status);
        }

        if (m.updatedAtField) {
          queryBuilder = queryBuilder.order(m.updatedAtField as string, { ascending: false });
        }

        const { data, error } = await queryBuilder;

        if (error) { failures.push(m.typeKey); return; }
        if (!data || data.length === 0) return;

        (data as unknown as Record<string, unknown>[]).forEach((row, index) => {
          let rank = 0;
          const primaryVal = String(row[m.displayField] || '');
          const qLower = q.toLowerCase();
          const pvLower = primaryVal.toLowerCase();

          if (pvLower === qLower) rank = 100;
          else if (pvLower.startsWith(qLower)) rank = 80;
          else if (pvLower.includes(qLower)) rank = 60;
          else rank = 40;

          rank += Math.max(0, 50 - index);

          const secondary = m.secondaryField ? String(row[m.secondaryField] || '') : '';
          const st = m.statusField ? String(row[m.statusField] || '') : null;

          allResults.push({
            type: m.typeKey,
            id: String(row[m.idField] || ''),
            label: primaryVal || 'Untitled',
            secondary,
            status: st,
            route: m.routePrefix,
            icon: m.icon,
            updatedAt: m.updatedAtField ? String(row[m.updatedAtField] || '') : null,
            rank,
            permission: m.permission,
          });
        });
      } catch {
        failures.push(m.typeKey);
      }
    });

    await Promise.all(moduleQueries);
    allResults.sort((a, b) => b.rank - a.rank);

    setResults(allResults);
    setTotalCount(allResults.length);
    setPartialFailures(failures);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (urlQuery) {
      addRecentSearch(urlQuery);
      setInputValue(urlQuery);
      setQuery(urlQuery);
      doSearch(urlQuery, urlModule, urlStatus);
    }
  }, [urlQuery, urlModule, urlStatus, doSearch, addRecentSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim().length < 2) return;
    setQuery(inputValue);
    addRecentSearch(inputValue);
    const params = new URLSearchParams();
    params.set('q', inputValue);
    if (moduleFilter !== 'all') params.set('module', moduleFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    router.push(`/admin/search?${params.toString()}`);
    doSearch(inputValue, moduleFilter, statusFilter);
  };

  const handleFilterChange = (type: 'module' | 'status', value: string) => {
    if (type === 'module') {
      setModuleFilter(value);
      setStatusFilter('all');
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (value !== 'all') params.set('module', value);
      router.push(`/admin/search?${params.toString()}`);
      if (query) doSearch(query, value, 'all');
    } else {
      setStatusFilter(value);
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (moduleFilter !== 'all') params.set('module', moduleFilter);
      if (value !== 'all') params.set('status', value);
      router.push(`/admin/search?${params.toString()}`);
      if (query) doSearch(query, moduleFilter, value);
    }
  };

  const groupedResults = groupByType(
    moduleFilter === 'all' ? results : results.filter((r) => r.type === moduleFilter)
  );

  const statusOptions = STATUS_FILTERS[moduleFilter] || [{ value: 'all', label: 'All Status' }];

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Search</h1>
          <p className="text-sm text-slate-400 mt-0.5">Search across all records, clients, leads, projects and more</p>
        </div>

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search by name, reference, company, email..."
                className="w-full pl-12 pr-4 py-3.5 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
                autoComplete="off"
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={() => { setInputValue(''); setQuery(''); setResults([]); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={inputValue.trim().length < 2 || loading}
              className="px-6 py-3.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </div>
        </form>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wider mr-1">Module:</span>
            <div className="flex gap-1.5">
              {MODULE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => handleFilterChange('module', f.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${moduleFilter === f.value ? 'bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20' : 'text-slate-400 border border-[rgba(255,255,255,0.06)] hover:text-white hover:border-[rgba(255,255,255,0.12)]'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          {statusOptions.length > 1 && (
            <div className="flex items-center gap-2 ml-2">
              <span className="w-px h-5 bg-[rgba(255,255,255,0.08)]" />
              <span className="text-xs text-slate-500 uppercase tracking-wider mr-1">Status:</span>
              <div className="flex gap-1.5">
                {statusOptions.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => handleFilterChange('status', f.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${statusFilter === f.value ? 'bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20' : 'text-slate-400 border border-[rgba(255,255,255,0.06)] hover:text-white hover:border-[rgba(255,255,255,0.12)]'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {recentSearches.length > 0 && !query && !loading && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Recent Searches</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.slice(0, 8).map((rs, i) => (
                <button
                  key={i}
                  onClick={() => { setInputValue(rs.text); setQuery(rs.text); doSearch(rs.text, moduleFilter, statusFilter); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-[rgba(255,255,255,0.06)] text-xs text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.12)] transition-all cursor-pointer"
                >
                  <Clock className="w-3 h-3" />
                  {rs.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#06B6D4] animate-spin" />
          </div>
        )}

        {partialFailures.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 mb-6 rounded-xl bg-amber-500/5 border border-amber-500/10 text-sm text-amber-400">
            <span className="text-base shrink-0">⚠</span>
            Some modules unavailable: {partialFailures.join(', ')}. Results may be incomplete.
          </div>
        )}

        {!loading && query && totalCount > 0 && (
          <p className="text-xs text-slate-500 mb-4">{totalCount} result{totalCount !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;</p>
        )}

        {!loading && query && totalCount === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 font-medium mb-1">No results found</p>
            <p className="text-sm text-slate-500">Try a different search term or adjust your filters</p>
          </div>
        )}

        {!loading && totalCount > 0 && (
          <div className="space-y-6">
            {Object.entries(groupedResults).map(([typeKey, items]) => {
              const moduleLabel = typeKey.charAt(0).toUpperCase() + typeKey.slice(1).replace(/_/g, ' ');
              return (
                <div key={typeKey}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-md bg-white/5">
                      {renderIcon(items[0].icon)}
                    </span>
                    <h2 className="text-sm font-bold text-white">{moduleLabel}</h2>
                    <span className="text-xs text-slate-500">({items.length})</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map((result) => (
                      <Link
                        key={`${result.type}-${result.id}`}
                        href={result.route}
                        className="flex items-center gap-3 p-4 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-xl hover:border-[#06B6D4]/20 hover:bg-white/[0.02] transition-all cursor-pointer group"
                      >
                        <span className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                          {renderIcon(result.icon)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white group-hover:text-[#06B6D4] transition-colors truncate">
                            {query ? renderHighlightedLabel(result.label, query) : result.label}
                          </p>
                          {(result.secondary || result.status) && (
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              {result.secondary}{result.secondary && result.status ? ' · ' : ''}
                              {result.status && (
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor(result.status) }} />
                                  <span className="capitalize">{result.status.replace(/_/g, ' ')}</span>
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-[#06B6D4] transition-colors shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !query && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 font-medium mb-2">Enter a search term to get started</p>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Search across clients, leads, projects, milestones, invoices, UAT jobs, feedback, submissions and tasks
            </p>
            <div className="flex items-center justify-center gap-1 mt-4 text-xs text-slate-600">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-[rgba(255,255,255,0.06)] font-mono">⌘</kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-[rgba(255,255,255,0.06)] font-mono">K</kbd>
              <span className="ml-1">for quick search</span>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function renderIcon(iconName: string) {
  const Comp = ICON_COMPONENTS[getLucideIcon(iconName)];
  if (Comp) return <Comp className="w-4 h-4 text-slate-400" />;
  return <Search className="w-4 h-4 text-slate-400" />;
}

function renderHighlightedLabel(text: string, query: string) {
  const hl = highlightMatch(text, query);
  if (!hl) return <>{text}</>;
  return (
    <>
      {hl.before}
      <span className="text-[#06B6D4] font-semibold">{hl.match}</span>
      {hl.after}
    </>
  );
}

function statusColor(status: string): string {
  switch (status) {
    case 'active': return '#10B981';
    case 'completed': return '#3B82F6';
    case 'at_risk': return '#EF4444';
    case 'overdue': return '#EF4444';
    case 'paid': return '#10B981';
    case 'new': return '#3B82F6';
    case 'qualified': return '#10B981';
    case 'contacted': return '#F59E0B';
    case 'critical': return '#EF4444';
    case 'pending': return '#F59E0B';
    default: return '#6B7280';
  }
}

function groupByType(results: SearchResultItem[]): Record<string, SearchResultItem[]> {
  const groups: Record<string, SearchResultItem[]> = {};
  results.forEach((r) => {
    if (!groups[r.type]) groups[r.type] = [];
    groups[r.type].push(r);
  });
  return groups;
}
