'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminProfile } from '@/hooks/useAdminProfile';
import {
  MessageSquare, Send, CheckCircle2, AlertTriangle, Star,
  Search, Filter, ChevronDown, X, RefreshCw, Paperclip,
} from 'lucide-react';

interface FeedbackEntry {
  id: string;
  module: string;
  type: string;
  severity: string;
  description: string;
  reproduction: string;
  evidence: string;
  status: string;
  created_at: string;
  created_by_email: string;
  organisation_id: string;
}

const MODULES = ['templates', 'campaigns', 'automations', 'transactional', 'contacts', 'audiences', 'imports', 'consent', 'preferences', 'brand-kits', 'sections', 'analytics', 'suppressions', 'reports', 'settings'];
const TYPES = ['bug', 'usability', 'performance', 'feature_request', 'documentation', 'other'];
const SEVERITIES = ['critical', 'major', 'minor', 'cosmetic'];

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  major: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  minor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  cosmetic: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
};

export default function PilotFeedbackPage() {
  const { profile, sessionUser } = useAdminProfile();
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [filterModule, setFilterModule] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [form, setForm] = useState({
    module: '',
    type: 'bug',
    severity: 'minor',
    description: '',
    reproduction: '',
    evidence: '',
  });

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    setLoading(true);
    const { data } = await supabase.from('uat_feedback').select('*').order('created_at', { ascending: false }).limit(50);
    setEntries((data || []) as FeedbackEntry[]);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.description.trim()) return;
    setSubmitting(true);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    await supabase.from('uat_feedback').insert({
      organisation_id: profile?.organisation_id || null,
      module: form.module || 'general',
      type: form.type,
      severity: form.severity,
      description: form.description,
      reproduction: form.reproduction,
      evidence: form.evidence,
      status: 'new',
      created_by: userId,
      created_by_email: sessionUser?.email || 'unknown',
    });

    setSubmitting(false);
    setSubmitted(true);
    setForm({ module: '', type: 'bug', severity: 'minor', description: '', reproduction: '', evidence: '' });
    setTimeout(() => { setSubmitted(false); setShowForm(false); loadFeedback(); }, 2000);
  };

  const filteredEntries = entries.filter(e => {
    if (filterModule !== 'all' && e.module !== filterModule) return false;
    if (filterType !== 'all' && e.type !== filterType) return false;
    if (searchQuery && !e.description?.toLowerCase().includes(searchQuery.toLowerCase()) && !e.reproduction?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-white/[0.04] rounded-lg" />
        <div className="h-96 bg-[#121215] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-[#06B6D4]" />
            </div>
            <h1 className="text-xl font-bold text-white">Pilot Feedback</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1 ml-11">
            Report bugs, share usability feedback, or suggest improvements during the pilot.
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap"
        >
          <MessageSquare className="w-4 h-4" /> Submit Feedback
        </button>
      </div>

      {/* Guidance Banner */}
      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-3">Pilot Guidance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400">
          <div>
            <h3 className="font-medium text-slate-300 mb-1">What&apos;s included</h3>
            <ul className="space-y-0.5">
              <li>• Template editing and preview</li>
              <li>• Campaign creation (10-recipient limit)</li>
              <li>• Test sends to authorised recipients</li>
              <li>• Contact management and imports</li>
              <li>• Analytics and reporting</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-slate-300 mb-1">Pre-send checklist</h3>
            <ul className="space-y-0.5">
              <li>• Verify recipient list is internal/staff</li>
              <li>• Check sender domain is verified</li>
              <li>• Review subject and preview text</li>
              <li>• Run validation before sending</li>
              <li>• Send test to yourself first</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-slate-300 mb-1">Emergency</h3>
            <ul className="space-y-0.5">
              <li>• Kill switch on Pilot Control page</li>
              <li>• Report SEV-1 incidents immediately</li>
              <li>• Do NOT send to external recipients without approval</li>
              <li>• All sends are capped at 10 per campaign</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Submit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[#1a1a1e] border border-[rgba(255,255,255,0.1)] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Submit Feedback</h2>
              <button onClick={() => setShowForm(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.04] cursor-pointer"
              ><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Module</label>
                  <select value={form.module} onChange={e => setForm(prev => ({ ...prev, module: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8"
                  >
                    <option value="">General</option>
                    {MODULES.map(m => (
                      <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8"
                  >
                    {TYPES.map(t => (
                      <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Severity</label>
                <div className="flex gap-2">
                  {SEVERITIES.map(s => (
                    <button key={s} onClick={() => setForm(prev => ({ ...prev, severity: s }))}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all cursor-pointer whitespace-nowrap ${form.severity === s ? SEVERITY_COLORS[s] : 'bg-white/[0.02] border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-white'}`}
                    >{s.charAt(0).toUpperCase() + s.slice(1)}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Description *</label>
                <textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3} maxLength={500}
                  placeholder="What happened? What did you expect?"
                  className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 resize-y"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Reproduction Steps</label>
                <textarea value={form.reproduction} onChange={e => setForm(prev => ({ ...prev, reproduction: e.target.value }))}
                  rows={2} maxLength={500}
                  placeholder="Steps to reproduce the issue..."
                  className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 resize-y"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Evidence / Screenshot Link</label>
                <input type="text" value={form.evidence} onChange={e => setForm(prev => ({ ...prev, evidence: e.target.value }))}
                  placeholder="URL to screenshot or additional evidence"
                  className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
                />
              </div>
            </div>
            <div className="p-4 border-t border-[rgba(255,255,255,0.06)] flex gap-3">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.08)] text-slate-400 text-sm font-medium hover:bg-white/[0.04] transition-all cursor-pointer whitespace-nowrap"
              >Cancel</button>
              <button onClick={handleSubmit} disabled={submitting || !form.description.trim()}
                className="flex-1 py-2.5 rounded-xl bg-[#06B6D4] text-white text-sm font-semibold hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                {submitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin inline mr-1" />
                ) : submitted ? (
                  <CheckCircle2 className="w-4 h-4 inline mr-1" />
                ) : (
                  <Send className="w-4 h-4 inline mr-1" />
                )}
                {submitted ? 'Submitted!' : submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback List */}
      <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[rgba(255,255,255,0.06)] flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search feedback..."
              className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
            />
          </div>
          <select value={filterModule} onChange={e => setFilterModule(e.target.value)}
            className="px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8"
          >
            <option value="all">All Modules</option>
            {MODULES.map(m => (<option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>))}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8"
          >
            <option value="all">All Types</option>
            {TYPES.map(t => (<option key={t} value={t}>{t.replace('_', ' ')}</option>))}
          </select>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="py-16 text-center">
            <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No feedback yet</p>
            <p className="text-xs text-slate-600 mt-1">Be the first to submit pilot feedback</p>
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-[rgba(255,255,255,0.03)]">
            {filteredEntries.map(entry => (
              <div key={entry.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${SEVERITY_COLORS[entry.severity] || 'text-slate-400 bg-slate-500/10 border-slate-500/20'}`}>{entry.severity}</span>
                      <span className="text-[10px] text-slate-500 capitalize">{entry.type.replace('_', ' ')}</span>
                      <span className="text-[10px] text-slate-600">{entry.module || 'general'}</span>
                      {entry.status !== 'new' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{entry.status}</span>
                      )}
                    </div>
                    <p className="text-sm text-white">{entry.description}</p>
                    {entry.reproduction && (
                      <p className="text-xs text-slate-500 mt-1">Reproduction: {entry.reproduction}</p>
                    )}
                    <p className="text-[10px] text-slate-600 mt-2">
                      {new Date(entry.created_at).toLocaleString()} by {entry.created_by_email || 'unknown'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}