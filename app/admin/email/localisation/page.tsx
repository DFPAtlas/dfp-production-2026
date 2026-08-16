'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Globe, Search, Filter, ArrowRight, AlertTriangle, CheckCircle2, Clock,
  FileText, Megaphone, Workflow, Repeat, ExternalLink, RefreshCw,
  ShieldCheck, Ban, Info, ChevronRight, Eye,
} from 'lucide-react';

interface LocOverview {
  code: string;
  locale: string;
  label: string;
  rtl: boolean;
  templateCount: number;
  approvedTemplateCount: number;
  campaignCount: number;
  approvedCampaignCount: number;
  automationCount: number;
  approvedAutomationCount: number;
  transactionalCount: number;
  approvedTransactionalCount: number;
  missingLegalContent: string[];
  lastUpdated: string | null;
}

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

const STATUS_LABELS: Record<string, string> = {
  'draft': 'Draft', 'machine_translated': 'Machine Translated', 'needs_review': 'Needs Review',
  'changes_requested': 'Changes Requested', 'approved': 'Approved', 'active': 'Active',
  'outdated': 'Outdated', 'blocked': 'Blocked', 'archived': 'Archived',
};

const LANG_LABELS: Record<string, string> = {
  'en': 'English', 'fr': 'French', 'de': 'German', 'es': 'Spanish', 'it': 'Italian',
  'pt': 'Portuguese', 'nl': 'Dutch', 'pl': 'Polish', 'ar': 'Arabic', 'he': 'Hebrew',
  'ja': 'Japanese', 'zh': 'Chinese', 'ko': 'Korean', 'sv': 'Swedish', 'da': 'Danish',
  'no': 'Norwegian', 'fi': 'Finnish', 'tr': 'Turkish', 'ru': 'Russian', 'uk': 'Ukrainian',
  'hi': 'Hindi', 'th': 'Thai', 'vi': 'Vietnamese',
};

export default function LocalisationDashboard() {
  const [overview, setOverview] = useState<LocOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [enabledLanguages, setEnabledLanguages] = useState<string[]>(['en']);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: settings } = await supabase.from('email_studio_settings').select('language_config').maybeSingle();
    if (settings?.language_config && typeof settings.language_config === 'object') {
      const cfg = settings.language_config as Record<string, unknown>;
      const src = (cfg.sourceLanguage as string) || 'en';
      const langs = (cfg.enabledLanguages as { code: string; locale: string; label: string; rtl: boolean }[]) || [{ code: 'en', locale: 'en-GB', label: 'English', rtl: false }];
      setSourceLanguage(src);
      setEnabledLanguages(langs.map(l => l.code));

      const locOverview: LocOverview[] = langs.map(l => ({
        code: l.code, locale: l.locale, label: l.label, rtl: l.rtl,
        templateCount: 0, approvedTemplateCount: 0,
        campaignCount: 0, approvedCampaignCount: 0,
        automationCount: 0, approvedAutomationCount: 0,
        transactionalCount: 0, approvedTransactionalCount: 0,
        missingLegalContent: [],
        lastUpdated: null,
      }));

      const { data: variants } = await supabase.from('email_translation_variants').select('*').in('language', langs.map(l => l.code));
      if (variants) {
        for (const v of variants) {
          const idx = locOverview.findIndex(lo => lo.code === v.language);
          if (idx < 0) continue;
          const isApproved = v.status === 'approved' || v.status === 'active';
          switch (v.source_type) {
            case 'template': locOverview[idx].templateCount++; if (isApproved) locOverview[idx].approvedTemplateCount++; break;
            case 'campaign': locOverview[idx].campaignCount++; if (isApproved) locOverview[idx].approvedCampaignCount++; break;
            case 'automation': locOverview[idx].automationCount++; if (isApproved) locOverview[idx].approvedAutomationCount++; break;
            case 'transactional': locOverview[idx].transactionalCount++; if (isApproved) locOverview[idx].approvedTransactionalCount++; break;
          }
        }
      }
      setOverview(locOverview);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
      </div>
    );
  }

  const filtered = overview.filter(loc => {
    if (search) {
      const q = search.toLowerCase();
      if (!loc.label.toLowerCase().includes(q) && !loc.code.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalVariants = filtered.reduce((a, l) => a + l.templateCount + l.campaignCount + l.automationCount + l.transactionalCount, 0);
  const totalApproved = filtered.reduce((a, l) => a + l.approvedTemplateCount + l.approvedCampaignCount + l.approvedAutomationCount + l.approvedTransactionalCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
            <Globe className="w-4 h-4 text-[#06B6D4]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Localisation Dashboard</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Translation coverage across {enabledLanguages.length} language{enabledLanguages.length !== 1 ? 's' : ''}. Source: {LANG_LABELS[sourceLanguage] || sourceLanguage}.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/email/settings/languages"
            className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-xs font-medium hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Language Settings
          </Link>
          <Link href="/admin/email/localisation/review"
            className="flex items-center gap-1.5 px-3 py-2 bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] rounded-xl text-xs font-medium hover:bg-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Eye className="w-3.5 h-3.5" /> Review Queue
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total Languages</p>
          <p className="text-2xl font-bold text-white">{enabledLanguages.length}</p>
        </div>
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Translation Variants</p>
          <p className="text-2xl font-bold text-white">{totalVariants}</p>
        </div>
        <div className="bg-[#121215] border border-emerald-500/10 rounded-2xl p-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Approved</p>
          <p className="text-2xl font-bold text-emerald-400">{totalApproved}</p>
        </div>
        <div className="bg-[#121215] border border-amber-500/10 rounded-2xl p-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Needs Attention</p>
          <p className="text-2xl font-bold text-amber-400">{totalVariants - totalApproved}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search languages..."
            className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
          />
        </div>
        <button onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] text-slate-400 rounded-xl text-sm hover:text-white transition-all cursor-pointer whitespace-nowrap"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-12 text-center">
          <Globe className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">No languages configured</h2>
          <p className="text-sm text-slate-400 mb-4">Enable languages in Language Settings to begin localising content.</p>
          <Link href="/admin/email/settings/languages"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
          >
            Configure Languages <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(loc => {
            const allCount = loc.templateCount + loc.campaignCount + loc.automationCount + loc.transactionalCount;
            const approvedCount = loc.approvedTemplateCount + loc.approvedCampaignCount + loc.approvedAutomationCount + loc.approvedTransactionalCount;
            const pct = allCount > 0 ? Math.round(approvedCount / allCount * 100) : (loc.code === sourceLanguage ? 100 : 0);
            const readiness = loc.code === sourceLanguage ? 'source' :
              approvedCount === allCount && allCount > 0 ? 'ready' :
              approvedCount > 0 ? 'partial' : 'none';

            return (
              <div key={loc.code} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)] rounded-2xl p-5 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      readiness === 'source' ? 'bg-emerald-500/10 text-emerald-400' :
                      readiness === 'ready' ? 'bg-[#06B6D4]/10 text-[#06B6D4]' :
                      readiness === 'partial' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-slate-500/10 text-slate-500'
                    }`}>
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-white">{loc.label}</h3>
                        <span className="text-[10px] text-slate-500 font-mono">{loc.locale}</span>
                        {loc.rtl && <span className="px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-400 text-[10px] font-bold">RTL</span>}
                        {loc.code === sourceLanguage && <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">Source</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className={`px-1.5 py-0.5 rounded-md border text-[10px] font-semibold ${
                          readiness === 'source' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          readiness === 'ready' ? 'bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/20' :
                          readiness === 'partial' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-slate-500/10 text-slate-500 border-slate-500/20'
                        }`}>
                          {readiness === 'source' ? 'Source Language' : readiness === 'ready' ? 'Fully Approved' : readiness === 'partial' ? 'Partial Coverage' : 'No Translations'}
                        </span>
                        <span className="text-slate-500">{approvedCount}/{allCount} approved</span>
                        {allCount > 0 && (
                          <div className="w-20 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-400' : pct > 50 ? 'bg-amber-400' : pct > 0 ? 'bg-red-400' : 'bg-slate-600'}`} style={{ width: `${pct}%` }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="p-3 bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[10px] text-slate-500 uppercase">Templates</span>
                    </div>
                    <p className="text-xl font-bold text-white">{loc.approvedTemplateCount}<span className="text-sm text-slate-500">/{loc.templateCount}</span></p>
                  </div>
                  <div className="p-3 bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Megaphone className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[10px] text-slate-500 uppercase">Campaigns</span>
                    </div>
                    <p className="text-xl font-bold text-white">{loc.approvedCampaignCount}<span className="text-sm text-slate-500">/{loc.campaignCount}</span></p>
                  </div>
                  <div className="p-3 bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Workflow className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[10px] text-slate-500 uppercase">Automations</span>
                    </div>
                    <p className="text-xl font-bold text-white">{loc.approvedAutomationCount}<span className="text-sm text-slate-500">/{loc.automationCount}</span></p>
                  </div>
                  <div className="p-3 bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Repeat className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-[10px] text-slate-500 uppercase">Transactional</span>
                    </div>
                    <p className="text-xl font-bold text-white">{loc.approvedTransactionalCount}<span className="text-sm text-slate-500">/{loc.transactionalCount}</span></p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}