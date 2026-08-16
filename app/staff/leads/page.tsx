'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from '@/components/motion';
import {
  Search, RefreshCw, ChevronDown, X, Eye, Trash2,
  UserCheck, Loader2, UserPlus, ArrowUpRight,
  Building2, Calendar,
  AlertTriangle, ChevronLeft, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import StaffShell from '../../../components/staff/StaffShell';
import LeadsSkeleton from '../../../components/staff/LeadsSkeleton';
import LeadDetailDrawer from '../../../components/staff/LeadDetailDrawer';
import LeadConversionDialog from '../../../components/staff/LeadConversionDialog';
import LeadDeleteDialog from '../../../components/staff/LeadDeleteDialog';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  website: string | null;
  service_interest: string | null;
  message: string | null;
  budget_range: string | null;
  location: string | null;
  status: string;
  stage: string;
  priority: string;
  estimated_value: number | null;
  contact_role: string | null;
  contact_phone: string | null;
  industry: string | null;
  source: string;
  campaign: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  converted_to_client: string | null;
  converted_at: string | null;
}

interface StaffInfo {
  id: string;
  full_name: string | null;
  role: string;
}

interface LeadStats {
  total: number;
  newCount: number;
  contacted: number;
  qualified: number;
  converted: number;
}

const VALID_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'closed'];
const PAGE_SIZE = 20;

function getStatusStyle(status: string) {
  switch (status) {
    case 'new': return { color: '#06B6D4', bg: 'bg-[#06B6D4]/10' };
    case 'contacted': return { color: '#F59E0B', bg: 'bg-[#F59E0B]/10' };
    case 'qualified': return { color: '#10B981', bg: 'bg-[#10B981]/10' };
    case 'converted': return { color: '#8B5CF6', bg: 'bg-[#8B5CF6]/10' };
    case 'closed': return { color: '#9CA3AF', bg: 'bg-white/5' };
    default: return { color: '#94A3B8', bg: 'bg-white/5' };
  }
}

function getPriorityStyle(priority: string) {
  switch (priority) {
    case 'urgent': return { color: '#EF4444', bg: 'bg-[#EF4444]/10' };
    case 'high': return { color: '#F59E0B', bg: 'bg-[#F59E0B]/10' };
    case 'medium': return { color: '#06B6D4', bg: 'bg-[#06B6D4]/10' };
    case 'low': return { color: '#10B981', bg: 'bg-[#10B981]/10' };
    default: return { color: '#94A3B8', bg: 'bg-white/5' };
  }
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatShortDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

const METADATA_COLS = 'id,name,email,phone,company_name,website,service_interest,message,budget_range,location,status,stage,priority,estimated_value,contact_role,contact_phone,industry,source,campaign,assigned_to,created_at,updated_at,converted_to_client,converted_at';

function LeadsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [profile, setProfile] = useState<{ id: string; full_name: string | null; role: string } | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [staff, setStaff] = useState<StaffInfo[]>([]);
  const [stats, setStats] = useState<LeadStats>({ total: 0, newCount: 0, contacted: 0, qualified: 0, converted: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [sortMode, setSortMode] = useState('newest');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);

  const [statusUpdating, setStatusUpdating] = useState<Record<string, boolean>>({});
  const [assignUpdating, setAssignUpdating] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  const isPrivileged = isAdmin || profile?.role === 'project_lead';
  const canDelete = isAdmin;

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const urlStatus = searchParams.get('status');
    if (urlStatus && VALID_STATUSES.includes(urlStatus)) setStatusFilter(urlStatus);
    const urlAssignee = searchParams.get('assignee');
    if (urlAssignee) setAssigneeFilter(urlAssignee);
    const urlSearch = searchParams.get('search');
    if (urlSearch) setSearchQuery(urlSearch);
    const urlSort = searchParams.get('sort');
    if (urlSort === 'newest' || urlSort === 'oldest' || urlSort === 'name' || urlSort === 'company') setSortMode(urlSort);
    const urlPage = searchParams.get('page');
    if (urlPage) setPage(Math.max(0, parseInt(urlPage) || 0));
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (assigneeFilter !== 'all') params.set('assignee', assigneeFilter);
    if (searchQuery) params.set('search', searchQuery);
    if (sortMode !== 'newest') params.set('sort', sortMode);
    if (page > 0) params.set('page', String(page));
    const newUrl = params.toString() ? `/staff/leads?${params.toString()}` : '/staff/leads';
    window.history.replaceState(null, '', newUrl);
  }, [statusFilter, assigneeFilter, searchQuery, sortMode, page]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setTimeout(() => router.replace('/staff/login'), 0); return; }
      const { data: sp } = await supabase.from('staff_profiles').select('id, full_name, role').eq('id', session.user.id).maybeSingle();
      if (!sp) { setTimeout(() => router.replace('/staff/login'), 0); return; }
      if (cancelled) return;
      setProfile(sp);

      const [staffRes] = await Promise.all([
        supabase.from('staff_profiles').select('id, full_name, role').order('full_name'),
      ]);
      if (cancelled) return;
      if (staffRes.data) setStaff(staffRes.data);

      await fetchLeads(() => cancelled);
    }
    init();
    return () => { cancelled = true; };
  }, [router]);

  const buildQuery = useCallback(() => {
    let q = supabase.from('leads').select(METADATA_COLS, { count: 'exact', head: false });

    if (searchQuery) {
      const qLower = searchQuery.toLowerCase();
      q = q.or(`name.ilike.%${qLower}%,email.ilike.%${qLower}%,company_name.ilike.%${qLower}%,service_interest.ilike.%${qLower}%`);
    }

    if (statusFilter !== 'all') {
      q = q.eq('status', statusFilter);
    }

    if (assigneeFilter === 'mine' && profile) {
      q = q.eq('assigned_to', profile.id);
    } else if (assigneeFilter === 'unassigned') {
      q = q.is('assigned_to', null);
    } else if (assigneeFilter !== 'all' && assigneeFilter !== 'mine' && assigneeFilter !== 'unassigned') {
      q = q.eq('assigned_to', assigneeFilter);
    }

    switch (sortMode) {
      case 'oldest': q = q.order('created_at', { ascending: true }); break;
      case 'name': q = q.order('name', { ascending: true }); break;
      case 'company': q = q.order('company_name', { ascending: true, nullsFirst: false }); break;
      default: q = q.order('created_at', { ascending: false }); break;
    }

    q = q.order('id', { ascending: true });
    q = q.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    return q;
  }, [searchQuery, statusFilter, assigneeFilter, sortMode, page, profile]);

  const fetchLeads = async (cancelled: () => boolean) => {
    setLoadError('');
    const q = buildQuery();
    const { data, error, count } = await q;
    if (cancelled()) return;
    if (error) {
      setLoadError(error.message);
      setLoading(false);
      return;
    }
    setLeads(data || []);
    setTotalCount(count || 0);
    setLoading(false);
    setRefreshing(false);
  };

  const fetchStats = async () => {
    const counts = await Promise.all([
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'contacted'),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'qualified'),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'converted'),
      supabase.from('leads').select('id', { count: 'exact', head: true }),
    ]);

    setStats({
      newCount: counts[0].count || 0,
      contacted: counts[1].count || 0,
      qualified: counts[2].count || 0,
      converted: counts[3].count || 0,
      total: counts[4].count || 0,
    });
  };

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    fetchLeads(() => cancelled);
    fetchStats();
    return () => { cancelled = true; };
  }, [searchQuery, statusFilter, assigneeFilter, sortMode, page, profile]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLeads(() => false);
    await fetchStats();
    setRefreshing(false);
  };

  const handleStatusChange = async (id: string, status: string) => {
    setStatusUpdating(p => ({ ...p, [id]: true }));
    const { error } = await supabase.from('leads').update({
      status,
      stage: status,
      updated_at: new Date().toISOString(),
      stage_changed_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    }).eq('id', id);

    if (error) {
      showToast('Failed to update status: ' + error.message, 'error');
      setStatusUpdating(p => ({ ...p, [id]: false }));
      return;
    }

    if (status !== 'closed' && status !== 'converted') {
      const { data: historyData } = await supabase.from('lead_stage_history').select('stage').eq('lead_id', id).order('created_at', { ascending: false }).limit(1);
      const fromStage = historyData?.[0]?.stage || 'new';
      await supabase.from('lead_stage_history').insert({
        lead_id: id,
        from_stage: fromStage,
        to_stage: status,
        changed_by: profile?.id,
      });
    }

    setLeads(prev => prev.map(l => l.id === id ? { ...l, status, stage: status } : l));
    setStatusUpdating(p => ({ ...p, [id]: false }));
    fetchStats();
    showToast(`Lead marked as ${status}`, 'success');
  };

  const handleAssign = async (id: string, staffId: string) => {
    setAssignUpdating(p => ({ ...p, [id]: true }));
    const { error } = await supabase.from('leads').update({
      assigned_to: staffId || null,
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    }).eq('id', id);

    if (error) {
      showToast('Failed to reassign: ' + error.message, 'error');
      setAssignUpdating(p => ({ ...p, [id]: false }));
      return;
    }
    setLeads(prev => prev.map(l => l.id === id ? { ...l, assigned_to: staffId || null } : l));
    setAssignUpdating(p => ({ ...p, [id]: false }));
    showToast(staffId ? 'Lead assigned' : 'Lead unassigned', 'success');
  };

  const handleCloseLead = async (lead: Lead) => {
    setSelectedLead(null);
    await handleStatusChange(lead.id, 'closed');
  };

  const handleDelete = async () => {
    if (!deletingLead) return;
    const { error } = await supabase.from('leads').delete().eq('id', deletingLead.id);
    if (error) {
      showToast('Failed to delete: ' + error.message, 'error');
      setDeletingLead(null);
      return;
    }
    setLeads(prev => prev.filter(l => l.id !== deletingLead.id));
    setDeletingLead(null);
    fetchStats();
    showToast('Lead deleted', 'success');
  };

  const handleConverted = (clientId: string) => {
    setLeads(prev => prev.map(l => l.id === convertingLead?.id ? { ...l, status: 'converted', stage: 'converted', converted_to_client: clientId } : l));
    setConvertingLead(null);
    fetchStats();
  };

  const handleCardFilter = (status: string) => {
    setStatusFilter(statusFilter === status ? 'all' : status);
    setPage(0);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setAssigneeFilter('all');
    setSortMode('newest');
    setPage(0);
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || assigneeFilter !== 'all' || sortMode !== 'newest';

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const kpiCards = [
    { label: 'Active Leads', value: stats.total - stats.converted, color: '#94A3B8', status: null },
    { label: 'New', value: stats.newCount, color: '#06B6D4', status: 'new' },
    { label: 'Contacted', value: stats.contacted, color: '#F59E0B', status: 'contacted' },
    { label: 'Qualified', value: stats.qualified, color: '#10B981', status: 'qualified' },
    { label: 'Converted', value: stats.converted, color: '#8B5CF6', status: 'converted' },
  ];

  if (loading) {
    return (
      <StaffShell>
        <LeadsSkeleton />
      </StaffShell>
    );
  }

  if (loadError) {
    return (
      <StaffShell>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangle className="w-12 h-12 text-[#EF4444] mb-4" />
            <p className="text-white font-bold text-lg mb-1">Unable to load leads</p>
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
              <span className="text-slate-300">Leads</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Leads</h1>
            <p className="text-sm text-slate-400 mt-0.5">Review, qualify and convert incoming enquiries</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-[#06B6D4] hover:border-[#06B6D4]/20 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
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
                  placeholder="Search by name, email, company, or service..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/15 focus:border-[#06B6D4]/30 transition-all"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <FilterSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(0); }} options={[
                  { value: 'all', label: 'All Status' },
                  ...VALID_STATUSES.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })),
                ]} />

                <FilterSelect value={assigneeFilter} onChange={(v) => { setAssigneeFilter(v); setPage(0); }} options={[
                  { value: 'all', label: 'All Assignees' },
                  { value: 'mine', label: 'Mine' },
                  { value: 'unassigned', label: 'Unassigned' },
                  ...staff.map(s => ({ value: s.id, label: s.full_name || 'Unknown' })),
                ]} />

                <FilterSelect value={sortMode} onChange={(v) => { setSortMode(v); setPage(0); }} options={[
                  { value: 'newest', label: 'Newest' },
                  { value: 'oldest', label: 'Oldest' },
                  { value: 'name', label: 'Name' },
                  { value: 'company', label: 'Company' },
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
              {totalCount} lead{totalCount !== 1 ? 's' : ''}
              {hasActiveFilters && ' filtered'}
            </div>
          </div>

          {leads.length === 0 ? (
            <div className="text-center py-16">
              <UserCheck className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-300 font-medium mb-1">
                {hasActiveFilters ? 'No leads match your filters' : 'No leads yet'}
              </p>
              <p className="text-sm text-slate-500 mb-4">
                {hasActiveFilters ? 'Try adjusting your search or filters.' : 'Leads will appear here when someone submits the contact form.'}
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters}
                  className="px-4 py-2 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.06)]">
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Lead</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Company</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Service</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Budget</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Assigned</th>
                      <th className="text-left py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Received</th>
                      <th className="text-right py-3 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <LeadTableRow
                        key={lead.id}
                        lead={lead}
                        staff={staff}
                        isPrivileged={isPrivileged}
                        canDelete={canDelete}
                        statusUpdating={statusUpdating[lead.id]}
                        assignUpdating={assignUpdating[lead.id]}
                        onSelect={() => setSelectedLead(lead)}
                        onStatusChange={handleStatusChange}
                        onAssign={handleAssign}
                        onConvert={() => setConvertingLead(lead)}
                        onDelete={() => setDeletingLead(lead)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden">
                {leads.map((lead) => (
                  <LeadMobileCard
                    key={lead.id}
                    lead={lead}
                    staff={staff}
                    isPrivileged={isPrivileged}
                    onSelect={() => setSelectedLead(lead)}
                    onStatusChange={handleStatusChange}
                    onAssign={handleAssign}
                    statusUpdating={statusUpdating[lead.id]}
                    assignUpdating={assignUpdating[lead.id]}
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
          {selectedLead && (
            <LeadDetailDrawer
              lead={selectedLead}
              staff={staff}
              currentUserId={profile?.id || ''}
              currentUserRole={profile?.role || 'staff'}
              onClose={() => setSelectedLead(null)}
              onStatusChange={handleStatusChange}
              onAssign={handleAssign}
              onConvert={(lead) => { setSelectedLead(null); setConvertingLead(lead); }}
              onCloseLead={handleCloseLead}
            />
          )}

          {convertingLead && (
            <LeadConversionDialog
              lead={convertingLead}
              onClose={() => setConvertingLead(null)}
              onConverted={handleConverted}
            />
          )}

          {deletingLead && (
            <LeadDeleteDialog
              leadName={deletingLead.name}
              onConfirm={handleDelete}
              onClose={() => setDeletingLead(null)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
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

function LeadTableRow({
  lead, staff, isPrivileged, canDelete,
  statusUpdating, assignUpdating,
  onSelect, onStatusChange, onAssign, onConvert, onDelete,
}: {
  lead: Lead;
  staff: StaffInfo[];
  isPrivileged: boolean;
  canDelete: boolean;
  statusUpdating?: boolean;
  assignUpdating?: boolean;
  onSelect: () => void;
  onStatusChange: (id: string, status: string) => void;
  onAssign: (id: string, staffId: string) => void;
  onConvert: () => void;
  onDelete: () => void;
}) {
  const statusStyle = getStatusStyle(lead.status);
  const assignedStaff = staff.find(s => s.id === lead.assigned_to);
  const initials = lead.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <tr className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors group">
      <td className="py-3.5 px-4">
        <button onClick={onSelect} className="flex items-center gap-3 cursor-pointer text-left w-full">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#06B6D4]/10 to-[#06B6D4]/10 flex items-center justify-center text-xs font-bold text-[#06B6D4] shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate max-w-[180px]">{lead.name}</p>
            <p className="text-xs text-slate-500 truncate max-w-[180px]">{lead.email}</p>
          </div>
        </button>
      </td>
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-1.5 text-sm text-slate-400">
          <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
          <span className="truncate max-w-[140px]">{lead.company_name || '—'}</span>
        </div>
      </td>
      <td className="py-3.5 px-4 text-sm text-slate-400 max-w-[130px] truncate">{lead.service_interest || '—'}</td>
      <td className="py-3.5 px-4 text-sm text-slate-400">{lead.budget_range || '—'}</td>
      <td className="py-3.5 px-4">
        {isPrivileged && lead.status !== 'converted' && lead.status !== 'closed' ? (
          <div className="relative">
            <select
              value={lead.status}
              onChange={(e) => onStatusChange(lead.id, e.target.value)}
              disabled={statusUpdating}
              className="px-2 py-1 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-[11px] font-medium cursor-pointer appearance-none pr-5 disabled:opacity-50"
              style={{ color: statusStyle.color }}
            >
              {VALID_STATUSES.filter(s => s !== 'converted').map(s => {
                const st = getStatusStyle(s);
                return (
                  <option key={s} value={s} className="bg-[#1E293B]" style={{ color: st.color }}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                );
              })}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-slate-400 pointer-events-none" />
            {statusUpdating && <Loader2 className="absolute -right-5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 animate-spin" />}
          </div>
        ) : (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium border"
            style={{ borderColor: statusStyle.color + '30', backgroundColor: statusStyle.color + '10', color: statusStyle.color }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusStyle.color }} />
            {lead.status}
          </span>
        )}
      </td>
      <td className="py-3.5 px-4">
        {isPrivileged ? (
          <div className="relative">
            <select
              value={lead.assigned_to || ''}
              onChange={(e) => onAssign(lead.id, e.target.value)}
              disabled={assignUpdating}
              className="px-2 py-1 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-[11px] text-white cursor-pointer appearance-none pr-5 disabled:opacity-50"
            >
              <option value="" className="bg-[#1E293B]">Unassigned</option>
              {staff.map(s => (
                <option key={s.id} value={s.id} className="bg-[#1E293B]">{s.full_name || 'Unknown'}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-slate-400 pointer-events-none" />
            {assignUpdating && <Loader2 className="absolute -right-5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 animate-spin" />}
          </div>
        ) : (
          <span className="text-xs text-slate-400">{assignedStaff?.full_name || 'Unassigned'}</span>
        )}
      </td>
      <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
        {formatShortDate(lead.created_at)}
      </td>
      <td className="py-3.5 px-4">
        <div className="flex items-center justify-end gap-0.5">
          <button
            onClick={onSelect}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer"
            title="View details"
            aria-label={`View details for ${lead.name}`}
          >
            <Eye className="w-4 h-4" />
          </button>
          {isPrivileged && lead.status !== 'converted' && (
            <button
              onClick={onConvert}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#8B5CF6]/10 text-slate-400 hover:text-[#8B5CF6] transition-colors cursor-pointer"
              title="Convert to client"
              aria-label={`Convert ${lead.name} to client`}
            >
              <UserPlus className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={onDelete}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#EF4444]/10 text-slate-400 hover:text-[#EF4444] transition-colors cursor-pointer"
              title="Delete lead"
              aria-label={`Delete ${lead.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function LeadMobileCard({
  lead, staff, isPrivileged,
  onSelect, onStatusChange, onAssign,
  statusUpdating, assignUpdating,
}: {
  lead: Lead;
  staff: StaffInfo[];
  isPrivileged: boolean;
  onSelect: () => void;
  onStatusChange: (id: string, status: string) => void;
  onAssign: (id: string, staffId: string) => void;
  statusUpdating?: boolean;
  assignUpdating?: boolean;
}) {
  const statusStyle = getStatusStyle(lead.status);
  const assignedStaff = staff.find(s => s.id === lead.assigned_to);
  const initials = lead.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-4 border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors cursor-pointer"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#06B6D4]/10 to-[#06B6D4]/10 flex items-center justify-center text-xs font-bold text-[#06B6D4] shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{lead.name}</p>
            <p className="text-xs text-slate-500 truncate">{lead.email}</p>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border shrink-0 ml-2"
          style={{ borderColor: statusStyle.color + '30', backgroundColor: statusStyle.color + '10', color: statusStyle.color }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusStyle.color }} />
          {lead.status}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mb-2">
        <span className="flex items-center gap-1">
          <Building2 className="w-3 h-3 text-slate-500" />
          {lead.company_name || '—'}
        </span>
        <span className="flex items-center gap-1">
          <ArrowUpRight className="w-3 h-3 text-slate-500" />
          {lead.service_interest || '—'}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-500" />
          {formatShortDate(lead.created_at)}
        </span>
        <span className="flex items-center gap-1">
          <UserCheck className="w-3 h-3 text-slate-500" />
          {assignedStaff?.full_name || 'Unassigned'}
        </span>
      </div>
    </button>
  );
}

export default function StaffLeadsPage() {
  return (
    <Suspense fallback={
      <StaffShell>
        <LeadsSkeleton />
      </StaffShell>
    }>
      <LeadsContent />
    </Suspense>
  );
}
