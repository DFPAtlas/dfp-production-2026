'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Search, RefreshCw, Ban, Trash2, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { SuppressionRecord, SUPPRESSION_REASON_LABELS, SuppressionReason } from '@/components/admin/email/analytics/analytics-types';

export default function SuppressionsPage() {
  const [records, setRecords] = useState<SuppressionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [scopeFilter, setScopeFilter] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newReason, setNewReason] = useState<SuppressionReason>('manual_block');
  const [newScope, setNewScope] = useState<string>('global');
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('email_suppressions').select('*').order('created_at', { ascending: false });
    if (data) setRecords(data as SuppressionRecord[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async () => {
    if (!newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    setAddLoading(true);
    setError('');

    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(newEmail.trim().toLowerCase()));
    const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    const local = newEmail.trim().split('@')[0];
    const domain = newEmail.trim().split('@')[1] || '';
    const masked = local.length <= 2 ? local + '@' + domain : local.slice(0, 2) + '***@' + domain;

    const { error: insertErr } = await supabase.from('email_suppressions').insert({
      normalised_email_hash: hashHex,
      masked_email: masked,
      reason: newReason,
      scope: newScope,
      source_type: 'manual',
      is_permanent: newReason === 'manual_block' || newReason === 'legal_compliance',
    });

    if (insertErr) {
      setError('Failed to add: ' + insertErr.message);
    } else {
      setAddOpen(false);
      setNewEmail('');
      setNewReason('manual_block');
      setNewScope('global');
      fetchData();
      setStatusMsg({ type: 'success', text: 'Suppression added' });
      setTimeout(() => setStatusMsg(null), 2000);
    }
    setAddLoading(false);
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this suppression?')) return;
    const { error } = await supabase.from('email_suppressions').delete().eq('id', id);
    if (!error) {
      fetchData();
      setStatusMsg({ type: 'success', text: 'Suppression removed' });
      setTimeout(() => setStatusMsg(null), 2000);
    }
  };

  const filtered = records.filter(r => {
    if (search && !r.masked_email.toLowerCase().includes(search.toLowerCase())) return false;
    if (reasonFilter && r.reason !== reasonFilter) return false;
    if (scopeFilter && r.scope !== scopeFilter) return false;
    return true;
  });

  const REASONS: SuppressionReason[] = ['hard_bounce', 'repeated_soft_bounce', 'complaint', 'unsubscribe', 'manual_block', 'invalid_address', 'legal_compliance'];
  const SCOPES = ['global', 'brand', 'category', 'list'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/email/analytics" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap">
          <ArrowLeft className="w-4 h-4" /> Analytics
        </Link>
        <span className="text-slate-600">/</span>
        <h2 className="text-lg font-bold text-white">Suppression List</h2>
      </div>

      {statusMsg && (
        <div className={`px-4 py-2.5 rounded-xl text-xs ${statusMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {statusMsg.text}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by masked email..." className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
          />
        </div>
        <select value={reasonFilter} onChange={(e) => setReasonFilter(e.target.value)}
          className="px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 cursor-pointer appearance-none pr-8"
        >
          <option value="">All Reasons</option>
          {REASONS.map(r => <option key={r} value={r}>{SUPPRESSION_REASON_LABELS[r]}</option>)}
        </select>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] rounded-xl text-sm font-medium hover:bg-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap"
        >
          <Ban className="w-4 h-4" /> Add Suppression
        </button>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {addOpen && (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Add Manual Suppression</h3>
          {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">Email Address</label>
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                placeholder="user@example.com" className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">Reason</label>
              <select value={newReason} onChange={(e) => setNewReason(e.target.value as SuppressionReason)}
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none cursor-pointer appearance-none pr-8"
              >
                {REASONS.map(r => <option key={r} value={r}>{SUPPRESSION_REASON_LABELS[r]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">Scope</label>
              <select value={newScope} onChange={(e) => setNewScope(e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-white focus:outline-none cursor-pointer appearance-none pr-8"
              >
                {SCOPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={addLoading}
              className="px-4 py-2 bg-[#06B6D4] text-white rounded-lg text-sm font-semibold hover:bg-[#0891B2] disabled:opacity-50 transition-all cursor-pointer whitespace-nowrap"
            >
              {addLoading ? 'Adding...' : 'Add Suppression'}
            </button>
            <button onClick={() => setAddOpen(false)}
              className="px-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-lg text-sm hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap"
            >Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Ban className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No suppressions found</p>
        </div>
      ) : (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)] text-left text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Reason</th>
                  <th className="p-4 font-medium">Scope</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Created</th>
                  <th className="p-4 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02]">
                    <td className="p-4"><span className="text-white font-mono text-xs">{r.masked_email}</span></td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${
                        r.reason === 'complaint' || r.reason === 'hard_bounce' ? 'bg-red-500/10 text-red-400' :
                        r.reason === 'unsubscribe' ? 'bg-orange-500/10 text-orange-400' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>{SUPPRESSION_REASON_LABELS[r.reason] || r.reason}</span>
                    </td>
                    <td className="p-4 text-slate-400 text-xs">{r.scope}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] ${r.is_permanent ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {r.is_permanent ? 'Permanent' : r.expires_at ? `Until ${new Date(r.expires_at).toLocaleDateString()}` : 'Temporary'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      {(r.reason === 'manual_block' || r.reason === 'repeated_soft_bounce') && (
                        <button onClick={() => handleRemove(r.id)}
                          className="text-xs text-red-400 hover:text-red-300 cursor-pointer flex items-center gap-1 ml-auto"
                        ><Trash2 className="w-3 h-3" /> Remove</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}