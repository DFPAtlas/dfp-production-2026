'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Search, RefreshCw, Award, Plus, ChevronDown, User,
  X, Loader2, FileText, Shield,
} from 'lucide-react';
import AdminShell from '../../../../components/admin/AdminShell';



interface Badge {
  id: string; name: string; description: string; badge_type: string;
  icon: string; is_active: boolean; created_at: string;
}

interface TesterBadge {
  id: string; tester_id: string; badge_id: string; awarded_at: string; notes: string | null;
  badge_name?: string; badge_icon?: string; badge_type?: string;
  tester_name?: string; tester_email?: string;
}

const badgeTypeColors: Record<string, string> = {
  milestone: '#06B6D4', achievement: '#F59E0B', specialty: '#8B5CF6', rank: '#10B981',
};

export default function AdminBadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [testerBadges, setTesterBadges] = useState<TesterBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState<'badges' | 'awarded'>('awarded');

  const [awardOpen, setAwardOpen] = useState(false);
  const [testers, setTesters] = useState<any[]>([]);
  const [awardForm, setAwardForm] = useState({ tester_id: '', badge_id: '', notes: '' });
  const [awarding, setAwarding] = useState(false);

  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [{ data: b }, { data: tb }] = await Promise.all([
      supabase.from('uat_badges').select('*').order('created_at'),
      supabase.from('uat_tester_badges').select('*, uat_badges!inner(name, icon, badge_type)').order('awarded_at', { ascending: false }),
    ]);

    setBadges(b || []);

    if (tb) {
      const testerIds = [...new Set(tb.map((t: any) => t.tester_id))];
      const { data: testerData } = await supabase.from('uat_testers').select('id, full_name, email').in('id', testerIds);
      const testerMap: Record<string, any> = {};
      testerData?.forEach((t: any) => { testerMap[t.id] = t; });

      const merged: TesterBadge[] = tb.map((t: any) => ({
        ...t,
        badge_name: t.uat_badges?.name || 'Unknown',
        badge_icon: t.uat_badges?.icon || 'ri-medal-line',
        badge_type: t.uat_badges?.badge_type || '',
        tester_name: testerMap[t.tester_id]?.full_name || 'Unknown',
        tester_email: testerMap[t.tester_id]?.email || '',
      }));
      setTesterBadges(merged);
    }

    setLoading(false);
  };

  const openAward = async () => {
    const { data: testerList } = await supabase.from('uat_testers').select('id, full_name').eq('status', 'approved');
    setTesters(testerList || []);
    setAwardForm({ tester_id: '', badge_id: '', notes: '' });
    setAwardOpen(true);
  };

  const handleAward = async () => {
    if (!awardForm.tester_id || !awardForm.badge_id) return;
    setAwarding(true);

    await supabase.from('uat_tester_badges').insert({
      tester_id: awardForm.tester_id,
      badge_id: awardForm.badge_id,
      notes: awardForm.notes,
    });

    await supabase.from('uat_audit_log').insert({
      action: 'Badge awarded',
      entity_type: 'uat_tester_badge',
      entity_id: awardForm.tester_id,
      new_value: { badge_id: awardForm.badge_id },
    });

    setAwarding(false);
    setAwardOpen(false);
    fetchData();
  };

  const handleToggleActive = async (badgeId: string, currentActive: boolean) => {
    setToggleLoading(badgeId);
    await supabase.from('uat_badges').update({ is_active: !currentActive }).eq('id', badgeId);
    setToggleLoading(null);
    fetchData();
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
        </div>
      </AdminShell>
    );
  }

  const activeBadges = badges.filter((b) => b.is_active);

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">UAT Badges</h1>
            <p className="text-sm text-slate-400 mt-0.5">Manage badges and award them to testers</p>
          </div>
          <button onClick={openAward} className="px-4 py-2.5 bg-[#06B6D4] hover:bg-[#0891B2] rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap flex items-center gap-2 transition-colors">
            <Award className="w-4 h-4" /> Award Badge
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('awarded')}
            className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap transition-colors ${tab === 'awarded' ? 'bg-[#06B6D4] text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
            Awarded Badges
          </button>
          <button onClick={() => setTab('badges')}
            className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap transition-colors ${tab === 'badges' ? 'bg-[#06B6D4] text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
            All Badges ({badges.length})
          </button>
        </div>

        {tab === 'badges' && (
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5">
              {badges.map((b) => (
                <div key={b.id} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: (badgeTypeColors[b.badge_type] || '#6B7280') + '15' }}>
                      <i className={`${b.icon} text-sm`} style={{ color: badgeTypeColors[b.badge_type] || '#6B7280' }} />
                    </div>
                    <button onClick={() => handleToggleActive(b.id, b.is_active)} disabled={toggleLoading === b.id}
                      className={`w-8 h-5 rounded-full transition-colors cursor-pointer relative ${b.is_active ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                      <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${b.is_active ? 'left-4' : 'left-0.5'}`} />
                    </button>
                  </div>
                  <p className="text-sm font-medium text-white">{b.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{b.description}</p>
                  <span className="inline-block mt-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{ color: badgeTypeColors[b.badge_type] || '#6B7280', backgroundColor: (badgeTypeColors[b.badge_type] || '#6B7280') + '10' }}>
                    {b.badge_type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'awarded' && (
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-[rgba(255,255,255,0.08)]">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" placeholder="Search by tester or badge..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)]">
                    <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Tester</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Badge</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Type</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Awarded</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {testerBadges.filter((tb) => {
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    return (tb.tester_name?.toLowerCase().includes(q)) || (tb.badge_name?.toLowerCase().includes(q));
                  }).map((tb) => (
                    <tr key={tb.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-white">{tb.tester_name}</p>
                        <p className="text-xs text-slate-500">{tb.tester_email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: (badgeTypeColors[tb.badge_type || ''] || '#6B7280') + '15' }}>
                            <i className={`${tb.badge_icon} text-xs`} style={{ color: badgeTypeColors[tb.badge_type || ''] || '#6B7280' }} />
                          </div>
                          <span className="text-sm text-white">{tb.badge_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs capitalize" style={{ color: badgeTypeColors[tb.badge_type || ''] || '#6B7280' }}>{tb.badge_type}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-400">{new Date(tb.awarded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-500 max-w-[200px] truncate">{tb.notes || '-'}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {testerBadges.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-slate-500/10 flex items-center justify-center mx-auto mb-6">
                  <Award className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">No Badges Awarded</h3>
                <p className="text-sm text-slate-400">Award a badge to a tester to get started.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {awardOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setAwardOpen(false)}>
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Award Badge</h2>
              <button onClick={() => setAwardOpen(false)} className="text-slate-500 hover:text-white text-xl cursor-pointer">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Tester</label>
                <select value={awardForm.tester_id} onChange={(e) => setAwardForm({ ...awardForm, tester_id: e.target.value })}
                  className="w-full pl-3 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                  <option value="">Select tester...</option>
                  {testers.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Badge</label>
                <select value={awardForm.badge_id} onChange={(e) => setAwardForm({ ...awardForm, badge_id: e.target.value })}
                  className="w-full pl-3 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                  <option value="">Select badge...</option>
                  {activeBadges.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.badge_type})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Notes</label>
                <textarea value={awardForm.notes} onChange={(e) => setAwardForm({ ...awardForm, notes: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 resize-none" rows={2} />
              </div>
            </div>
            <div className="p-5 border-t border-[rgba(255,255,255,0.08)] flex justify-end gap-3">
              <button onClick={() => setAwardOpen(false)} className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-white cursor-pointer whitespace-nowrap">Cancel</button>
              <button onClick={handleAward} disabled={awarding || !awardForm.tester_id || !awardForm.badge_id}
                className="px-4 py-2.5 bg-[#06B6D4] hover:bg-[#0891B2] disabled:opacity-40 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap flex items-center gap-2">
                {awarding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                Award Badge
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}