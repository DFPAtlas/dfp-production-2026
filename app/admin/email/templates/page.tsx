'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from '@/components/motion';
import Link from 'next/link';
import EmailTemplateForm from '@/app/admin/email-templates/EmailTemplateForm';
import SendTestModal from '@/app/admin/email-templates/SendTestModal';
import TemplateEditor from '@/components/admin/email/editor/TemplateEditor';
import { EmailTemplate as EditorEmailTemplate } from '@/components/admin/email/editor/editor-types';
import {
  Plus, Search, Mail, Edit3, Trash2, Send, Clock, CheckCircle, AlertTriangle,
  Image, Filter, X, Grid3X3, List, Copy, Archive, RotateCcw, Eye,
  ChevronDown, SlidersHorizontal, ArrowUpDown, Tag, FileText,
  Monitor, Smartphone, MoreHorizontal, Check,
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  category: string;
  variables: string[] | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

const BRANDS = ['Digital Footprint', 'Wedora', 'LetHub', 'GuardianHub', 'QuickGuard', 'The Forge'];

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'general', label: 'General' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'account-verification', label: 'Account Verification' },
  { value: 'password-reset', label: 'Password Reset' },
  { value: 'invitation', label: 'Invitation' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'project', label: 'Project Update' },
  { value: 'lead', label: 'Lead' },
  { value: 'notification', label: 'Notification' },
  { value: 'payment', label: 'Payment' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'announcement', label: 'Product Announcement' },
];

const EXISTING_CATEGORIES = ['all', 'general', 'welcome', 'invoice', 'project', 'lead', 'notification'];

const STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
];

const SORT_OPTIONS = [
  { value: 'updated_at-desc', label: 'Recently Updated' },
  { value: 'created_at-desc', label: 'Recently Created' },
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
  { value: 'category-asc', label: 'Category' },
];

const CATEGORY_META: Record<string, { label: string; color: string; bg: string }> = {
  general: { label: 'General', color: 'text-slate-300', bg: 'bg-slate-500/10 border-slate-500/20' },
  welcome: { label: 'Welcome', color: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  invoice: { label: 'Invoice', color: 'text-amber-300', bg: 'bg-amber-500/10 border-amber-500/20' },
  project: { label: 'Project', color: 'text-sky-300', bg: 'bg-sky-500/10 border-sky-500/20' },
  lead: { label: 'Lead', color: 'text-violet-300', bg: 'bg-violet-500/10 border-violet-500/20' },
  notification: { label: 'Notification', color: 'text-rose-300', bg: 'bg-rose-500/10 border-rose-500/20' },
  'account-verification': { label: 'Account Verification', color: 'text-cyan-300', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  'password-reset': { label: 'Password Reset', color: 'text-orange-300', bg: 'bg-orange-500/10 border-orange-500/20' },
  invitation: { label: 'Invitation', color: 'text-indigo-300', bg: 'bg-indigo-500/10 border-indigo-500/20' },
  payment: { label: 'Payment', color: 'text-lime-300', bg: 'bg-lime-500/10 border-lime-500/20' },
  marketing: { label: 'Marketing', color: 'text-pink-300', bg: 'bg-pink-500/10 border-pink-500/20' },
  announcement: { label: 'Announcement', color: 'text-teal-300', bg: 'bg-teal-500/10 border-teal-500/20' },
};

const DISPLAY_CATEGORIES = EXISTING_CATEGORIES.filter((c) => c !== 'all');

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('updated_at-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [archiveConfirm, setArchiveConfirm] = useState<string | null>(null);
  const [restoreConfirm, setRestoreConfirm] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [sendTestTemplate, setSendTestTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [moreOpenId, setMoreOpenId] = useState<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [editTemplateId, setEditTemplateId] = useState<string | null>(null);
  const [editTemplateData, setEditTemplateData] = useState<EditorEmailTemplate | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const handleEdit = useCallback((id: string) => {
    setEditTemplateId(id);
  }, []);

  useEffect(() => {
    if (!editTemplateId) return;
    setEditLoading(true);
    const fetchForEdit = async () => {
      const { data, error } = await supabase.from('email_templates').select('*').eq('id', editTemplateId).maybeSingle();
      if (data && !error) setEditTemplateData(data as unknown as EditorEmailTemplate);
      setEditLoading(false);
    };
    fetchForEdit();
  }, [editTemplateId]);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('email_templates').select('*').order('updated_at', { ascending: false });
    if (!error && data) setTemplates(data as EmailTemplate[]);
    setLoading(false);
  }, []);

  const handleSaveAndExit = useCallback(() => {
    setEditTemplateData(null);
    setEditTemplateId(null);
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCloseEditor = () => {
    setEditTemplateData(null);
    setEditTemplateId(null);
  };

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setDebouncedSearch(search), 250);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [search]);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('email-templates-view') : null;
    if (stored === 'list') setViewMode('list');
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.more-menu')) setMoreOpenId(null);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') localStorage.setItem('email-templates-view', mode);
  };

  const filtered = templates.filter((t) => {
    const matchCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchSearch = !debouncedSearch
      || t.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      || t.subject.toLowerCase().includes(debouncedSearch.toLowerCase())
      || t.category.toLowerCase().includes(debouncedSearch.toLowerCase());
    return matchCategory && matchSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    const [field, dir] = sortBy.split('-');
    const multiplier = dir === 'desc' ? -1 : 1;
    if (field === 'name') return multiplier * a.name.localeCompare(b.name);
    if (field === 'category') return multiplier * a.category.localeCompare(b.category);
    return multiplier * (new Date(a[field as keyof EmailTemplate] as string).getTime() - new Date(b[field as keyof EmailTemplate] as string).getTime());
  });

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('email_templates').delete().eq('id', id);
    if (!error) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      setStatusMsg({ type: 'success', text: 'Template deleted' });
    } else {
      setStatusMsg({ type: 'error', text: 'Failed to delete template' });
    }
    setDeleteConfirm(null);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleDuplicate = async (id: string) => {
    setDuplicating(id);
    const template = templates.find((t) => t.id === id);
    if (!template) { setDuplicating(null); return; }
    const { data: userData } = await supabase.auth.getUser();
    const { data: profileData } = await supabase.from('admin_profiles').select('organisation_id').eq('id', userData.user?.id || '').maybeSingle();
    const { error } = await supabase.from('email_templates').insert({
      name: `${template.name} Copy`,
      subject: template.subject,
      html_content: template.html_content,
      category: template.category,
      variables: template.variables,
      created_by: userData.user?.id,
      organisation_id: profileData?.organisation_id || null,
      updated_at: new Date().toISOString(),
    });
    if (!error) {
      setStatusMsg({ type: 'success', text: 'Template duplicated' });
      fetchTemplates();
    } else {
      setStatusMsg({ type: 'error', text: 'Failed to duplicate' });
    }
    setDuplicating(null);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleRename = async () => {
    if (!renameId || !renameValue.trim()) return;
    const { error } = await supabase.from('email_templates').update({ name: renameValue.trim(), updated_at: new Date().toISOString() }).eq('id', renameId);
    if (!error) {
      setTemplates((prev) => prev.map((t) => t.id === renameId ? { ...t, name: renameValue.trim() } : t));
      setStatusMsg({ type: 'success', text: 'Template renamed' });
    } else {
      setStatusMsg({ type: 'error', text: 'Failed to rename' });
    }
    setRenameId(null);
    setRenameValue('');
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedTemplateIds);
    await supabase.from('email_templates').delete().in('id', ids);
    setTemplates((prev) => prev.filter((t) => !selectedTemplateIds.has(t.id)));
    setSelectedTemplateIds(new Set());
    setStatusMsg({ type: 'success', text: `${ids.length} templates deleted` });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const toggleSelect = (id: string) => {
    setSelectedTemplateIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedStatus('all');
    setSortBy('updated_at-desc');
  };

  const hasActiveFilters = selectedCategory !== 'all' || selectedBrand !== 'all' || selectedStatus !== 'all' || debouncedSearch !== '';

  const renderPreview = (template: EmailTemplate) => {
    let html = template.html_content;
    (template.variables || []).forEach((v) => {
      html = html.replaceAll(`{{${v}}}`, `[${v}]`);
      html = html.replaceAll(`{{ ${v} }}`, `[${v}]`);
    });
    return html;
  };

  if (editTemplateData) {
    return (
      <div className="h-[calc(100vh-57px)] flex flex-col">
        <TemplateEditor template={editTemplateData} onSaveAndExit={handleSaveAndExit} />
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={handleCloseEditor}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1a1a1e] border border-[rgba(255,255,255,0.12)] text-slate-300 rounded-xl font-semibold text-sm hover:bg-white/[0.06] hover:text-white transition-all cursor-pointer whitespace-nowrap shadow-2xl"
          >
            <ArrowUpDown className="w-4 h-4" />
            Back to Templates
          </button>
        </div>
      </div>
    );
  }

  if (editLoading) {
    return (
      <div className="h-[calc(100vh-57px)] flex items-center justify-center bg-[#0a0a0c]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AnimatePresence>
        {statusMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className={`px-4 py-3 rounded-xl text-sm font-medium border ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/[0.06] text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/[0.06] text-red-400 border-red-500/20'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              {statusMsg.text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Email Templates</h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-xl">
            Manage reusable email designs across Digital Footprint and its product brands.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Link
            href="/admin/email-templates/images"
            className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] text-slate-300 rounded-xl font-semibold text-sm hover:bg-white/[0.08] hover:border-[rgba(255,255,255,0.12)] transition-all cursor-pointer whitespace-nowrap"
          >
            <Image className="w-4 h-4" />
            Image Library
          </Link>
<button
            onClick={() => { setEditingTemplate(null); setFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-[#06B6D4]/10"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, subject, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 w-full bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 transition-all"
          />
          {search && (
            <button onClick={() => { setSearch(''); setDebouncedSearch(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {DISPLAY_CATEGORIES.map((cat) => {
            const meta = CATEGORY_META[cat] || { label: cat, color: 'text-slate-300', bg: 'bg-slate-500/10 border-slate-500/20' };
            const active = selectedCategory === cat;
            const count = templates.filter((t) => t.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(active ? 'all' : cat)}
                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  active
                    ? 'bg-white/[0.06] border-white/[0.12] text-white'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <span>{meta.label}</span>
                {count > 0 && <span className="text-[10px] text-slate-600">{count}</span>}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                showFilters || hasActiveFilters
                  ? 'bg-white/[0.06] border-white/[0.12] text-white'
                  : 'bg-white/[0.02] border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />}
            </button>
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-12 w-72 bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl p-4 z-50 space-y-4"
                  onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
                >
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Brand</label>
                    <div className="space-y-1">
                      <button onClick={() => setSelectedBrand('all')} className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${selectedBrand === 'all' ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'}`}>All Brands</button>
                      {BRANDS.map((b) => (
                        <button key={b} onClick={() => setSelectedBrand(b)} className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${selectedBrand === b ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'}`}>{b}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                    <div className="space-y-1">
                      {STATUSES.map((s) => (
                        <button key={s.value} onClick={() => setSelectedStatus(s.value)} className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${selectedStatus === s.value ? 'bg-[#06B6D4]/10 text-[#06B6D4]' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'}`}>{s.label}</button>
                      ))}
                    </div>
                  </div>
                  <button onClick={clearFilters} className="w-full py-2 rounded-xl border border-[rgba(255,255,255,0.08)] text-xs text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer">Clear All Filters</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2.5 bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <div className="flex items-center bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden">
            <button
              onClick={() => handleViewModeChange('grid')}
              className={`w-9 h-9 flex items-center justify-center transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white/[0.06] text-white' : 'text-slate-500 hover:text-white'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleViewModeChange('list')}
              className={`w-9 h-9 flex items-center justify-center transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-white/[0.06] text-white' : 'text-slate-500 hover:text-white'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {selectedTemplateIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs font-medium hover:bg-red-500/20 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete {selectedTemplateIds.size}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{sorted.length} template{sorted.length !== 1 ? 's' : ''} found</span>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-[#06B6D4] hover:underline cursor-pointer">
            <RotateCcw className="w-3 h-3" /> Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-2'}`}>
          {viewMode === 'grid' ? (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden animate-pulse">
                <div className="h-36 bg-white/[0.02]" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-white/[0.04] rounded w-2/3" />
                  <div className="h-3 bg-white/[0.04] rounded w-full" />
                  <div className="h-3 bg-white/[0.04] rounded w-1/2" />
                </div>
              </div>
            ))
          ) : (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl animate-pulse" />
            ))
          )}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-[rgba(255,255,255,0.04)] flex items-center justify-center mb-4">
            {templates.length === 0 ? <Mail className="w-7 h-7 text-slate-600" /> : <Search className="w-7 h-7 text-slate-600" />}
          </div>
          <p className="text-lg font-semibold text-white mb-1">
            {templates.length === 0 ? 'No templates yet' : hasActiveFilters ? 'No matching templates' : 'No templates found'}
          </p>
          <p className="text-sm text-slate-400 text-center max-w-sm mb-6">
            {templates.length === 0
              ? 'Create your first email template to start building professional communications.'
              : hasActiveFilters
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'Get started by creating your first template.'}
          </p>
          {templates.length === 0 && (
            <button
              onClick={() => { setEditingTemplate(null); setFormOpen(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Create First Template
            </button>
          )}
          {templates.length > 0 && hasActiveFilters && (
            <button onClick={clearFilters} className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap">
              <RotateCcw className="w-4 h-4" /> Clear All Filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map((template) => {
            const meta = CATEGORY_META[template.category] || { label: template.category, color: 'text-slate-300', bg: 'bg-slate-500/10 border-slate-500/20' };
            const varCount = template.variables?.length || 0;
            const isSelected = selectedTemplateIds.has(template.id);

            return (
              <div
                key={template.id}
                className={`group bg-[#121215] border rounded-2xl overflow-hidden transition-all ${
                  isSelected ? 'border-[#06B6D4] ring-1 ring-[#06B6D4]/30' : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]'
                }`}
              >
                <div className="h-36 bg-white/[0.02] relative overflow-hidden border-b border-[rgba(255,255,255,0.04)] cursor-pointer" onClick={() => setPreviewTemplate(template)}>
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="p-4 scale-[0.4] origin-top-left w-[250%]">
                      <div className="max-w-[600px] mx-auto font-sans text-[8px] leading-tight text-slate-500">
                        <div className="text-[7px] text-slate-600 mb-1 font-medium">Subject: {template.subject}</div>
                        <div dangerouslySetInnerHTML={{ __html: template.html_content.slice(0, 600) }} />
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#121215] to-transparent" />

                  <button
                    onClick={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); toggleSelect(template.id); }}
                    className={`absolute top-2 left-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer z-10 ${
                      isSelected ? 'bg-[#06B6D4] text-white' : 'bg-black/30 text-white/0 group-hover:text-white/70'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </button>

                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); setPreviewTemplate(template); setPreviewMode('desktop'); }}
                      className="w-8 h-8 rounded-lg bg-black/50 backdrop-blur border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Desktop preview"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); setPreviewTemplate(template); setPreviewMode('mobile'); }}
                      className="w-8 h-8 rounded-lg bg-black/50 backdrop-blur border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Mobile preview"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">{template.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{template.subject}</p>
                    </div>
                    <span className={`shrink-0 px-2 py-1 rounded-md text-[10px] font-semibold uppercase border ${meta.bg} ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    {varCount > 0 && (
                      <div className="flex items-center gap-1 text-[11px] text-purple-400">
                        <Tag className="w-3 h-3" />
                        {varCount} variable{varCount !== 1 ? 's' : ''}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-[11px] text-slate-600">
                      <Clock className="w-3 h-3" />
                      {new Date(template.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-3 border-t border-[rgba(255,255,255,0.04)]">
                    <button
                      onClick={() => setSendTestTemplate(template)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/12 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send Test
                    </button>
<button
                      onClick={() => handleEdit(template.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-[rgba(255,255,255,0.06)] text-slate-400 text-xs font-medium hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <div className="relative more-menu">
                      <button
                        onClick={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); setMoreOpenId(moreOpenId === template.id ? null : template.id); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.02] border border-[rgba(255,255,255,0.04)] text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                      <AnimatePresence>
                        {moreOpenId === template.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                            className="absolute right-0 bottom-10 w-44 bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl overflow-hidden z-50"
                            onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
                          >
<button onClick={() => { handleEdit(template.id); setMoreOpenId(null); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-slate-300 hover:bg-white/[0.04] transition-colors cursor-pointer">
                              <Edit3 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button onClick={() => { setPreviewTemplate(template); setMoreOpenId(null); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-slate-300 hover:bg-white/[0.04] transition-colors cursor-pointer">
                              <Eye className="w-3.5 h-3.5" /> Preview
                            </button>
                            <button onClick={() => { handleDuplicate(template.id); setMoreOpenId(null); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-slate-300 hover:bg-white/[0.04] transition-colors cursor-pointer">
                              <Copy className="w-3.5 h-3.5" /> Duplicate
                            </button>
                            <button onClick={() => { setRenameId(template.id); setRenameValue(template.name); setMoreOpenId(null); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-slate-300 hover:bg-white/[0.04] transition-colors cursor-pointer">
                              <FileText className="w-3.5 h-3.5" /> Rename
                            </button>
                            <div className="border-t border-[rgba(255,255,255,0.06)]" />
                            <button onClick={() => { setDeleteConfirm(template.id); setMoreOpenId(null); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-10">
                    <button onClick={() => sorted.length > 0 && (selectedTemplateIds.size === sorted.length ? setSelectedTemplateIds(new Set()) : setSelectedTemplateIds(new Set(sorted.map(t => t.id))))} className="cursor-pointer">
                      {selectedTemplateIds.size === sorted.length && sorted.length > 0 ? <Check className="w-4 h-4 text-[#06B6D4]" /> : <div className="w-4 h-4 rounded border border-[rgba(255,255,255,0.1)]" />}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Template</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Category</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Updated</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                {sorted.map((template) => {
                  const meta = CATEGORY_META[template.category] || { label: template.category, color: 'text-slate-300', bg: 'bg-slate-500/10' };
                  const isSelected = selectedTemplateIds.has(template.id);
                  return (
                    <tr key={template.id} className={`hover:bg-white/[0.02] transition-colors ${isSelected ? 'bg-[#06B6D4]/[0.03]' : ''}`}>
                      <td className="px-5 py-3">
                        <button onClick={() => toggleSelect(template.id)} className="cursor-pointer">
                          {isSelected ? <Check className="w-4 h-4 text-[#06B6D4]" /> : <div className="w-4 h-4 rounded border border-[rgba(255,255,255,0.1)]" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-white/[0.02] border border-[rgba(255,255,255,0.04)] flex items-center justify-center shrink-0">
                            <Mail className="w-4 h-4 text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{template.name}</p>
                            <p className="text-xs text-slate-500 truncate">{template.subject}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`inline-block px-2 py-1 rounded-md text-[10px] font-semibold uppercase border ${meta.bg} ${meta.color}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-slate-500">
                          {new Date(template.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
<button onClick={() => handleEdit(template.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-white transition-colors cursor-pointer" title="Edit">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setSendTestTemplate(template)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer" title="Send Test">
                            <Send className="w-4 h-4" />
                          </button>
                          <div className="relative more-menu">
                            <button onClick={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); setMoreOpenId(moreOpenId === template.id ? null : template.id); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-white transition-colors cursor-pointer">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            <AnimatePresence>
                              {moreOpenId === template.id && (
                                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                  className="absolute right-0 top-10 w-44 bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl overflow-hidden z-50"
                                  onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
                                >
<button onClick={() => { handleEdit(template.id); setMoreOpenId(null); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-slate-300 hover:bg-white/[0.04] transition-colors cursor-pointer"><Edit3 className="w-3.5 h-3.5" /> Edit</button>
                                  <button onClick={() => { setPreviewTemplate(template); setMoreOpenId(null); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-slate-300 hover:bg-white/[0.04] transition-colors cursor-pointer"><Eye className="w-3.5 h-3.5" /> Preview</button>
                                  <button onClick={() => { handleDuplicate(template.id); setMoreOpenId(null); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-slate-300 hover:bg-white/[0.04] transition-colors cursor-pointer"><Copy className="w-3.5 h-3.5" /> Duplicate</button>
                                  <button onClick={() => { setRenameId(template.id); setRenameValue(template.name); setMoreOpenId(null); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-slate-300 hover:bg-white/[0.04] transition-colors cursor-pointer"><FileText className="w-3.5 h-3.5" /> Rename</button>
                                  <div className="border-t border-[rgba(255,255,255,0.06)]" />
                                  <button onClick={() => { setDeleteConfirm(template.id); setMoreOpenId(null); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1a1e] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl max-w-sm w-full p-6"
              onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Delete Template?</h3>
                  <p className="text-sm text-slate-400">This action cannot be undone. The template will be permanently removed.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.08)] text-slate-400 text-sm font-medium hover:bg-white/[0.04] transition-colors cursor-pointer whitespace-nowrap">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors cursor-pointer whitespace-nowrap">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {renameId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setRenameId(null); setRenameValue(''); }}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1a1e] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl max-w-sm w-full p-6"
              onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-4">Rename Template</h3>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') { setRenameId(null); setRenameValue(''); } }}
                autoFocus
                className="w-full px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/30 transition-all mb-5"
                placeholder="Template name"
              />
              <div className="flex gap-3">
                <button onClick={() => { setRenameId(null); setRenameValue(''); }} className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.08)] text-slate-400 text-sm font-medium hover:bg-white/[0.04] transition-colors cursor-pointer whitespace-nowrap">Cancel</button>
                <button onClick={handleRename} disabled={!renameValue.trim()} className="flex-1 py-2.5 rounded-xl bg-[#06B6D4] text-white text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap">Rename</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewTemplate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-[5vh] overflow-y-auto"
            onClick={() => setPreviewTemplate(null)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#1a1a1e] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl w-full max-w-2xl my-4"
              onClick={(e: React.MouseEvent<HTMLElement>) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
                <div>
                  <h3 className="text-base font-bold text-white">{previewTemplate.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Subject: {previewTemplate.subject}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg overflow-hidden">
                    <button
                      onClick={() => setPreviewMode('desktop')}
                      className={`w-8 h-8 flex items-center justify-center transition-colors cursor-pointer ${previewMode === 'desktop' ? 'bg-white/[0.06] text-white' : 'text-slate-500 hover:text-white'}`}
                    >
                      <Monitor className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPreviewMode('mobile')}
                      className={`w-8 h-8 flex items-center justify-center transition-colors cursor-pointer ${previewMode === 'mobile' ? 'bg-white/[0.06] text-white' : 'text-slate-500 hover:text-white'}`}
                    >
                      <Smartphone className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => { handleEdit(previewTemplate.id); setPreviewTemplate(null); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#06B6D4]/10 text-[#06B6D4] text-xs font-medium hover:bg-[#06B6D4]/20 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => setPreviewTemplate(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.04] text-slate-400 transition-colors cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className={`p-6 flex justify-center ${previewMode === 'mobile' ? '' : ''}`}>
                <div
                  className="bg-white rounded-xl border border-[rgba(0,0,0,0.1)] overflow-hidden shadow-lg"
                  style={{ width: previewMode === 'mobile' ? '375px' : '100%', maxHeight: '70vh' }}
                >
                  <div className="bg-slate-100 px-4 py-2 border-b text-xs text-slate-600">
                    Subject: {previewTemplate.subject}
                  </div>
                  <div className="overflow-auto" style={{ maxHeight: 'calc(70vh - 36px)' }}>
                    <iframe
                      srcDoc={renderPreview(previewTemplate)}
                      className="w-full border-0"
                      style={{ height: previewMode === 'mobile' ? '600px' : '500px' }}
                      title="Email Preview"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {formOpen && (
        <EmailTemplateForm
          template={editingTemplate}
          onClose={() => { setFormOpen(false); setEditingTemplate(null); }}
          onSaved={() => {
            setFormOpen(false);
            setEditingTemplate(null);
            fetchTemplates();
            setStatusMsg({ type: 'success', text: editingTemplate ? 'Template updated' : 'Template created' });
            setTimeout(() => setStatusMsg(null), 3000);
          }}
        />
      )}

      {sendTestTemplate && (
        <SendTestModal
          template={sendTestTemplate}
          onClose={() => setSendTestTemplate(null)}
          onSent={() => {
            setSendTestTemplate(null);
            setStatusMsg({ type: 'success', text: 'Test email sent' });
            setTimeout(() => setStatusMsg(null), 3000);
          }}
        />
      )}
    </div>
  );
}
