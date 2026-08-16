'use client';

import { AlertCircle, CheckCircle, Clock, Flag, Plus, Loader2, Edit2, X } from 'lucide-react';
import { useState } from 'react';

interface Milestone {
  id: string;
  title: string;
  name: string | null;
  description: string | null;
  status: string;
  due_date: string | null;
  amount: number | null;
  payment_status: string | null;
}

export default function ProjectMilestonesTab({
  milestones,
  loading,
  error,
  canEdit,
  canViewFinance,
  onRetry,
}: {
  milestones: Milestone[];
  loading: boolean;
  error: string | null;
  canEdit: boolean;
  canViewFinance: boolean;
  onRetry: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getMilestoneIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-[#10B981]" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-[#F59E0B]" />;
      case 'blocked': return <AlertCircle className="w-5 h-5 text-[#EF4444]" />;
      default: return <Flag className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-[#10B981]/10 text-[#10B981]';
      case 'in_progress': return 'bg-[#F59E0B]/10 text-[#F59E0B]';
      case 'blocked': return 'bg-[#EF4444]/10 text-[#EF4444]';
      default: return 'bg-white/5 text-slate-400';
    }
  };

  const today = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <div className="space-y-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5" />
              <div className="flex-1"><div className="h-4 bg-white/5 rounded w-3/4 mb-2" /><div className="h-3 bg-white/5 rounded w-1/2" /></div>
              <div className="w-20 h-6 bg-white/5 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-10 h-10 text-[#F59E0B] mx-auto mb-3" />
          <p className="text-slate-300 font-medium mb-1">Could not load milestones</p>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button onClick={onRetry}
            className="px-4 py-2 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl">
        <div className="text-center py-16">
          <Flag className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-300 font-medium mb-1">No milestones yet</p>
          <p className="text-sm text-slate-500">Milestones for this project will appear here.</p>
        </div>
      </div>
    );
  }

  const sorted = [...milestones].sort((a, b) => {
    const order: Record<string, number> = { in_progress: 0, blocked: 1, pending: 2, completed: 3 };
    const aOrd = order[a.status] ?? 5;
    const bOrd = order[b.status] ?? 5;
    if (aOrd !== bOrd) return aOrd - bOrd;
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return 0;
  });

  return (
    <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
      <div className="divide-y divide-[rgba(255,255,255,0.04)]">
        {sorted.map(m => {
          const isOverdue = m.due_date && m.due_date < today && m.status !== 'completed';
          const displayTitle = m.title || m.name || 'Untitled';
          return (
            <div key={m.id}>
              <button
                onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                className="w-full p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    m.status === 'completed' ? 'bg-[#10B981]/10' : m.status === 'in_progress' ? 'bg-[#F59E0B]/10' : m.status === 'blocked' ? 'bg-[#EF4444]/10' : 'bg-white/5'
                  }`}>
                    {getMilestoneIcon(m.status)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">{displayTitle}</p>
                    <p className="text-xs text-slate-400">
                      {m.due_date ? (
                        <span className={isOverdue ? 'text-[#EF4444] font-medium' : ''}>
                          Due {new Date(m.due_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {isOverdue && ' · Overdue'}
                        </span>
                      ) : 'No due date'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {canViewFinance && m.amount ? (
                    <span className="text-sm font-semibold text-slate-300">£{Number(m.amount).toLocaleString()}</span>
                  ) : null}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusStyle(m.status)}`}>
                    {m.status?.replace(/_/g, ' ') || 'pending'}
                  </span>
                </div>
              </button>
              {expandedId === m.id && m.description && (
                <div className="px-5 pb-5 pl-19">
                  <p className="text-sm text-slate-400 leading-relaxed">{m.description}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}