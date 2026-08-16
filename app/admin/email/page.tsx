'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  Mail, FileText, Clock, Send, TrendingUp, AlertTriangle,
  Plus, ArrowRight, Upload, Palette, FileEdit, Eye, Play,
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

const METRIC_CARDS = [
  { key: 'total', icon: Mail, label: 'Total Templates', color: 'text-[#06B6D4]', bg: 'bg-[#06B6D4]/10', border: 'border-[#06B6D4]/20' },
  { key: 'draft', icon: FileEdit, label: 'Draft Templates', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  { key: 'active', icon: Play, label: 'Active Templates', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  { key: 'sent', icon: Send, label: 'Emails Sent This Month', color: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/20' },
  { key: 'delivery', icon: TrendingUp, label: 'Delivery Rate', color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/20' },
  { key: 'review', icon: AlertTriangle, label: 'Needing Review', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
];

const CATEGORY_META: Record<string, { label: string; color: string; bg: string }> = {
  general: { label: 'General', color: 'text-slate-300', bg: 'bg-slate-500/10 border-slate-500/20' },
  welcome: { label: 'Welcome', color: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  invoice: { label: 'Invoice', color: 'text-amber-300', bg: 'bg-amber-500/10 border-amber-500/20' },
  project: { label: 'Project', color: 'text-sky-300', bg: 'bg-sky-500/10 border-sky-500/20' },
  lead: { label: 'Lead', color: 'text-violet-300', bg: 'bg-violet-500/10 border-violet-500/20' },
  notification: { label: 'Notification', color: 'text-rose-300', bg: 'bg-rose-500/10 border-rose-500/20' },
};

const QUICK_ACTIONS = [
  { icon: Plus, label: 'Create Template', href: '/admin/email/templates', color: 'bg-[#06B6D4] text-white hover:bg-[#0891B2]' },
  { icon: Upload, label: 'Import HTML', disabled: true, color: 'bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-400' },
  { icon: Palette, label: 'Brand Kits', disabled: true, color: 'bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-400' },
  { icon: FileEdit, label: 'View Drafts', disabled: true, color: 'bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-400' },
  { icon: Eye, label: 'Review Templates', disabled: true, color: 'bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-400' },
];

export default function EmailDashboardPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      const { data: profile } = userId ? await supabase.from('admin_profiles').select('organisation_id').eq('id', userId).maybeSingle() : { data: null };
      let query = supabase.from('email_templates').select('*').order('updated_at', { ascending: false });
      if (profile?.organisation_id) query = query.or(`organisation_id.eq.${profile.organisation_id},organisation_id.is.null`);
      const { data } = await query;
      if (data) setTemplates(data as EmailTemplate[]);
      setLoading(false);
    };
    fetchTemplates();
  }, []);

  const draftCount = templates.filter((t) => {
    const hours = (Date.now() - new Date(t.updated_at).getTime()) / (1000 * 60 * 60);
    return hours > 72;
  }).length;

  const totalCount = templates.length;
  const recentTemplates = templates.slice(0, 6);
  const categoryCounts: Record<string, number> = {};
  templates.forEach((t) => {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  });

  const metricValues: Record<string, { value: string | number; subtitle: string }> = {
    total: { value: totalCount, subtitle: `${Object.keys(categoryCounts).length} categories` },
    draft: { value: draftCount, subtitle: draftCount > 0 ? 'Not edited in 72h+' : 'All up to date' },
    active: { value: templates.filter((t) => ['welcome', 'notification', 'invoice'].includes(t.category)).length, subtitle: 'Production templates' },
    sent: { value: '—', subtitle: 'Not available' },
    delivery: { value: '—', subtitle: 'Not available' },
    review: { value: draftCount, subtitle: draftCount > 0 ? 'Needs attention' : 'Nothing pending' },
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-white/[0.04] rounded-lg w-48" />
        <div className="h-4 bg-white/[0.04] rounded-lg w-96" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Email Studio</h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-xl">
            Create, manage and monitor email templates and communications across Digital Footprint products.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin/email/templates"
            className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl font-semibold text-sm hover:bg-white/[0.08] hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer whitespace-nowrap"
          >
            View Templates
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/admin/email/templates"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl font-semibold text-sm hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-[#06B6D4]/10"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {METRIC_CARDS.map((card) => {
          const val = metricValues[card.key];
          const Icon = card.icon;
          return (
            <div key={card.key} className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 hover:border-[rgba(255,255,255,0.1)] transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{card.label}</span>
                <div className={`w-8 h-8 rounded-lg ${card.bg} ${card.border} border flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{val.value}</p>
              <p className="text-[11px] text-slate-500 mt-1">{val.subtitle}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <div>
                <h2 className="text-base font-bold text-white">Recent Templates</h2>
                <p className="text-xs text-slate-500 mt-0.5">Recently edited email templates</p>
              </div>
              <Link href="/admin/email/templates" className="text-xs text-[#06B6D4] hover:underline cursor-pointer flex items-center gap-1 whitespace-nowrap">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-4">
              {recentTemplates.length === 0 ? (
                <div className="text-center py-10">
                  <Mail className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No templates yet</p>
                  <p className="text-xs text-slate-500 mt-1">Create your first email template</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recentTemplates.map((t) => {
                    const meta = CATEGORY_META[t.category] || { label: t.category, color: 'text-slate-300', bg: 'bg-slate-500/10 border-slate-500/20' };
                    return (
                      <Link
                        key={t.id}
                        href="/admin/email/templates"
                        className="flex items-start gap-3 p-3 rounded-xl border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)] bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer group"
                      >
                        <div className="w-12 h-16 rounded-lg bg-white/[0.04] border border-[rgba(255,255,255,0.04)] flex items-center justify-center shrink-0 overflow-hidden">
                          <div className="w-full h-full overflow-hidden opacity-30 scale-[0.25] origin-top-left">
                            <div className="w-[400%] p-2 text-[6px] leading-none text-slate-400 font-sans" dangerouslySetInnerHTML={{ __html: t.html_content.slice(0, 200) }} />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white truncate group-hover:text-[#06B6D4] transition-colors">{t.name}</p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{t.subject}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${meta.bg} ${meta.color}`}>
                              {meta.label}
                            </span>
                            <span className="text-[10px] text-slate-600 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {new Date(t.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <h2 className="text-base font-bold text-white">Templates Requiring Attention</h2>
              <p className="text-xs text-slate-500 mt-0.5">Templates that may need review or action</p>
            </div>
            <div className="p-4">
              {draftCount === 0 ? (
                <div className="text-center py-8">
                  <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-sm text-slate-300">All clear</p>
                  <p className="text-xs text-slate-500 mt-1">No templates require immediate attention</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.filter((t) => {
                    const hours = (Date.now() - new Date(t.updated_at).getTime()) / (1000 * 60 * 60);
                    return hours > 72;
                  }).slice(0, 5).map((t) => (
                    <Link
                      key={t.id}
                      href="/admin/email/templates"
                      className="flex items-center justify-between p-3 rounded-xl bg-amber-400/[0.03] border border-amber-400/[0.08] hover:border-amber-400/[0.2] transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-white truncate">{t.name}</p>
                          <p className="text-[11px] text-slate-500">Last edited {Math.round((Date.now() - new Date(t.updated_at).getTime()) / (1000 * 60 * 60 * 24))} days ago</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-amber-400 font-medium uppercase shrink-0">Draft</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <h2 className="text-base font-bold text-white">Quick Actions</h2>
            </div>
            <div className="p-4 space-y-2">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                if (action.disabled) {
                  return (
                    <button
                      key={action.label}
                      disabled
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium cursor-not-allowed opacity-50 whitespace-nowrap ${action.color}`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {action.label}
                    </button>
                  );
                }
                return (
                  <Link
                    key={action.label}
                    href={action.href || '#'}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${action.color}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {action.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <h2 className="text-base font-bold text-white">Category Breakdown</h2>
            </div>
            <div className="p-4 space-y-3">
              {Object.entries(categoryCounts).length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No templates yet</p>
              ) : (
                Object.entries(categoryCounts).map(([cat, count]) => {
                  const meta = CATEGORY_META[cat] || { label: cat, color: 'text-slate-300', bg: 'bg-slate-500/10' };
                  return (
                    <div key={cat} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${cat === 'welcome' ? 'bg-emerald-400' : cat === 'invoice' ? 'bg-amber-400' : cat === 'project' ? 'bg-sky-400' : cat === 'lead' ? 'bg-violet-400' : cat === 'notification' ? 'bg-rose-400' : 'bg-slate-400'}`} />
                        <span className="text-sm text-slate-300">{meta.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-white">{count}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <h2 className="text-base font-bold text-white">Recent Activity</h2>
            </div>
            <div className="p-4">
              <div className="text-center py-6">
                <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No recent activity</p>
                <p className="text-xs text-slate-500 mt-1">Activity tracking will appear here once enabled</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}