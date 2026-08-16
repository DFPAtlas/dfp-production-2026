'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import { Users, Search, Filter, RefreshCw, UserPlus, ChevronDown, X, Loader2 } from 'lucide-react';
import AdminShell from '../../../components/admin/AdminShell';
import CrmOverview from '../../../components/admin/crm/CrmOverview';
import LeadsTable from '../../../components/admin/crm/LeadsTable';
import { useCrmData } from '@/hooks/useCrmData';
import type { CrmLead } from '@/hooks/useCrmData';
import type { LeadStage, LeadPriority, LeadSource } from '@/lib/crm-definitions';
import { STAGE_LABELS, PRIORITY_LABELS, SOURCE_LABELS } from '@/lib/crm-definitions';

export default function AdminLeadsPage() {
  const { leads, loading, error, fetchLeads, getMetrics, updateLead, deleteLead, bulkUpdate } = useCrmData();
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<CrmLead | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [assignModal, setAssignModal] = useState(false);

  const metrics = getMetrics();

  const filteredLeads = (() => {
    let result = leads;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l =>
        (l.name?.toLowerCase().includes(q)) ||
        (l.email?.toLowerCase().includes(q)) ||
        (l.company_name?.toLowerCase().includes(q)) ||
        (l.lead_reference?.toLowerCase().includes(q)) ||
        (l.contact_name?.toLowerCase().includes(q))
      );
    }
    if (stageFilter !== 'all') result = result.filter(l => l.stage === stageFilter);
    if (sourceFilter !== 'all') result = result.filter(l => l.source === sourceFilter);
    if (priorityFilter !== 'all') result = result.filter(l => l.priority === priorityFilter);
    if (unassignedOnly) result = result.filter(l => !l.assigned_to);
    if (overdueOnly) result = result.filter(l => l.next_action_due && new Date(l.next_action_due) < new Date());

    result.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortField];
      const bVal = (b as unknown as Record<string, unknown>)[sortField];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  })();

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredLeads.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredLeads.map(l => l.id)));
  };

  const handleStageChange = async (id: string, stage: LeadStage, reason?: string) => {
    await updateLead(id, { stage, lost_reason: stage === 'lost' ? reason : undefined, stage_changed_at: new Date().toISOString() });
  };

  const handlePriorityChange = async (id: string, priority: LeadPriority) => {
    await updateLead(id, { priority });
  };

  const handleDelete = async (id: string) => {
    await deleteLead(id);
    setDeleteConfirm(null);
  };

  const handleBulkAssign = async (ownerId: string) => {
    if (selectedIds.size === 0) return;
    await bulkUpdate(Array.from(selectedIds), { assigned_to: ownerId as never });
    setSelectedIds(new Set());
    setAssignModal(false);
  };

  const handleBulkStage = async (stage: LeadStage) => {
    if (selectedIds.size === 0) return;
    for (const id of Array.from(selectedIds)) {
      await updateLead(id, { stage, stage_changed_at: new Date().toISOString() });
    }
    setSelectedIds(new Set());
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-[#0066FF]/30 border-t-[#0066FF] rounded-full animate-spin" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">CRM & Leads</h1>
            <p className="text-sm text-slate-400 mt-0.5">Pipeline management, lead tracking and sales operations</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> Add Lead
            </button>
          </div>
        </div>

        <CrmOverview metrics={metrics} leads={leads} />

        <div className="mt-8 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[rgba(255,255,255,0.06)] space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text" placeholder="Search by name, email, company, or reference..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm transition-all cursor-pointer ${showFilters ? 'bg-[#06B6D4]/10 border-[#06B6D4]/30 text-[#06B6D4]' : 'bg-white/5 border-[rgba(255,255,255,0.08)] text-slate-300 hover:border-white/15'}`}
                >
                  <Filter className="w-4 h-4" /> Filters
                  {showFilters ? <ChevronDown className="w-3 h-3 rotate-180" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                <button onClick={() => { fetchLeads(); }}
                  className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-300 hover:text-[#06B6D4] hover:border-[#06B6D4]/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Refresh
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="flex flex-wrap gap-3 overflow-hidden"
                >
                  <div className="relative">
                    <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}
                      className="pl-3 pr-8 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs cursor-pointer appearance-none"
                    >
                      <option value="all">All Stages</option>
                      {Object.entries(STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}
                      className="pl-3 pr-8 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs cursor-pointer appearance-none"
                    >
                      <option value="all">All Sources</option>
                      {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
                      className="pl-3 pr-8 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs cursor-pointer appearance-none"
                    >
                      <option value="all">All Priorities</option>
                      {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                  </div>
                  <button onClick={() => setUnassignedOnly(!unassignedOnly)}
                    className={`px-3 py-2 rounded-lg text-xs border transition-all cursor-pointer ${unassignedOnly ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-white/5 border-[rgba(255,255,255,0.08)] text-slate-400 hover:border-white/15'}`}
                  >Unassigned</button>
                  <button onClick={() => setOverdueOnly(!overdueOnly)}
                    className={`px-3 py-2 rounded-lg text-xs border transition-all cursor-pointer ${overdueOnly ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/5 border-[rgba(255,255,255,0.08)] text-slate-400 hover:border-white/15'}`}
                  >Overdue Follow-up</button>
                  {(stageFilter !== 'all' || sourceFilter !== 'all' || priorityFilter !== 'all' || unassignedOnly || overdueOnly || searchQuery) && (
                    <button onClick={() => { setStageFilter('all'); setSourceFilter('all'); setPriorityFilter('all'); setUnassignedOnly(false); setOverdueOnly(false); setSearchQuery(''); }}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white transition-colors cursor-pointer"
                    ><X className="w-3 h-3" /> Clear All</button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 bg-[#06B6D4]/10 border border-[#06B6D4]/20 rounded-xl px-4 py-2">
                <span className="text-sm text-[#06B6D4] font-medium">{selectedIds.size} selected</span>
                <div className="h-4 w-px bg-[#06B6D4]/20 mx-1" />
                <button onClick={() => handleBulkStage('qualified')} className="text-xs text-slate-300 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 cursor-pointer">Mark Qualified</button>
                <button onClick={() => setAssignModal(true)} className="text-xs text-slate-300 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 cursor-pointer">Assign</button>
                <button onClick={() => setSelectedIds(new Set())} className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 cursor-pointer ml-auto">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 mx-4 mt-4 rounded-xl">
              <p className="text-sm text-red-400">{error}</p>
              <button onClick={fetchLeads} className="text-xs text-red-300 underline mt-1 cursor-pointer">Retry</button>
            </div>
          )}

          <LeadsTable
            leads={filteredLeads}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleAll={toggleAll}
            onStageChange={handleStageChange}
            onPriorityChange={handlePriorityChange}
            onDelete={(id) => setDeleteConfirm(id)}
            onAssign={(ids) => { setAssignModal(true); }}
            sortField={sortField}
            sortDir={sortDir}
            onSort={(f) => {
              if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
              else { setSortField(f); setSortDir('asc'); }
            }}
          />

          {filteredLeads.length === 0 && !error && (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No leads found</p>
              <p className="text-sm text-slate-500 mt-1">
                {searchQuery || stageFilter !== 'all' || sourceFilter !== 'all' ? 'Try adjusting your filters' : 'Leads will appear here when visitors submit the contact form'}
              </p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#1E293B] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl max-w-sm w-full p-6"
              onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-2">Delete Lead?</h3>
              <p className="text-sm text-slate-400 mb-6">This action cannot be undone. Notes and follow-ups will also be removed.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 bg-white/5 text-slate-400 rounded-xl text-sm font-semibold hover:bg-white/10 cursor-pointer">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 cursor-pointer">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <LeadFormModal
            lead={editingLead}
            onClose={() => { setShowForm(false); setEditingLead(null); }}
            onSaved={() => { fetchLeads(); setShowForm(false); setEditingLead(null); }}
          />
        )}
      </AnimatePresence>
    </AdminShell>
  );
}

function LeadFormModal({ lead, onClose, onSaved }: { lead: CrmLead | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: lead?.name || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    company_name: lead?.company_name || '',
    website: lead?.website || '',
    contact_name: lead?.contact_name || '',
    contact_role: lead?.contact_role || '',
    contact_phone: lead?.contact_phone || '',
    service_interest: lead?.service_interest || '',
    source: (lead?.source || 'website_form') as LeadSource,
    priority: (lead?.priority || 'medium') as LeadPriority,
    estimated_value: lead?.estimated_value?.toString() || '',
    next_action: lead?.next_action || '',
    industry: lead?.industry || '',
    message: lead?.message || '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { setFormError('Name and email are required'); return; }
    setSaving(true);
    setFormError('');
    const payload = {
      name: form.name, email: form.email, phone: form.phone || null,
      company_name: form.company_name || null, website: form.website || null,
      contact_name: form.contact_name || null, contact_role: form.contact_role || null,
      contact_phone: form.contact_phone || null, service_interest: form.service_interest || null,
      source: form.source, priority: form.priority,
      estimated_value: form.estimated_value ? parseFloat(form.estimated_value) : null,
      next_action: form.next_action || null, industry: form.industry || null,
      message: form.message || null, updated_at: new Date().toISOString(),
    };
    if (lead) {
      const { error } = await supabase.from('leads').update(payload).eq('id', lead.id);
      if (error) { setFormError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from('leads').insert([{ ...payload, stage: 'new', source: form.source, priority: form.priority }]);
      if (error) { setFormError(error.message); setSaving(false); return; }
    }
    setSaving(false);
    onSaved();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="bg-[#1E293B] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">{lead ? 'Edit Lead' : 'Add New Lead'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="Full name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email *</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="email@company.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Company</label>
              <input type="text" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="Company Ltd" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Phone</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="+44 7700 900000" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Source</label>
              <div className="relative">
                <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value as LeadSource })}
                  className="w-full px-3 pr-8 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs cursor-pointer appearance-none">
                  {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Priority</label>
              <div className="relative">
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as LeadPriority })}
                  className="w-full px-3 pr-8 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-xs cursor-pointer appearance-none">
                  {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Est. Value (£)</label>
              <input type="number" value={form.estimated_value} onChange={e => setForm({ ...form, estimated_value: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="5000" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Service Interest</label>
            <input type="text" value={form.service_interest} onChange={e => setForm({ ...form, service_interest: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" placeholder="e.g. Website Development, SEO" />
          </div>
          {formError && <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-xl">{formError}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-white/5 text-slate-400 rounded-xl text-sm font-semibold hover:bg-white/10 cursor-pointer">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] disabled:opacity-50 cursor-pointer">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : lead ? 'Update Lead' : 'Add Lead'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
