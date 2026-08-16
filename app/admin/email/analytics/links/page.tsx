'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Search, RefreshCw, MousePointerClick, ExternalLink } from 'lucide-react';
import { LinkClick } from '@/components/admin/email/analytics/analytics-types';

export default function LinkPerformancePage() {
  const [clicks, setClicks] = useState<LinkClick[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('email_link_clicks').select('*').order('clicked_at', { ascending: false }).limit(500);
    if (data) setClicks(data as LinkClick[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const aggregated: { url: string; label: string; domain: string; totalClicks: number; uniqueClicks: number; firstClick: string; lastClick: string }[] = [];
  const seen = new Map<string, { total: number; uniqueRecipients: Set<string>; first: string; last: string }>();
  clicks.forEach(c => {
    const norm = c.link_url;
    const existing = seen.get(norm);
    if (existing) {
      existing.total++;
      existing.uniqueRecipients.add(c.recipient_message_id);
      if (c.clicked_at < existing.first) existing.first = c.clicked_at;
      if (c.clicked_at > existing.last) existing.last = c.clicked_at;
    } else {
      seen.set(norm, { total: 1, uniqueRecipients: new Set([c.recipient_message_id]), first: c.clicked_at, last: c.clicked_at });
    }
  });

  seen.forEach((v, k) => {
    try {
      const u = new URL(k);
      if (u.pathname.includes('unsubscribe') || u.pathname.includes('preferences')) return;
    } catch { return; }

    aggregated.push({
      url: k.length > 60 ? k.slice(0, 60) + '...' : k,
      label: clicks.find(c => c.link_url === k)?.link_label || '',
      domain: clicks.find(c => c.link_url === k)?.destination_domain || '',
      totalClicks: v.total,
      uniqueClicks: v.uniqueRecipients.size,
      firstClick: v.first,
      lastClick: v.last,
    });
  });

  aggregated.sort((a, b) => b.totalClicks - a.totalClicks);

  const filtered = aggregated.filter(a => {
    if (search && !a.url.toLowerCase().includes(search.toLowerCase()) && !a.domain.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/email/analytics" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer whitespace-nowrap">
          <ArrowLeft className="w-4 h-4" /> Analytics
        </Link>
        <span className="text-slate-600">/</span>
        <h2 className="text-lg font-bold text-white">Link Performance</h2>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search links or domains..." className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20"
          />
        </div>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-slate-300 rounded-xl text-sm hover:bg-white/[0.08] transition-all cursor-pointer whitespace-nowrap"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Total Clicks</p>
          <p className="text-2xl font-bold text-white">{loading ? '—' : clicks.length.toLocaleString()}</p>
        </div>
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Unique Links</p>
          <p className="text-2xl font-bold text-white">{loading ? '—' : aggregated.length.toLocaleString()}</p>
        </div>
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Unique Domains</p>
          <p className="text-2xl font-bold text-white">{loading ? '—' : [...new Set(clicks.map(c => c.destination_domain))].length.toLocaleString()}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <MousePointerClick className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No link click data yet</p>
          <p className="text-xs text-slate-500 mt-1">Clicks appear here when Resend tracks link engagement from sent campaigns</p>
        </div>
      ) : (
        <div className="bg-[#121215] border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)] text-left text-[11px] text-slate-500 uppercase tracking-wider">
                  <th className="p-4 font-medium">Link</th>
                  <th className="p-4 font-medium">Domain</th>
                  <th className="p-4 font-medium text-right">Total Clicks</th>
                  <th className="p-4 font-medium text-right">Unique Clicks</th>
                  <th className="p-4 font-medium">First Click</th>
                  <th className="p-4 font-medium">Last Click</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr key={i} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-white/[0.02]">
                    <td className="p-4 max-w-xs">
                      <span className="text-white text-xs truncate block" title={a.url}>{a.label || a.url}</span>
                    </td>
                    <td className="p-4 text-slate-400 text-xs">{a.domain}</td>
                    <td className="p-4 text-right text-amber-400 font-medium">{a.totalClicks.toLocaleString()}</td>
                    <td className="p-4 text-right text-violet-400 font-medium">{a.uniqueClicks.toLocaleString()}</td>
                    <td className="p-4 text-slate-400 text-xs">{new Date(a.firstClick).toLocaleDateString()}</td>
                    <td className="p-4 text-slate-400 text-xs">{new Date(a.lastClick).toLocaleDateString()}</td>
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