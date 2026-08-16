'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Eye, ArrowLeft, Search, Filter, Check, X, AlertTriangle, MessageSquare,
  FileText, Megaphone, Workflow, Repeat, Clock, ChevronDown, ChevronRight,
  ExternalLink, RefreshCw, Globe, ShieldCheck, CheckCircle2,
} from 'lucide-react';

interface TranslationVariant {
  id: string;
  source_type: string;
  source_id: string;
  language: string;
  locale: string;
  status: string;
  legal_content_status: string;
  subject: string;
  translator_id: string | null;
  reviewer_id: string | null;
  source_revision_hash: string;
  created_at: string;
  updated_at: string;
  source_name?: string;
}

const STATUS_LABELS: Record<string, string> = {
  'draft': 'Draft', 'machine_translated': 'Machine Translated', 'needs_review': 'Needs Review',
  'changes_requested': 'Changes Requested', 'approved': 'Approved', 'active': 'Active',
  'outdated': 'Outdated', 'blocked': 'Blocked', 'archived': 'Archived',
};

const STATUS_COLORS: Record<string, string> = {
  'draft': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  'machine_translated': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'needs_review': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'changes_requested': 'bg-red-500/10 text-red-400 border-red-500/20',
  'approved': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'active': 'bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/20',
  'outdated': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'blocked': 'bg-red-500/10 text-red-400 border-red-500/20',
  'archived': 'bg-slate-500/5 text-slate-600 border-slate-500/10',
};

const SOURCE_ICONS: Record<string, React.ElementType> = {
  'template': FileText, 'campaign': Megaphone, 'automation': Workflow, 'transactional': Repeat,
};

const SOURCE_LABELS: Record<string, string> = {
  'template': 'Template', 'campaign': 'Campaign', 'automation': 'Automation', 'transactional': 'Transactional',
};

const LANG_LABELS: Record<string, string> = {
  'en': 'English', 'fr': 'French', 'de': 'German', 'es': 'Spanish', 'it': 'Italian',
  'pt': 'Portuguese', 'nl': 'Dutch', 'pl': 'Polish', 'ar': 'Arabic', 'he': 'Hebrew',
  'ja': 'Japanese', 'zh': 'Chinese', 'ko': 'Korean',
};

export default function TranslationReviewPage() {
  const [variants, setVariants] = useState<TranslationVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('needs_review');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    loadVariants();
  }, []);

  const loadVariants = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('email_translation_variants').select('*').order('updated_at', { ascending: false });
    if (data) {
      const enriched: TranslationVariant[] = [];
      for (const v of data) {
        let sourceName = '';
        if (v.source_type === 'template') {
          const { data: t } = await supabase.from('email_templates').select('name').eq('id', v.source_id).maybeSingle();
          sourceName = (t as { name?: string })?.name || '';
        } else if (v.source_type === 'campaign') {
          const { data: c } = await supabase.from('email_campaigns').select('name').eq('id', v.source_id).maybeSingle();
          sourceName = (c as { name?: string })?.name || '';
        }
        enriched.push({ ...v, source_name: sourceName });
      }
      setVariants(enriched);
    }
    setLoading(false);
  };

  const updateStatus = async (variantId: string, newStatus: string) => {
    setUpdating(prev => ({ ...prev, [variantId]: true }));
    await supabase.from('email_translation_variants').update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    }).eq('id', variantId);
    setVariants(prev => prev.map(v => v.id === variantId ? { ...v, status: newStatus } : v));
    setUpdating(prev => ({ ...prev, [variantId]: false }));
  };

  const filtered = variants.filter(v => {
    if (statusFilter !== 'all' && v.status !== statusFilter) return false;
    if (sourceFilter !== 'all' && v.source_type !== sourceFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (v.subject || '').toLowerCase().includes(q) || (v.source_name || '').toLowerCase().includes(q) || v.language.toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/email/localisation" className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Translation Review Queue</h1>
            <p className="text-sm text-slate-400 mt-0.5">Review, approve or request changes for translated content across templates, campaigns, automations and transactional emails.</p>
          </div>
        </div>
        <button onClick={loadVariants}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] text-slate-400 rounded-xl text-sm hover:text-white transition-all cursor-pointer whitespace-nowrap"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by subject, name or language..."
            className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="pl-3 pr-8 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none"
        >
          <option value="all">All Statuses</option>
          <option value="needs_review">Needs Review</option>
          <option value="draft">Draft</option>
          <option value="machine_translated">Machine Translated</option>
          <option value="changes_requested">Changes Requested</option>
          <option value="approved">Approved</option>
          <option value="active">Active</option>
          <option value="outdated">Outdated</option>
          <option value="blocked">Blocked</option>
        </select>
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
          className="pl-3 pr-8 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none"
        >
          <option value="all">All Sources</option>
          <option value="template">Templates</option>
          <option value="campaign">Campaigns</option>
          <option value="automation">Automations</option>
          <option value="transactional">Transactional</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Review queue is clear</h2>
          <p className="text-sm text-slate-400">No translations currently need review. Create translations from templates or campaigns to populate the queue.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(v => {
            const SrcIcon = SOURCE_ICONS[v.source_type] || FileText;
            const isExpanded = expandedId === v.id;
            return (
              <div key={v.id} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
                <button onClick={() => setExpandedId(isExpanded ? null : v.id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-all cursor-pointer text-left"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    v.source_type === 'template' ? 'bg-[#06B6D4]/10 text-[#06B6D4]' :
                    v.source_type === 'campaign' ? 'bg-violet-500/10 text-violet-400' :
                    v.source_type === 'automation' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    <SrcIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white truncate">{v.subject || v.source_name || 'Untitled'}</span>
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold border bg-blue-500/10 text-blue-400 border-blue-500/20">{LANG_LABELS[v.language] || v.language}{v.locale ? ` (${v.locale})` : ''}</span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold border ${STATUS_COLORS[v.status]}`}>{STATUS_LABELS[v.status]}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-500 capitalize">{SOURCE_LABELS[v.source_type]}</span>
                      {v.source_name && <span className="text-[10px] text-slate-600">- {v.source_name}</span>}
                      <span className="text-[10px] text-slate-600">Updated {new Date(v.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {v.status === 'needs_review' || v.status === 'machine_translated' ? (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); updateStatus(v.id, 'approved'); }}
                          disabled={updating[v.id]}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[11px] font-medium hover:bg-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
                        >
                          <Check className="w-3 h-3" /> Approve
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); updateStatus(v.id, 'changes_requested'); }}
                          disabled={updating[v.id]}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-[11px] font-medium hover:bg-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
                        >
                          <X className="w-3 h-3" /> Request Changes
                        </button>
                      </>
                    ) : v.status === 'changes_requested' ? (
                      <button onClick={(e) => { e.stopPropagation(); updateStatus(v.id, 'needs_review'); }}
                        disabled={updating[v.id]}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] rounded-lg text-[11px] font-medium hover:bg-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
                      >
                        <RefreshCw className="w-3 h-3" /> Re-review
                      </button>
                    ) : v.status === 'approved' ? (
                      <button onClick={(e) => { e.stopPropagation(); updateStatus(v.id, 'active'); }}
                        disabled={updating[v.id]}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] rounded-lg text-[11px] font-medium hover:bg-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
                      >
                        <ShieldCheck className="w-3 h-3" /> Activate
                      </button>
                    ) : null}
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-[rgba(255,255,255,0.04)] pt-4 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase mb-0.5">Source Type</p>
                        <p className="text-xs text-white capitalize">{SOURCE_LABELS[v.source_type]}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase mb-0.5">Language</p>
                        <p className="text-xs text-white">{LANG_LABELS[v.language] || v.language} ({v.locale || 'N/A'})</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase mb-0.5">Legal Content</p>
                        <p className={`text-xs font-medium ${v.legal_content_status === 'approved' ? 'text-emerald-400' : v.legal_content_status === 'missing' ? 'text-red-400' : 'text-amber-400'}`}>
                          {v.legal_content_status.charAt(0).toUpperCase() + v.legal_content_status.slice(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase mb-0.5">Created</p>
                        <p className="text-xs text-white">{new Date(v.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {v.subject && (
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase mb-1">Subject Line</p>
                        <p className="text-sm text-white bg-white/[0.03] border border-[rgba(255,255,255,0.06)] rounded-lg p-3">{v.subject}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button onClick={() => setNotes(prev => ({ ...prev, [v.id]: prev[v.id] || '' }))}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] text-slate-400 rounded-lg text-xs hover:text-white transition-all cursor-pointer whitespace-nowrap"
                      >
                        <MessageSquare className="w-3 h-3" /> Add Review Note
                      </button>
                      {v.source_type === 'template' && (
                        <Link href={`/admin/email/templates/${v.source_id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] text-slate-400 rounded-lg text-xs hover:text-white transition-all cursor-pointer whitespace-nowrap"
                        >
                          <ExternalLink className="w-3 h-3" /> View Source Template
                        </Link>
                      )}
                      {v.source_type === 'campaign' && (
                        <Link href={`/admin/email/campaigns/${v.source_id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] text-slate-400 rounded-lg text-xs hover:text-white transition-all cursor-pointer whitespace-nowrap"
                        >
                          <ExternalLink className="w-3 h-3" /> View Campaign
                        </Link>
                      )}
                    </div>

                    {notes[v.id] !== undefined && (
                      <div>
                        <textarea value={notes[v.id] || ''} onChange={e => setNotes(prev => ({ ...prev, [v.id]: e.target.value }))}
                          placeholder="Add your review note..."
                          rows={2} maxLength={500}
                          className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 resize-y"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

