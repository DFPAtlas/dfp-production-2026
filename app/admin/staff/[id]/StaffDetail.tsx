'use client';

import { useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useStaffDetail, useStaffTeams, useApprovalAuthority, useTempAccess } from '@/hooks/useStaffData';
import { STAFF_STATUS_CONFIG, MFA_STATE_CONFIG, IDENTITY_TYPES, GLOBAL_ROLES } from '@/lib/staff-definitions';

const TABS = [
  'Overview', 'Teams', 'Access', 'Approval Authority', 'Sessions & Security',
  'Access History', 'Activity', 'Settings',
];

function StaffDetailPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const staffId = params.id as string;
  const source = searchParams.get('source') || 'admin_profiles';
  const [activeTab, setActiveTab] = useState('Overview');

  const { profile, loading } = useStaffDetail(staffId, source);
  const { teams, memberships, loading: teamLoading } = useStaffTeams(staffId);
  const { authorities, loading: authLoading } = useApprovalAuthority(staffId);
  const { grants, loading: grantLoading } = useTempAccess();

  const staffGrants = grants.filter((g: any) => g.staff_id === staffId);
  const staffTeams = teams.filter((t: any) => memberships.some((m: any) => m.team_id === t.id && m.staff_id === staffId));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Loading staff profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-slate-400">Staff member not found.</p>
        <Link href="/admin/staff" className="text-sm text-[#06B6D4] hover:underline cursor-pointer">Back to Directory</Link>
      </div>
    );
  }

  const status = profile.status || 'Active';
  const statusCfg = (STAFF_STATUS_CONFIG as any)[status] || STAFF_STATUS_CONFIG.Active;
  const mfa = profile.mfa_state || 'Unknown';
  const mfaCfg = MFA_STATE_CONFIG[mfa as keyof typeof MFA_STATE_CONFIG] || MFA_STATE_CONFIG.Unknown;
  const identityType = profile.identity_type || 'internal';
  const identityLabel = IDENTITY_TYPES[identityType as keyof typeof IDENTITY_TYPES]?.label || identityType;
  const roleLabel = GLOBAL_ROLES[profile.role as keyof typeof GLOBAL_ROLES]?.label || profile.role;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/staff" className="text-slate-400 hover:text-white transition-colors cursor-pointer">
          <i className="ri-arrow-left-line w-5 h-5 flex items-center justify-center"></i>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{profile.full_name || profile.email}</h1>
          <p className="text-sm text-slate-400">{profile.email} · {identityLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/5 rounded-xl p-4">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Role</p>
          <p className="text-sm font-medium text-white">{roleLabel}</p>
        </div>
        <div className="bg-white/5 border border-white/5 rounded-xl p-4">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Status</p>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>{status}</span>
        </div>
        <div className="bg-white/5 border border-white/5 rounded-xl p-4">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">MFA</p>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${mfaCfg.bg} ${mfaCfg.color}`}>{mfaCfg.label}</span>
        </div>
        <div className="bg-white/5 border border-white/5 rounded-xl p-4">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Reference</p>
          <p className="text-sm font-mono text-white">{profile.reference || '—'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/5 rounded-xl p-4">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Title</p>
          <p className="text-sm text-white">{profile.title || '—'}</p>
        </div>
        <div className="bg-white/5 border border-white/5 rounded-xl p-4">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Engagement</p>
          <p className="text-sm text-white capitalize">{profile.engagement_type || '—'}</p>
        </div>
        <div className="bg-white/5 border border-white/5 rounded-xl p-4">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Timezone</p>
          <p className="text-sm text-white">{profile.timezone || '—'}</p>
        </div>
        <div className="bg-white/5 border border-white/5 rounded-xl p-4">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Last Login</p>
          <p className="text-sm text-white">{profile.last_login_at ? new Date(profile.last_login_at).toLocaleString() : '—'}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-white/5 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
              activeTab === tab ? 'border-[#06B6D4] text-[#06B6D4]' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >{tab}</button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Profile Details</h3>
            <dl className="space-y-3">
              <div className="flex justify-between"><dt className="text-xs text-slate-400">Phone</dt><dd className="text-xs text-white">{profile.phone_work || profile.phone || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-xs text-slate-400">Portfolio</dt><dd className="text-xs text-white">{profile.portfolio_company || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-xs text-slate-400">Engagement Start</dt><dd className="text-xs text-white">{profile.engagement_start || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-xs text-slate-400">Review Date</dt><dd className="text-xs text-white">{profile.review_date || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-xs text-slate-400">Joined</dt><dd className="text-xs text-white">{profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}</dd></div>
            </dl>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Status Actions</h3>
            <div className="space-y-3">
              {status === 'Active' && (
                <>
                  <button className="w-full px-4 py-2 bg-red-500/10 text-red-400 text-sm rounded-xl hover:bg-red-500/20 transition-colors cursor-pointer whitespace-nowrap">Suspend Account</button>
                  <button className="w-full px-4 py-2 bg-amber-500/10 text-amber-400 text-sm rounded-xl hover:bg-amber-500/20 transition-colors cursor-pointer whitespace-nowrap">Temporarily Restrict</button>
                </>
              )}
              {status === 'Suspended' && (
                <button className="w-full px-4 py-2 bg-emerald-500/10 text-emerald-400 text-sm rounded-xl hover:bg-emerald-500/20 transition-colors cursor-pointer whitespace-nowrap">Reactivate Account</button>
              )}
              {(status === 'Active' || status === 'Temporarily Restricted') && (
                <button className="w-full px-4 py-2 bg-purple-500/10 text-purple-400 text-sm rounded-xl hover:bg-purple-500/20 transition-colors cursor-pointer whitespace-nowrap">Start Offboarding</button>
              )}
            </div>
            {profile.suspended_at && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                <p className="text-xs text-red-400 font-medium">Suspended: {new Date(profile.suspended_at).toLocaleDateString()}</p>
                <p className="text-xs text-slate-400 mt-1">{profile.suspension_reason || 'No reason recorded'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'Teams' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Current Teams</h3>
            {teamLoading ? <p className="text-sm text-slate-500">Loading...</p> : staffTeams.length === 0 ? <p className="text-sm text-slate-500">Not assigned to any teams.</p> : (
              <div className="space-y-2">{staffTeams.map((t: any) => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <i className="ri-group-line text-slate-400 text-sm w-4 h-4 flex items-center justify-center"></i>
                  <div className="flex-1"><p className="text-sm text-white">{t.name}</p><p className="text-xs text-slate-500">{t.staff_departments?.name || 'No department'}</p></div>
                </div>
              ))}</div>
            )}
          </div>
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">All Available Teams</h3>
            <div className="space-y-2">
              {teams.filter((t: any) => !memberships.some((m: any) => m.team_id === t.id && m.staff_id === staffId)).map((t: any) => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 opacity-50">
                  <i className="ri-group-line text-slate-500 text-sm w-4 h-4 flex items-center justify-center"></i>
                  <div className="flex-1"><p className="text-sm text-slate-400">{t.name}</p></div>
                  <button className="text-xs text-[#06B6D4] hover:underline cursor-pointer">Add</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Access' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Role-Based Access</h3>
            <div className="p-4 rounded-lg bg-white/5 mb-4">
              <p className="text-sm text-white font-medium">{roleLabel}</p>
              <p className="text-xs text-slate-400 mt-1">{GLOBAL_ROLES[profile.role as keyof typeof GLOBAL_ROLES]?.description || 'Custom role'}</p>
              {GLOBAL_ROLES[profile.role as keyof typeof GLOBAL_ROLES]?.isPrivileged && (
                <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">Privileged Role</span>
              )}
            </div>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Temporary Access</h3>
            {grantLoading ? <p className="text-sm text-slate-500">Loading...</p> : staffGrants.length === 0 ? <p className="text-sm text-slate-500">No temporary access grants.</p> : (
              <div className="space-y-2">{staffGrants.map((g: any) => (
                <div key={g.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                  <i className="ri-timer-line text-amber-400 text-sm w-4 h-4 flex items-center justify-center"></i>
                  <div className="flex-1"><p className="text-sm text-white">{g.permission_key}</p><p className="text-xs text-slate-500">Expires: {new Date(g.expires_at).toLocaleDateString()}</p></div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">{g.status}</span>
                </div>
              ))}</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'Approval Authority' && (
        <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Approval Authority</h3>
          {authLoading ? <p className="text-sm text-slate-500">Loading...</p> : authorities.length === 0 ? <p className="text-sm text-slate-500">No approval authorities assigned.</p> : (
            <div className="space-y-2">{authorities.map((a: any) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                <i className="ri-check-double-line text-emerald-400 text-sm w-4 h-4 flex items-center justify-center"></i>
                <div className="flex-1"><p className="text-sm text-white capitalize">{a.authority_type.replace(/_/g, ' ')}</p>{a.monetary_limit && <p className="text-xs text-slate-500">Up to £{a.monetary_limit.toLocaleString()}</p>}</div>
                {a.active ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Active</span> : <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400">Revoked</span>}
              </div>
            ))}</div>
          )}
        </div>
      )}

      {activeTab === 'Sessions & Security' && (
        <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Session & Security Status</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5">
              <div className={`w-3 h-3 rounded-full ${mfaCfg.color?.includes('emerald') ? 'bg-emerald-400' : mfaCfg.color?.includes('red') ? 'bg-red-400' : 'bg-slate-400'}`}></div>
              <div><p className="text-sm text-white">MFA Status: {mfaCfg.label}</p><p className="text-xs text-slate-500 mt-1">Detailed session management is not configured through the current Auth provider.</p></div>
            </div>
            <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <p className="text-sm text-amber-400 font-medium">Session Management</p>
              <p className="text-xs text-slate-400 mt-1">Session listing, revocation, and device tracking are available only through the Supabase Dashboard for your current configuration.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Access History' && (
        <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Access History</h3>
          <p className="text-sm text-slate-500">Access history, permission changes, and audit trail entries are viewable through the main Audit Log.</p>
          <Link href="/admin/audit-log" className="inline-block mt-3 text-sm text-[#06B6D4] hover:underline cursor-pointer">View Audit Log</Link>
        </div>
      )}

      {activeTab === 'Activity' && (
        <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Activity</h3>
          <p className="text-sm text-slate-500">Activity feed for this staff member is available through the Activity page.</p>
          <Link href="/admin/activity" className="inline-block mt-3 text-sm text-[#06B6D4] hover:underline cursor-pointer">View Activity</Link>
        </div>
      )}

      {activeTab === 'Settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Profile Settings</h3>
            <div className="space-y-3">
              <div><label className="text-xs text-slate-400 block mb-1">Title</label><input type="text" defaultValue={profile.title || ''} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#06B6D4]/50" /></div>
              <div><label className="text-xs text-slate-400 block mb-1">Phone (Work)</label><input type="text" defaultValue={profile.phone_work || ''} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#06B6D4]/50" /></div>
              <div><label className="text-xs text-slate-400 block mb-1">Timezone</label><input type="text" defaultValue={profile.timezone || 'Europe/London'} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#06B6D4]/50" /></div>
              <button className="w-full px-4 py-2 bg-[#06B6D4]/10 text-[#06B6D4] text-sm rounded-xl hover:bg-[#06B6D4]/20 transition-colors cursor-pointer whitespace-nowrap">Save Changes</button>
            </div>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Internal Notes</h3>
            <textarea defaultValue={profile.internal_notes || ''} placeholder="Add internal notes..." rows={4} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#06B6D4]/50 resize-none" />
            <button className="mt-3 w-full px-4 py-2 bg-[#06B6D4]/10 text-[#06B6D4] text-sm rounded-xl hover:bg-[#06B6D4]/20 transition-colors cursor-pointer whitespace-nowrap">Save Notes</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StaffDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" />
      </div>
    }>
      <StaffDetailPageContent />
    </Suspense>
  );
}