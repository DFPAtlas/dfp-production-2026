'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from '@/components/motion';
import {
  ArrowLeft, CheckCircle, Clock, AlertTriangle, XCircle,
  Eye, MessageSquare, ExternalLink, Calendar, ChevronRight,
  Loader2, Search, SlidersHorizontal,
} from 'lucide-react';
import Link from 'next/link';
import PortalShell from '../PortalShell';
import {
  APPROVAL_TYPES, APPROVAL_STATUSES,
  getApprovalTypeDef, getApprovalStatusDef,
} from '@/lib/approval-definitions';

interface Approval {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  approval_type: string;
  status: string;
  priority: string;
  version: number;
  due_date?: string | null;
  submitted_at?: string | null;
  viewed_at?: string | null;
  responded_at?: string | null;
  approved_at?: string | null;
}

interface ProjectBrief {
  id: string;
  name: string;
}

type FilterGroup = 'awaiting_me' | 'changes_requested' | 'approved' | 'completed';

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<(Approval & { project_name?: string })[]>([]);
  const [projects, setProjects] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterGroup>('awaiting_me');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError('Session expired'); setLoading(false); return; }

    const { data: clientData } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (!clientData) { setError('No client account found'); setLoading(false); return; }

    const { data: projectList } = await supabase
      .from('projects')
      .select('id, name')
      .eq('client_id', clientData.id);

    if (!projectList?.length) { setLoading(false); return; }

    const projectMap: Record<string, string> = {};
    for (const p of projectList) projectMap[p.id] = p.name;
    setProjects(projectMap);

    const projectIds = projectList.map(p => p.id);
    const { data: approvalsData } = await supabase
      .from('client_approvals')
      .select('*')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false });

    if (approvalsData) {
      setApprovals(approvalsData.map(a => ({
        ...a,
        project_name: projectMap[a.project_id] || 'Unknown project',
      })));
    }

    setLoading(false);
  }

  const filteredApprovals = approvals.filter(a => {
    switch (activeFilter) {
      case 'awaiting_me': return a.status === 'awaiting_client' || a.status === 'viewed' || a.status === 'resubmitted';
      case 'changes_requested': return a.status === 'changes_requested';
      case 'approved': return a.status === 'approved';
      case 'completed': return a.status === 'cancelled' || a.status === 'archived';
      default: return true;
    }
  });

  const filterCounts: Record<FilterGroup, number> = {
    awaiting_me: approvals.filter(a => ['awaiting_client', 'viewed', 'resubmitted'].includes(a.status)).length,
    changes_requested: approvals.filter(a => a.status === 'changes_requested').length,
    approved: approvals.filter(a => a.status === 'approved').length,
    completed: approvals.filter(a => ['cancelled', 'archived'].includes(a.status)).length,
  };

  const filters: { key: FilterGroup; label: string; icon: typeof CheckCircle }[] = [
    { key: 'awaiting_me', label: 'Awaiting My Review', icon: Clock },
    { key: 'changes_requested', label: 'Changes Requested', icon: AlertTriangle },
    { key: 'approved', label: 'Approved', icon: CheckCircle },
    { key: 'completed', label: 'Completed', icon: XCircle },
  ];

  if (loading) {
    return (
      <PortalShell>
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-3 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        </div>
      </PortalShell>
    );
  }

  if (error) {
    return (
      <PortalShell>
        <div className="text-center py-20">
          <AlertTriangle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">{error}</p>
          <button onClick={fetchData} className="text-sm text-[#06B6D4] hover:underline mt-2 inline-block">Retry</button>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell>
      <div className="mx-auto max-w-[1200px] space-y-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold tracking-tight text-white lg:text-[34px]">Approvals</h1>
          <p className="mt-1 text-sm text-slate-400">Review and respond to work submitted for your approval.</p>
        </motion.div>

        <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl p-1.5 overflow-x-auto">
          {filters.map(f => {
            const Icon = f.icon;
            const isActive = activeFilter === f.key;
            const count = filterCounts[f.key];
            return (
              <button key={f.key} onClick={() => setActiveFilter(f.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive ? 'bg-[#06B6D4] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}>
                <Icon className="w-4 h-4" /> {f.label}
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-400'
                  }`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {filteredApprovals.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-white/[0.07] bg-[#111F32] text-center p-10">
            {activeFilter === 'awaiting_me' ? (
              <>
                <CheckCircle className="w-14 h-14 text-[#4ADE80] mb-4" />
                <h3 className="text-lg font-semibold text-white">Nothing waiting for your review</h3>
                <p className="mt-2 text-sm text-slate-400 max-w-md">
                  When the Digital Footprint team submits work for your approval, it will appear here.
                </p>
              </>
            ) : activeFilter === 'changes_requested' ? (
              <>
                <AlertTriangle className="w-14 h-14 text-amber-400 mb-4" />
                <h3 className="text-lg font-semibold text-white">No changes requested</h3>
                <p className="mt-2 text-sm text-slate-400 max-w-md">
                  Approvals where you have requested changes will appear here.
                </p>
              </>
            ) : activeFilter === 'approved' ? (
              <>
                <CheckCircle className="w-14 h-14 text-emerald-400 mb-4" />
                <h3 className="text-lg font-semibold text-white">No approved items</h3>
                <p className="mt-2 text-sm text-slate-400 max-w-md">
                  Items you have approved will be listed here.
                </p>
              </>
            ) : (
              <>
                <XCircle className="w-14 h-14 text-slate-500 mb-4" />
                <h3 className="text-lg font-semibold text-white">No completed items</h3>
                <p className="mt-2 text-sm text-slate-400 max-w-md">
                  Archived and cancelled approvals will appear here.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApprovals.map(a => {
              const typeDef = getApprovalTypeDef(a.approval_type);
              const statusDef = getApprovalStatusDef(a.status);
              return (
                <Link key={a.id} href={`/portal/approvals/${a.id}`}
                  className="block bg-[#111F32] border border-white/[0.08] rounded-2xl p-5 hover:border-white/[0.15] hover:bg-[#132238] transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: statusDef.color }} />
                        <h3 className="text-lg font-bold text-white truncate">{a.title}</h3>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-500 shrink-0">v{a.version}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{a.project_name}</span>
                        <span className="text-slate-600">·</span>
                        <span style={{ color: typeDef.color }}>{typeDef.label}</span>
                        {a.submitted_at && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span>Submitted {new Date(a.submitted_at).toLocaleDateString('en-GB')}</span>
                          </>
                        )}
                        {a.due_date && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Due {new Date(a.due_date).toLocaleDateString('en-GB')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium"
                        style={{ backgroundColor: `${statusDef.color}15`, color: statusDef.color }}>
                        {statusDef.label}
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-500" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </PortalShell>
  );
}