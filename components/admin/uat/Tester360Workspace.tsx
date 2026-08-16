'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTesterDetail } from '@/hooks/useUatTesterData';
import {
  TESTER_PROFILE_STATUS_CONFIG, ONBOARDING_STATUS_CONFIG, PERFORMANCE_BAND_CONFIG,
  AVAILABILITY_STATE_CONFIG, CAPABILITY_TYPE_LABELS, AGREEMENT_TYPE_LABELS,
  WARNING_ACTION_LABELS, APPEAL_STATE_CONFIG, PAYMENT_APPROVAL_CONFIG,
  ENTITLEMENT_ELIGIBILITY_CONFIG,
} from '@/lib/uat-tester-definitions';
import {
  ArrowLeft, User, Monitor, Smartphone, Shield, Award, Star,
  FileText, DollarSign, AlertTriangle, Clock,
  Mail, RefreshCw, CheckCircle, XCircle, Ban, MessageSquare,
  Plus, Loader2, Activity,
} from 'lucide-react';
import Link from 'next/link';

interface Props {
  testerId: string;
}

function getConfigEntry<K extends string, T>(config: Record<K, T>, key: unknown): T | undefined {
  return typeof key === 'string' && Object.prototype.hasOwnProperty.call(config, key)
    ? config[key as K]
    : undefined;
}

export default function Tester360Workspace({ testerId }: Props) {
  const router = useRouter();
  const { tester, devices, capabilities, availability, agreements, warnings, ratings, assignments, entitlements, loading, refetch } = useTesterDetail(testerId);
  const [activeTab, setActiveTab] = useState('overview');

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  const [warnOpen, setWarnOpen] = useState(false);
  const [warnForm, setWarnForm] = useState({ action_type: 'advisory_note', reason: '', evidence_link: '', effective_until: '' });
  const [warnSaving, setWarnSaving] = useState(false);

  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingForm, setRatingForm] = useState({
    assignment_id: '', communication_score: 3, bug_quality_score: 3, detail_score: 3,
    reliability_score: 3, speed_score: 3, timeliness_score: 3,
    instruction_following_score: 3, evidence_quality_score: 3,
    tester_visible_summary: '', private_detail: '',
  });
  const [ratingSaving, setRatingSaving] = useState(false);

  useEffect(() => {
    if (tester) setNoteText(tester.internal_notes || '');
  }, [tester]);

  const handleStatusChange = async (newStatus: string) => {
    setStatusUpdating(true);
    const updates: any = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === 'restricted') updates.restricted_at = new Date().toISOString();
    if (newStatus === 'suspended') updates.suspended_at = new Date().toISOString();
    if (newStatus === 'archived') updates.archived_at = new Date().toISOString();
    await supabase.from('uat_testers').update(updates).eq('id', testerId);
    await supabase.from('uat_audit_log').insert({ action: `Tester status: ${newStatus}`, entity_type: 'uat_tester', entity_id: testerId, new_value: updates });
    setStatusUpdating(false);
    refetch();
  };

  const handleSaveNote = async () => {
    setNoteSaving(true);
    await supabase.from('uat_testers').update({ internal_notes: noteText, updated_at: new Date().toISOString() }).eq('id', testerId);
    await supabase.from('uat_audit_log').insert({ action: 'Tester notes updated', entity_type: 'uat_tester', entity_id: testerId, new_value: { internal_notes: noteText } });
    setNoteSaving(false);
    refetch();
  };

  const handleAddWarning = async () => {
    if (!warnForm.reason) return;
    setWarnSaving(true);
    await supabase.from('uat_tester_warnings').insert({
      tester_id: testerId, action_type: warnForm.action_type, reason: warnForm.reason,
      evidence_link: warnForm.evidence_link || null,
      effective_until: warnForm.effective_until || null,
      decided_by: null, is_active: true,
    });
    await supabase.from('uat_audit_log').insert({ action: `Tester ${warnForm.action_type} issued`, entity_type: 'uat_tester_warning', entity_id: testerId, new_value: { action_type: warnForm.action_type, reason: warnForm.reason } });
    setWarnSaving(false);
    setWarnOpen(false);
    setWarnForm({ action_type: 'advisory_note', reason: '', evidence_link: '', effective_until: '' });
    refetch();
  };

  const handleAddRating = async () => {
    setRatingSaving(true);
    const overall = Math.round(
      (ratingForm.communication_score + ratingForm.bug_quality_score + ratingForm.detail_score +
       ratingForm.reliability_score + ratingForm.speed_score + ratingForm.timeliness_score +
       ratingForm.instruction_following_score + ratingForm.evidence_quality_score) / 8 * 10
    ) / 10;

    await supabase.from('uat_tester_ratings').insert({
      tester_id: testerId, assignment_id: ratingForm.assignment_id || null,
      communication_score: ratingForm.communication_score,
      bug_quality_score: ratingForm.bug_quality_score,
      detail_score: ratingForm.detail_score,
      reliability_score: ratingForm.reliability_score,
      speed_score: ratingForm.speed_score,
      timeliness_score: ratingForm.timeliness_score,
      instruction_following_score: ratingForm.instruction_following_score,
      evidence_quality_score: ratingForm.evidence_quality_score,
      overall_score: overall,
      tester_visible_summary: ratingForm.tester_visible_summary,
      private_detail: ratingForm.private_detail,
    });
    await supabase.from('uat_audit_log').insert({ action: 'Tester rating added', entity_type: 'uat_tester_rating', entity_id: testerId, new_value: { overall_score: overall } });
    setRatingSaving(false);
    setRatingOpen(false);
    refetch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
      </div>
    );
  }

  if (!tester) {
    return (
      <div className="text-center py-20">
        <User className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Tester Not Found</h2>
        <p className="text-slate-400 mb-6">This tester does not exist or has been removed.</p>
        <Link href="/admin/uat/testers" className="px-4 py-2.5 bg-[#06B6D4] rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap">Back to Testers</Link>
      </div>
    );
  }

  const sc = getConfigEntry(TESTER_PROFILE_STATUS_CONFIG, tester.status) || TESTER_PROFILE_STATUS_CONFIG.applicant;
  const oc = getConfigEntry(ONBOARDING_STATUS_CONFIG, tester.onboarding_status) || ONBOARDING_STATUS_CONFIG.not_started;
  const rb = getConfigEntry(PERFORMANCE_BAND_CONFIG, tester.reliability_band) || null;
  const qb = getConfigEntry(PERFORMANCE_BAND_CONFIG, tester.quality_band) || null;

  const tabs = [
    { key: 'overview', label: 'Overview', icon: User },
    { key: 'profile', label: 'Profile', icon: FileText },
    { key: 'capabilities', label: 'Capabilities', icon: Award },
    { key: 'devices', label: 'Devices', icon: Monitor },
    { key: 'availability', label: 'Availability', icon: Clock },
    { key: 'applications', label: 'Applications', icon: FileText },
    { key: 'assignments', label: 'Assignments', icon: CheckCircle },
    { key: 'feedback', label: 'Feedback Quality', icon: Star },
    { key: 'ratings', label: 'Ratings', icon: Star },
    { key: 'payments', label: 'Payments', icon: DollarSign },
    { key: 'agreements', label: 'Agreements', icon: Shield },
    { key: 'warnings', label: 'Warnings', icon: AlertTriangle },
    { key: 'activity', label: 'Activity', icon: Activity },
    { key: 'settings', label: 'Settings', icon: Shield },
  ];

  const avgRating = ratings.length > 0
    ? Math.round(ratings.reduce((s: number, r: any) => s + (r.overall_score || 0), 0) / ratings.length * 10) / 10
    : null;

  const totalEarnings = entitlements
    .filter((e: any) => ['approved', 'paid', 'sent_to_finance', 'processing'].includes(e.payment_state))
    .reduce((s: number, e: any) => s + (e.total_amount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.push('/admin/uat/testers')} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#06B6D4]/20 to-[#22D3EE]/20 flex items-center justify-center text-lg font-bold text-[#06B6D4]">
          {tester.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">{tester.full_name}</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border"
              style={{ backgroundColor: sc.bg, color: sc.color, borderColor: sc.color + '30' }}>{sc.label}</span>
            {tester.onboarding_status !== 'approved' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border"
                style={{ backgroundColor: oc.bg, color: oc.color, borderColor: oc.color + '30' }}>Onboarding: {oc.label}</span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" />{tester.email}</span>
            {tester.reference && <span className="text-xs text-slate-600">{tester.reference}</span>}
          </div>
        </div>
        <button onClick={refetch} className="px-3 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-[#06B6D4] cursor-pointer whitespace-nowrap flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1.5 ${activeTab === tab.key ? 'bg-[#06B6D4] text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Active Assignments', value: `${tester.current_active_assignments || 0}/${tester.max_concurrent_assignments || 3}`, color: '#3B82F6' },
              { label: 'Total Completed', value: assignments.filter((a: any) => a.status === 'complete').length, color: '#10B981' },
              { label: 'Avg Rating', value: avgRating !== null ? `${avgRating}/5` : 'No data', color: '#F59E0B' },
              { label: 'Total Earnings', value: `£${totalEarnings.toFixed(2)}`, color: '#10B981' },
              { label: 'Reliability', value: rb ? rb.label : 'No data', color: rb?.color || '#94A3B8' },
              { label: 'Quality', value: qb ? qb.label : 'No data', color: qb?.color || '#94A3B8' },
              { label: 'Sample Size', value: String(tester.performance_sample_size || 0), color: '#6B7280' },
              { label: 'Payment Eligible', value: tester.payment_eligibility ? 'Yes' : 'No', color: tester.payment_eligibility ? '#10B981' : '#EF4444' },
            ].map((item, i) => (
              <div key={i} className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                <p className="text-xl font-bold" style={{ color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-[#06B6D4]" /> Recent Assignments</h3>
              {assignments.slice(0, 5).length === 0 ? (
                <p className="text-sm text-slate-500">No assignments yet.</p>
              ) : (
                <div className="space-y-2">
                  {assignments.slice(0, 5).map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                      <div>
                        <p className="text-sm text-white">{a.job_title || 'Assignment'}</p>
                        <p className="text-xs text-slate-500">{a.status}</p>
                      </div>
                      <span className="text-xs text-slate-400">£{a.agreed_pay || 0}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> Active Warnings</h3>
              {warnings.filter((w: any) => w.is_active).length === 0 ? (
                <p className="text-sm text-slate-500">No active warnings or restrictions.</p>
              ) : (
                <div className="space-y-2">
                  {warnings.filter((w: any) => w.is_active).map((w: any) => (
                    <div key={w.id} className="py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                      <p className="text-sm text-white font-medium">{getConfigEntry(WARNING_ACTION_LABELS, w.action_type) || w.action_type}</p>
                      <p className="text-xs text-slate-400">{w.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Full Name', value: tester.full_name },
              { label: 'Display Name', value: tester.display_name || tester.full_name },
              { label: 'Email', value: tester.email },
              { label: 'Phone', value: tester.phone ? `********${tester.phone.slice(-3)}` : '-' },
              { label: 'Location', value: `${tester.town_city || '-'}, ${tester.country || '-'}` },
              { label: 'Timezone', value: tester.timezone || 'Europe/London' },
              { label: 'Experience', value: tester.experience_level || '-' },
              { label: 'Payment Method', value: tester.preferred_payment_method || '-' },
              { label: 'Over 18', value: tester.is_over_18 ? 'Yes' : 'No' },
              { label: 'Reference', value: tester.reference || 'Not assigned' },
              { label: 'Joined', value: new Date(tester.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
              { label: 'Last Active', value: tester.last_active_at ? new Date(tester.last_active_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <p className="text-xs text-slate-500 uppercase tracking-wider min-w-[120px] pt-0.5">{item.label}</p>
                <p className="text-sm text-white">{item.value}</p>
              </div>
            ))}
          </div>

          {tester.experience_summary && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Experience Summary</p>
              <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                <p className="text-sm text-slate-300 leading-relaxed">{tester.experience_summary}</p>
              </div>
            </div>
          )}

          {tester.application_reason && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Application Reason</p>
              <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                <p className="text-sm text-slate-300 leading-relaxed">{tester.application_reason}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'capabilities' && (
        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
          {capabilities.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No capability records yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {capabilities.map((c: any) => (
                <div key={c.id} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                  <p className="text-sm font-medium text-white">{getConfigEntry(CAPABILITY_TYPE_LABELS, c.capability_type) || c.capability_type}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-500">Self: {c.self_declared_level}</span>
                    {c.verified_level && <span className="text-xs text-emerald-400">Verified: {c.verified_level}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'devices' && (
        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white mb-1">Legacy Device Data</h3>
            <div className="flex flex-wrap gap-1.5">
              {(tester.devices || []).map((d: string) => (
                <span key={d} className="px-2.5 py-1 rounded-lg bg-white/5 text-xs text-slate-400">{d}</span>
              ))}
              {(!tester.devices || tester.devices.length === 0) && <span className="text-xs text-slate-500">None listed</span>}
            </div>
          </div>

          {devices.length === 0 ? (
            <div className="text-center py-8">
              <Monitor className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No structured device records yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {devices.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between py-2.5 px-3 bg-white/[0.02] border border-[rgba(255,255,255,0.04)] rounded-xl">
                  <div className="flex items-center gap-3">
                    {d.category === 'mobile' ? <Smartphone className="w-4 h-4 text-slate-400" /> : <Monitor className="w-4 h-4 text-slate-400" />}
                    <span className="text-sm text-white">{d.make} {d.model} — {d.operating_system} / {d.browser || 'N/A'}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${d.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-500'}`}>
                    {d.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'availability' && (
        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
          {availability.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No availability records yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availability.map((a: any) => {
                const asc = getConfigEntry(AVAILABILITY_STATE_CONFIG, a.availability_state);
                return (
                  <div key={a.id} className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium" style={{ color: asc?.color || '#94A3B8' }}>{asc?.label || a.availability_state}</span>
                      {a.date_start && a.date_end && (
                        <span className="text-xs text-slate-500">{a.date_start} → {a.date_end}</span>
                      )}
                    </div>
                    {(a.preferred_days?.length > 0) && (
                      <div className="flex flex-wrap gap-1">
                        {a.preferred_days.map((d: string) => (
                          <span key={d} className="px-2 py-0.5 rounded bg-white/5 text-xs text-slate-400">{d}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden">
          {assignments.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No assignments yet.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Job</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Pay</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a: any) => (
                  <tr key={a.id} className="border-b border-[rgba(255,255,255,0.04)]">
                    <td className="px-6 py-3.5"><p className="text-sm text-white">{a.job_title || 'Assignment'}</p></td>
                    <td className="px-6 py-3.5"><span className="text-xs text-slate-400 capitalize">{a.status}</span></td>
                    <td className="px-6 py-3.5"><span className="text-sm text-white">£{a.agreed_pay || 0}</span></td>
                    <td className="px-6 py-3.5"><span className="text-xs text-slate-400">{a.deadline ? new Date(a.deadline).toLocaleDateString('en-GB') : '-'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'ratings' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setRatingOpen(true)} className="px-3 py-2 bg-[#06B6D4] hover:bg-[#0891B2] rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Rating
            </button>
          </div>
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden">
            {ratings.length === 0 ? (
              <div className="text-center py-16">
                <Star className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No ratings yet.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)]">
                    <th className="text-center text-xs font-medium text-slate-500 px-3 py-3">Comm</th>
                    <th className="text-center text-xs font-medium text-slate-500 px-3 py-3">Bugs</th>
                    <th className="text-center text-xs font-medium text-slate-500 px-3 py-3">Detail</th>
                    <th className="text-center text-xs font-medium text-slate-500 px-3 py-3">Reliable</th>
                    <th className="text-center text-xs font-medium text-slate-500 px-3 py-3">Speed</th>
                    <th className="text-center text-xs font-medium text-slate-500 px-3 py-3">Timely</th>
                    <th className="text-center text-xs font-medium text-slate-500 px-3 py-3">Instruct</th>
                    <th className="text-center text-xs font-medium text-slate-500 px-3 py-3">Evidence</th>
                    <th className="text-center text-xs font-medium text-slate-500 px-3 py-3">Overall</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-3 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {ratings.map((r: any) => (
                    <tr key={r.id} className="border-b border-[rgba(255,255,255,0.04)]">
                      <td className="px-3 py-3 text-center"><span className="text-sm text-white">{r.communication_score}</span></td>
                      <td className="px-3 py-3 text-center"><span className="text-sm text-white">{r.bug_quality_score}</span></td>
                      <td className="px-3 py-3 text-center"><span className="text-sm text-white">{r.detail_score}</span></td>
                      <td className="px-3 py-3 text-center"><span className="text-sm text-white">{r.reliability_score}</span></td>
                      <td className="px-3 py-3 text-center"><span className="text-sm text-white">{r.speed_score}</span></td>
                      <td className="px-3 py-3 text-center"><span className="text-sm text-white">{r.timeliness_score || '-'}</span></td>
                      <td className="px-3 py-3 text-center"><span className="text-sm text-white">{r.instruction_following_score || '-'}</span></td>
                      <td className="px-3 py-3 text-center"><span className="text-sm text-white">{r.evidence_quality_score || '-'}</span></td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-sm font-bold text-amber-400 bg-amber-400/10">
                          <Star className="w-3 h-3 fill-current" /> {r.overall_score}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString('en-GB')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden">
          {entitlements.length === 0 ? (
            <div className="text-center py-16">
              <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No payments or entitlements yet.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Amount</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Eligibility</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Payment State</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {entitlements.map((e: any) => {
                  const elConf = ENTITLEMENT_ELIGIBILITY_CONFIG[e.eligibility_state];
                  const payConf = PAYMENT_APPROVAL_CONFIG[e.payment_state];
                  return (
                    <tr key={e.id} className="border-b border-[rgba(255,255,255,0.04)]">
                      <td className="px-6 py-3.5"><span className="text-sm font-semibold text-white">£{e.total_amount} {e.currency}</span></td>
                      <td className="px-6 py-3.5"><span className="text-xs" style={{ color: elConf?.color || '#94A3B8' }}>{elConf?.label || e.eligibility_state}</span></td>
                      <td className="px-6 py-3.5"><span className="text-xs" style={{ color: payConf?.color || '#94A3B8' }}>{payConf?.label || e.payment_state}</span></td>
                      <td className="px-6 py-3.5"><span className="text-xs text-slate-400">{new Date(e.created_at).toLocaleDateString('en-GB')}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'agreements' && (
        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden">
          {agreements.length === 0 ? (
            <div className="text-center py-16">
              <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No agreement records yet.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Type</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Version</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Accepted</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Date</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {agreements.map((a: any) => (
                  <tr key={a.id} className="border-b border-[rgba(255,255,255,0.04)]">
                    <td className="px-6 py-3.5"><span className="text-sm text-white">{getConfigEntry(AGREEMENT_TYPE_LABELS, a.agreement_type) || a.agreement_type}</span></td>
                    <td className="px-6 py-3.5"><span className="text-sm text-white">{a.version}</span></td>
                    <td className="px-6 py-3.5">{a.accepted ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}</td>
                    <td className="px-6 py-3.5"><span className="text-xs text-slate-400">{a.accepted_at ? new Date(a.accepted_at).toLocaleDateString('en-GB') : '-'}</span></td>
                    <td className="px-6 py-3.5"><span className={`text-xs ${a.superseded ? 'text-amber-400' : 'text-slate-400'}`}>{a.superseded ? 'Superseded' : 'Current'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'warnings' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setWarnOpen(true)} className="px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm font-semibold text-amber-400 hover:bg-amber-500/20 cursor-pointer whitespace-nowrap flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Issue Warning
            </button>
          </div>
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden">
            {warnings.length === 0 ? (
              <div className="text-center py-16">
                <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No warnings or restrictions.</p>
              </div>
            ) : (
              <div className="divide-y divide-[rgba(255,255,255,0.06)]">
                {warnings.map((w: any) => (
                  <div key={w.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium mb-1"
                          style={{ color: w.is_active ? '#F97316' : '#6B7280', backgroundColor: w.is_active ? '#F9731620' : '#6B728020' }}>
                          {getConfigEntry(WARNING_ACTION_LABELS, w.action_type) || w.action_type}
                        </span>
                        <p className="text-sm text-white mt-1">{w.reason}</p>
                        {w.evidence_link && <p className="text-xs text-slate-500 mt-1">Evidence: {w.evidence_link}</p>}
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-xs text-slate-400">{new Date(w.created_at).toLocaleDateString('en-GB')}</p>
                        {w.effective_until && <p className="text-xs text-slate-500">Until: {new Date(w.effective_until).toLocaleDateString('en-GB')}</p>}
                        {w.appeal_state !== 'none' && <p className="text-xs mt-1" style={{ color: APPEAL_STATE_CONFIG[w.appeal_state]?.color }}>{APPEAL_STATE_CONFIG[w.appeal_state]?.label}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Activity feed available via the Audit Log page.</p>
            <Link href="/admin/audit-log" className="inline-block mt-3 px-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-white cursor-pointer whitespace-nowrap">View Audit Log</Link>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-5">
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Change Status</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TESTER_PROFILE_STATUS_CONFIG).map(([key, config]) => {
                const Icon = key === 'active' ? CheckCircle : key === 'archived' ? Ban : key === 'suspended' ? Ban : key === 'restricted' ? Shield : User;
                return (
                  <button key={key} onClick={() => handleStatusChange(key)} disabled={tester.status === key || statusUpdating}
                    className="px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ color: config.color, borderColor: config.color + '40', backgroundColor: tester.status === key ? config.color + '20' : 'transparent' }}>
                    <Icon className="w-3.5 h-3.5" /> {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-[#06B6D4]" /> Internal Notes</h3>
            <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={3} maxLength={500}
              className="w-full px-4 py-3 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all resize-none" />
            <button onClick={handleSaveNote} disabled={noteSaving}
              className="mt-3 px-4 py-2 bg-[#06B6D4] hover:bg-[#0891B2] disabled:opacity-40 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap">Save Notes</button>
          </div>
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Applications view available on the Applications page.</p>
            <button onClick={() => router.push('/admin/uat/applications')} className="mt-3 px-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-white cursor-pointer whitespace-nowrap">View Applications</button>
          </div>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.06)] rounded-xl p-6">
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Feedback quality review available on the Feedback page.</p>
            <button onClick={() => router.push('/admin/uat/feedback')} className="mt-3 px-4 py-2 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-white cursor-pointer whitespace-nowrap">View Feedback</button>
          </div>
        </div>
      )}

      {warnOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setWarnOpen(false)}>
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Issue Warning / Restriction</h2>
              <button onClick={() => setWarnOpen(false)} className="text-slate-500 hover:text-white text-xl cursor-pointer">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Action Type</label>
                <select value={warnForm.action_type} onChange={(e) => setWarnForm({ ...warnForm, action_type: e.target.value })}
                  className="w-full pl-3 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                  {Object.entries(WARNING_ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Reason</label>
                <textarea value={warnForm.reason} onChange={(e) => setWarnForm({ ...warnForm, reason: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 resize-none" rows={3} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Evidence Link (optional)</label>
                <input type="text" value={warnForm.evidence_link} onChange={(e) => setWarnForm({ ...warnForm, evidence_link: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Effective Until (optional)</label>
                <input type="date" value={warnForm.effective_until} onChange={(e) => setWarnForm({ ...warnForm, effective_until: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40" />
              </div>
            </div>
            <div className="p-5 border-t border-[rgba(255,255,255,0.08)] flex justify-end gap-3">
              <button onClick={() => setWarnOpen(false)} className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-white cursor-pointer whitespace-nowrap">Cancel</button>
              <button onClick={handleAddWarning} disabled={warnSaving || !warnForm.reason}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap flex items-center gap-1.5">
                {warnSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />} Issue
              </button>
            </div>
          </div>
        </div>
      )}

      {ratingOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setRatingOpen(false)}>
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Rate Tester</h2>
              <button onClick={() => setRatingOpen(false)} className="text-slate-500 hover:text-white text-xl cursor-pointer">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Assignment (optional)</label>
                <select value={ratingForm.assignment_id} onChange={(e) => setRatingForm({ ...ratingForm, assignment_id: e.target.value })}
                  className="w-full pl-3 pr-8 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 cursor-pointer appearance-none">
                  <option value="">No specific assignment</option>
                  {assignments.map((a: any) => <option key={a.id} value={a.id}>{a.job_title || 'Assignment'} ({a.status})</option>)}
                </select>
              </div>
              {[
                { key: 'communication_score', label: 'Communication' },
                { key: 'bug_quality_score', label: 'Bug Quality' },
                { key: 'detail_score', label: 'Detail Level' },
                { key: 'reliability_score', label: 'Reliability' },
                { key: 'speed_score', label: 'Speed' },
                { key: 'timeliness_score', label: 'Timeliness' },
                { key: 'instruction_following_score', label: 'Instruction Following' },
                { key: 'evidence_quality_score', label: 'Evidence Quality' },
              ].map((cat) => (
                <div key={cat.key}>
                  <label className="text-xs text-slate-400 mb-1.5 block">{cat.label}</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} onClick={() => setRatingForm({ ...ratingForm, [cat.key]: s })}
                        className="w-7 h-7 flex items-center justify-center cursor-pointer">
                        <Star className={`w-5 h-5 ${s <= (ratingForm as any)[cat.key] ? 'text-amber-400 fill-current' : 'text-slate-600'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Tester-Visible Summary</label>
                <textarea value={ratingForm.tester_visible_summary} onChange={(e) => setRatingForm({ ...ratingForm, tester_visible_summary: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 resize-none" rows={2} />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Private Detail</label>
                <textarea value={ratingForm.private_detail} onChange={(e) => setRatingForm({ ...ratingForm, private_detail: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 resize-none" rows={2} />
              </div>
            </div>
            <div className="p-5 border-t border-[rgba(255,255,255,0.08)] flex justify-end gap-3">
              <button onClick={() => setRatingOpen(false)} className="px-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-slate-400 hover:text-white cursor-pointer whitespace-nowrap">Cancel</button>
              <button onClick={handleAddRating} disabled={ratingSaving}
                className="px-4 py-2.5 bg-[#06B6D4] hover:bg-[#0891B2] disabled:opacity-40 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap flex items-center gap-1.5">
                {ratingSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" />} Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
