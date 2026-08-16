'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from '@/components/motion';
import {
  Search, RefreshCw, ChevronDown, X, Eye, FolderKanban,
  Building2, Plus, AlertTriangle,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import StaffShell from '../../../components/staff/StaffShell';
import ClientsSkeleton from '../../../components/staff/ClientsSkeleton';
import ClientDetailDrawer from '../../../components/staff/ClientDetailDrawer';
import ClientCreateEditDialog from '../../../components/staff/ClientCreateEditDialog';

interface Client {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  industry: string | null;
  status: string;
  project_lead: string | null;
  lead_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  project_count: number;
}

interface StaffInfo {
  id: string;
  full_name: string | null;
  role: string;
}

interface ClientStats {
  total: number;
  active: number;
  totalProjects: number;
}

const CLIENT_STATUSES = ['active', 'inactive', 'prospect', 'on_hold'] as const;
const PAGE_SIZE = 20;

const LIST_COLS = 'id,company_name,contact_name,email,phone,website,industry,status,project_lead,lead_id,notes,created_at,updated_at,address';

function getStatusStyle(status: string) {
  switch (status) {
    case 'active': return { color: '#10B981', bg: 'bg-[#10B981]/10', dot: '#10B981' };
    case 'prospect': return { color: '#F59E0B', bg: 'bg-[#F59E0B]/10', dot: '#F59E0B' };
    case 'on_hold': return { color: '#F97316', bg: 'bg-[#F97316]/10', dot: '#F97316' };
    case 'inactive': return { color: '#9CA3AF', bg: 'bg-white/5', dot: '#64748B' };
    default: return { color: '#10B981', bg: 'bg-[#10B981]/10', dot: '#10B981' };
  }
}

function formatDate(d: string | null) {
  if (!d) return '\u2014';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ClientsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [profile, setProfile] = useState<{ id: string; full_name: string | null; role: string } | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [staff, setStaff] = useState<StaffInfo[]>([]);
  const [staffMap, setStaffMap] = useState<Record<string, StaffInfo>>({});
  const [stats, setStats] = useState<ClientStats>({ total: 0, active: 0, totalProjects: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [leadFilter, setLeadFilter] = useState('all');
  const [sortMode, setSortMode] = useState('newest');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [creatingClient, setCreatingClient] = useState(false);

  const [statusUpdating, setStatusUpdating] = useState<Record<string, boolean>>({});
  const [leadUpdating, setLeadUpdating] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  const isPrivileged = isAdmin || profile?.role === 'project_lead';
  const canEdit = isPrivileged;
  const canCreate = isPrivileged;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const urlStatus = searchParams.get('status');
    if (urlStatus && (CLIENT_STATUSES as readonly string[]).includes(urlStatus)) setStatusFilter(urlStatus);
    const urlLead = searchParams.get('lead');
    if (urlLead) setLeadFilter(urlLead);
    const urlSearch = searchParams.get('search');
    if (urlSearch) setSearchQuery(urlSearch);
    const urlSort = searchParams.get('sort');
    if (urlSort === 'newest' || urlSort === 'oldest' || urlSort === 'company' || urlSort === 'contact') setSortMode(urlSort);
    const urlPage = searchParams.get('page');
    if (urlPage) setPage(Math.max(0, parseInt(urlPage) || 0));
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (leadFilter !== 'all') params.set('lead', leadFilter);
    if (searchQuery) params.set('search', searchQuery);
    if (sortMode !== 'newest') params.set('sort', sortMode);
    if (page > 0) params.set('page', String(page));
    const newUrl = params.toString() ? `/staff/clients?${params.toString()}` : '/staff/clients';
    window.history.replaceState(null, '', newUrl);
  }, [statusFilter, leadFilter, searchQuery, sortMode, page]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setTimeout(() => router.replace('/staff/login'), 0); return; }
      const { data: sp } = await supabase.from('staff_profiles').select('id, full_name, role').eq('id', session.user.id).maybeSingle();
      if (!sp) { setTimeout(() => router.replace('/staff/login'), 0); return; }
      if (cancelled) return;
      setProfile(sp);

      const staffRes = await supabase.from('staff_profiles').select('id, full_name, role').order('full_name');
      if (cancelled) return;
      if (staffRes.data) {
        setStaff(staffRes.data);
        const map: Record<string, StaffInfo> = {};
        staffRes.data.forEach(s => { map[s.id] = s; });
        setStaffMap(map);
      }

      await fetchClients(() => cancelled);
      await fetchStats(() => cancelled);
    }
    init();
    return () => { cancelled = true; };
  }, [router]);

  const buildQuery = useCallback(() => {
    let q = supabase.from('clients').select(LIST_COLS, { count: 'exact', head: false });

    if (searchQuery) {
      const qLower = searchQuery.toLowerCase();
      q = q.or(`company_name.ilike.%${qLower}%,contact_name.ilike.%${qLower}%,email.ilike.%${qLower}%,industry.ilike.%${qLower}%`);
    }

    if (statusFilter !== 'all') q = q.eq('status', statusFilter);

    if (leadFilter === 'mine' && profile) {
      q = q.eq('project_lead', profile.id);
    } else if (leadFilter === 'unassigned') {
      q = q.is('project_lead', null);
    } else if (leadFilter !== 'all' && leadFilter !== 'mine' && leadFilter !== 'unassigned') {
      q = q.eq('project_lead', leadFilter);
    }

    switch (sortMode) {
      case 'oldest': q = q.order('created_at', { ascending: true }); break;
      case 'company': q = q.order('company_name', { ascending: true, nullsFirst: false }); break;
      case 'contact': q = q.order('contact_name', { ascending: true, nullsFirst: false }); break;
      default: q = q.order('created_at', { ascending: false }); break;
    }

    q = q.order('id', { ascending: true });
    q = q.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    return q;
  }, [searchQuery, statusFilter, leadFilter, sortMode, page, profile]);

  const fetchClients = async (cancelled: () => boolean) => {
    setLoadError('');
    const q = buildQuery();
    const { data, error, count } = await q;
    if (cancelled()) return;
    if (error) { setLoadError(error.message); setLoading(false); return; }

    const clientIds = (data || []).map(c => c.id);
    const projectCounts: Record<string, number> = {};
    if (clientIds.length > 0) {
      const { data: pcData } = await supabase.from('projects').select('client_id').in('client_id', clientIds);
      if (pcData) {
        pcData.forEach(p => { projectCounts[p.client_id] = (projectCounts[p.client_id] || 0) + 1; });
      }
    }

    const enriched = (data || []).map(c => ({ ...c, project_count: projectCounts[c.id] || 0 }));
    setClients(enriched);
    setTotalCount(count || 0);
    setLoading(false);
    setRefreshing(false);
  };

  const fetchStats = async (cancelled: () => boolean) => {
    const [activeRes, totalRes, projectsRes] = await Promise.all([
      supabase.from('clients').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('clients').select('id', { count: 'exact', head: true }),
      supabase.from('projects').select('client_id'),
    ]);
    if (cancelled()) return;

    const totalProjectCount = (projectsRes.data || []).length;
    setStats({
      active: activeRes.count || 0,
      total: totalRes.count || 0,
      totalProjects: totalProjectCount,
    });
  };

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    fetchClients(() => cancelled);
    fetchStats(() => cancelled);
    return () => { cancelled = true; };
  }, [searchQuery, statusFilter, leadFilter, sortMode, page, profile]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchClients(() => false);
    await fetchStats(() => false);
    setRefreshing(false);
  };

  const handleStatusChange = async (id: string, status: string) => {
    setStatusUpdating(p => ({ ...p, [id]: true }));
    const { error } = await supabase.from('clients').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) {
      showToast('Failed to update status: ' + error.message, 'error');
      setStatusUpdating(p => ({ ...p, [id]: false }));
      return;
    }
    setClients(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    setStatusUpdating(p => ({ ...p, [id]: false }));
    fetchStats(() => false);
    showToast(`Client marked as ${status.replace('_', ' ')}`, 'success');
  };

  const handleAssignLead = async (id: string, staffId: string) => {
    setLeadUpdating(p => ({ ...p, [id]: true }));
    const { error } = await supabase.from('clients').update({ project_lead: staffId || null, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) {
      showToast('Failed to reassign: ' + error.message, 'error');
      setLeadUpdating(p => ({ ...p, [id]: false }));
      return;
    }
    setClients(prev => prev.map(c => c.id === id ? { ...c, project_lead: staffId || null } : c));
    setLeadUpdating(p => ({ ...p, [id]: false }));
    showToast(staffId ? 'Relationship lead assigned' : 'Lead unassigned', 'success');
  };

  const handleClientCreated = (clientId: string) => {
    setCreatingClient(false);
    handleRefresh();
    showToast('Client created successfully', 'success');
  };

  const handleClientEdited = (clientId: string) => {
    setEditingClient(null);
    handleRefresh();
    showToast('Client updated successfully', 'success');
  };

  const handleCardFilter = (status: string) => {
    setStatusFilter(statusFilter === status ? 'all' : status);
    setPage(0);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setLeadFilter('all');
    setSortMode('newest');
    setPage(0);
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || leadFilter !== 'all' || sortMode !== 'newest';
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const kpiCards = [
    { label: 'Total Clients', value: stats.total, color: '#94A3B8', status: null },
    { label: 'Active', value: stats.active, color: '#10B981', status: 'active' },
    { label: 'Prospect', value: clients.filter(c => c.status === 'prospect').length > 0 || (totalCount > 0 ? undefined : undefined), color: '#F59E0B', status: 'prospect' },
    { label: 'Linked Projects', value: stats.totalProjects, color: '#06B6D4', status: null },
  ];

  if (loading) {
    return (
      <StaffShell>
        <ClientsSkeleton />
      </StaffShell>
    );
  }

  if (loadError) {
    return (
      <StaffShell>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangle className="w-12 h-12 text-[#EF4444] mb-4" />
            <p className="text-white font-bold text-lg mb-1">Unable to load clients</p>
            <p className="text-slate-400 text-sm mb-4">{loadError}</p>
            <button onClick={handleRefresh}
              className="px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
            >
              Retry
            </button>
          </div>
        </div>
      </StaffShell>
    );
  }

  return (
    <StaffShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/staff/dashboard" className="hover:text-[#06B6D4] transition-colors cursor-pointer">Staff</Link>
              <span>/</span>
              <span className="text-slate-300">Clients</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Clients</h1>
            <p className="text-sm text-slate-400 mt-0.5">Manage client relationships and project access</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-[#06B6D4] hover:border-[#06B6D4]/20 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {canCreate && (
              <button
                onClick={() => setCreatingClient(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Add Client
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {kpiCards.map((card) => (
            <button
              key={card.label}
              onClick={() => card.status ? handleCardFilter(card.status) : undefined}
              className={`bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-4 text-left transition-all group ${card.status ? 'hover:border-[rgba(255,255,255,0.18)] cursor-pointer' : 'cursor-default'}`}
            >
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">{card.label}</p>
              <p className="text-2xl font-bold tracking-tight" style={{ color: card.color }}>{card.value}</p>
            </button>
          ))}
        </div>

        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[rgba(255,255,255,0.06)] space-y-3">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by company, contact, email, or industry..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 focus:border-[#06B6D4]/30 transition-all"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <FilterSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(0); }} options={[
                  { value: 'all', label: 'All Status' },
                  ...CLIENT_STATUSES.map(s => ({ value: s, label: s.replace('_', ' ').charAt(0).toUpperCase() + s.replace('_', ' ').slice(1) })),
                ]} />

                <FilterSelect value={leadFilter} onChange={(v) => { setLeadFilter(v); setPage(0); }} options={[
                  { value: 'all', label: 'All Leads' },
                  { value: 'mine', label: 'Mine' },
                  { value: 'unassigned', label: 'Unassigned' },
                  ...staff.map(s => ({ value: s.id, label: s.full_name || 'Unknown' })),
                ]} />

                <FilterSelect value={sortMode} onChange={(v) => { setSortMode(v); setPage(0); }} options={[
                  { value: 'newest', label: 'Newest' },
                  { value: 'oldest', label: 'Oldest' },
                  { value: 'company', label: 'Company' },
                  { value: 'contact', label: 'Contact' },
                ]} />

                {hasActiveFilters && (
                  <button onClick={clearFilters}
                    className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-xs text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
            </div>
            <div className="text-xs text-slate-500">
              {totalCount} client{totalCount !== 1 ? 's' : ''}
              {hasActiveFilters && ' filtered'}
            </div>
          </div>

          {clients.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-300 font-medium mb-1">
                {hasActiveFilters ? 'No clients match your filters' : 'No clients yet'}
              </p>
              <p className="text-sm text-slate-500 mb-4">
                {hasActiveFilters ? 'Try adjusting your search or filters.' : 'Convert a lead or add a client to get started.'}
              </p>
              {hasActiveFilters ? (
                <button onClick={clearFilters}
                  className="px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
                >
                  Clear Filters
                </button>
              ) : canCreate && (
                <button onClick={() => setCreatingClient(true)}
                  className="px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 inline-block mr-1.5" /> Add Your First Client
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.06)]">
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Company</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Contact</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Industry</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Projects</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Lead</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Added</th>
                      <th className="text-right py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <ClientTableRow
                        key={client.id}
                        client={client}
                        staffMap={staffMap}
                        canEdit={canEdit}
                        onSelect={() => setSelectedClient(client)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden">
                {clients.map((client) => (
                  <ClientMobileCard
                    key={client.id}
                    client={client}
                    staffMap={staffMap}
                    onSelect={() => setSelectedClient(client)}
                  />
                ))}
              </div>
            </>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(255,255,255,0.06)]">
              <p className="text-xs text-slate-500">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages - 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {selectedClient && (
            <ClientDetailDrawer
              client={selectedClient}
              staff={staff}
              currentUserId={profile?.id || ''}
              canEdit={canEdit}
              onClose={() => setSelectedClient(null)}
              onEdit={(client) => { setSelectedClient(null); setTimeout(() => setEditingClient(client), 150); }}
              onStatusChange={handleStatusChange}
              onAssignLead={handleAssignLead}
            />
          )}

          {creatingClient && (
            <ClientCreateEditDialog
              mode="create"
              staff={staff}
              onClose={() => setCreatingClient(false)}
              onSuccess={handleClientCreated}
            />
          )}

          {editingClient && (
            <ClientCreateEditDialog
              mode="edit"
              initialData={{
                id: editingClient.id,
                company_name: editingClient.company_name || '',
                contact_name: editingClient.contact_name || '',
                email: editingClient.email || '',
                phone: editingClient.phone || '',
                website: editingClient.website || '',
                address: editingClient.address || '',
                industry: editingClient.industry || '',
                status: editingClient.status,
                project_lead: editingClient.project_lead || '',
                notes: editingClient.notes || '',
              }}
              staff={staff}
              onClose={() => setEditingClient(null)}
              onSuccess={handleClientEdited}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
              className={`fixed bottom-6 right-6 z-[70] px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${toast.type === 'success' ? 'bg-[#10B981] text-white' : 'bg-[#EF4444] text-white'}`}
            >
              {toast.type === 'success' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </StaffShell>
  );
}

function FilterSelect({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 pr-7 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#06B6D4]/30 cursor-pointer appearance-none whitespace-nowrap"
      >
        {options.map(o => (
          <option key={o.value} value={o.value} className="bg-[#1E293B] text-white">{o.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
    </div>
  );
}

function ClientTableRow({ client, staffMap, canEdit, onSelect }: {
  client: Client;
  staffMap: Record<string, StaffInfo>;
  canEdit: boolean;
  onSelect: () => void;
}) {
  const statusStyle = getStatusStyle(client.status);
  const leadStaff = client.project_lead ? staffMap[client.project_lead] : null;
  const initials = (client.company_name || 'C').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const safeHostname = (() => {
    if (!client.website) return null;
    try {
      const url = new URL(client.website.startsWith('http') ? client.website : 'https://' + client.website);
      return url.hostname.replace('www.', '');
    } catch { return null; }
  })();

  return (
    <tr className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors group">
      <td className="py-3.5 px-4">
        <button onClick={onSelect} className="flex items-center gap-3 cursor-pointer text-left w-full">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#10B981]/10 to-[#059669]/10 flex items-center justify-center text-xs font-bold text-[#10B981] shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate max-w-[180px]">{client.company_name || 'Unnamed'}</p>
            {safeHostname && <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{safeHostname}</p>}
          </div>
        </button>
      </td>
      <td className="py-3.5 px-4">
        <p className="text-sm font-medium text-slate-300">{client.contact_name || '\u2014'}</p>
        {client.email && <p className="text-xs text-slate-500 truncate max-w-[160px]">{client.email}</p>}
      </td>
      <td className="py-3.5 px-4 text-sm text-slate-400 max-w-[140px] truncate">{client.industry || '\u2014'}</td>
      <td className="py-3.5 px-4">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium border"
          style={{ borderColor: statusStyle.color + '30', backgroundColor: statusStyle.color + '10', color: statusStyle.color }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusStyle.dot }} />
          {client.status.replace('_', ' ')}
        </span>
      </td>
      <td className="py-3.5 px-4">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium text-slate-400 bg-white/5">
          <FolderKanban className="w-3 h-3" />
          {client.project_count || 0}
        </span>
      </td>
      <td className="py-3.5 px-4 text-xs text-slate-400">
        {leadStaff?.full_name || 'Unassigned'}
      </td>
      <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
        {formatDate(client.created_at)}
      </td>
      <td className="py-3.5 px-4">
        <div className="flex items-center justify-end gap-0.5">
          <button
            onClick={onSelect}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer"
            title="View details"
            aria-label={`View details for ${client.company_name || 'Unnamed'}`}
          >
            <Eye className="w-4 h-4" />
          </button>
          <Link
            href={`/staff/projects?client=${client.id}`}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer"
            title="View projects"
            aria-label={`View projects for ${client.company_name || 'Unnamed'}`}
          >
            <FolderKanban className="w-4 h-4" />
          </Link>
        </div>
      </td>
    </tr>
  );
}

function ClientMobileCard({ client, staffMap, onSelect }: {
  client: Client;
  staffMap: Record<string, StaffInfo>;
  onSelect: () => void;
}) {
  const statusStyle = getStatusStyle(client.status);
  const leadStaff = client.project_lead ? staffMap[client.project_lead] : null;
  const initials = (client.company_name || 'C').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-4 border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors cursor-pointer"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10B981]/10 to-[#059669]/10 flex items-center justify-center text-xs font-bold text-[#10B981] shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{client.company_name || 'Unnamed'}</p>
            <p className="text-xs text-slate-500 truncate">{client.contact_name || '\u2014'}</p>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border shrink-0 ml-2"
          style={{ borderColor: statusStyle.color + '30', backgroundColor: statusStyle.color + '10', color: statusStyle.color }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusStyle.dot }} />
          {client.status.replace('_', ' ')}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <FolderKanban className="w-3 h-3 text-slate-500" />
          {client.project_count || 0} project{(client.project_count || 0) !== 1 ? 's' : ''}
        </span>
        <span>{client.industry || '\u2014'}</span>
        <span>
          {leadStaff?.full_name || 'Unassigned'}
        </span>
        <span>{formatDate(client.created_at)}</span>
      </div>
    </button>
  );
}

export default function StaffClientsPage() {
  return (
    <Suspense fallback={
      <StaffShell>
        <ClientsSkeleton />
      </StaffShell>
    }>
      <ClientsContent />
    </Suspense>
  );
}
