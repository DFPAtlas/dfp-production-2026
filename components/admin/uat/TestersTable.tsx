'use client';

import { useState } from 'react';
import { motion } from '@/components/motion';
import { useTesters } from '@/hooks/useUatTesterData';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { TESTER_PROFILE_STATUS_CONFIG, ONBOARDING_STATUS_CONFIG, PERFORMANCE_BAND_CONFIG } from '@/lib/uat-tester-definitions';
import { Search, RefreshCw, Eye, ChevronDown, ChevronUp, Filter, UserPlus, MapPin, Star, Shield, UserCheck, Clock, Ban, Users } from 'lucide-react';

export default function TestersTable() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const { testers, loading, refetch } = useTesters(
    searchQuery ? { search: searchQuery } : statusFilter !== 'all' ? { status: statusFilter } : undefined
  );

  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setStatusUpdating(id);
    await supabase.from('uat_testers').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    await supabase.from('uat_audit_log').insert({ action: `Tester status: ${newStatus}`, entity_type: 'uat_tester', entity_id: id, new_value: { status: newStatus } });
    setStatusUpdating(null);
    refetch();
  };

  let filtered = testers;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = testers.filter((t: any) =>
      (t.full_name && t.full_name.toLowerCase().includes(q)) ||
      (t.email && t.email.toLowerCase().includes(q)) ||
      (t.reference && t.reference.toLowerCase().includes(q)) ||
      (t.town_city && t.town_city.toLowerCase().includes(q))
    );
  }
  if (statusFilter !== 'all') filtered = filtered.filter((t: any) => t.status === statusFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-[rgba(255,255,255,0.08)] space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" placeholder="Search by name, email, reference, or town..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all" />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-3 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                <option value="all">All Status</option>
                {Object.entries(TESTER_PROFILE_STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${showFilters ? 'bg-[#06B6D4]/10 border border-[#06B6D4]/30 text-[#06B6D4]' : 'bg-white/5 border border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-white'}`}>
              <Filter className="w-4 h-4" /> Filters {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button onClick={refetch} className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-[#06B6D4] transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.06)]">
              <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tester</th>
              <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
              <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reliability</th>
              <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quality</th>
              <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Jobs</th>
              <th className="text-left py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment</th>
              <th className="text-right py-3.5 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tester: any) => {
              const sc = TESTER_PROFILE_STATUS_CONFIG[
                tester.status as keyof typeof TESTER_PROFILE_STATUS_CONFIG
              ] || TESTER_PROFILE_STATUS_CONFIG.applicant;
              const rb = tester.reliability_band
                ? PERFORMANCE_BAND_CONFIG[
                    tester.reliability_band as keyof typeof PERFORMANCE_BAND_CONFIG
                  ]
                : null;
              const qb = tester.quality_band
                ? PERFORMANCE_BAND_CONFIG[
                    tester.quality_band as keyof typeof PERFORMANCE_BAND_CONFIG
                  ]
                : null;
              return (
                <tr key={tester.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#06B6D4]/20 to-[#22D3EE]/20 flex items-center justify-center text-xs font-bold text-[#06B6D4]">
                        {tester.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{tester.full_name}</p>
                        <p className="text-xs text-slate-500">{tester.reference || tester.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-sm text-slate-400">{tester.town_city || '-'}, {tester.country || '-'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border"
                      style={{ backgroundColor: sc.bg, color: sc.color, borderColor: sc.color + '30' }}>
                      {tester.status === 'active' && <UserCheck className="w-3 h-3" />}
                      {tester.status === 'restricted' && <Shield className="w-3 h-3" />}
                      {tester.status === 'suspended' && <Ban className="w-3 h-3" />}
                      {tester.status === 'applicant' && <UserPlus className="w-3 h-3" />}
                      {sc.label}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    {rb ? <span className="text-sm font-medium" style={{ color: rb.color }}>{rb.label}</span> : <span className="text-xs text-slate-500">-</span>}
                    {tester.performance_sample_size > 0 && <span className="text-xs text-slate-600 ml-1">({tester.performance_sample_size})</span>}
                  </td>
                  <td className="py-4 px-5">
                    {qb ? <span className="text-sm font-medium" style={{ color: qb.color }}>{qb.label}</span> : <span className="text-xs text-slate-500">-</span>}
                  </td>
                  <td className="py-4 px-5">
                    <span className="text-sm text-white">{tester.current_active_assignments || 0}/{tester.max_concurrent_assignments || 3}</span>
                  </td>
                  <td className="py-4 px-5">
                    {tester.payment_eligibility ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Star className="w-3 h-3" /> Eligible
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">-</span>
                    )}
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => router.push(`/admin/uat/testers/${tester.id}`)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-[#06B6D4] transition-colors cursor-pointer">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">No testers found</p>
          <p className="text-sm text-slate-500 mt-1">
            {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Testers will appear here when they register'}
          </p>
        </div>
      )}
    </div>
  );
}

