'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from '@/components/motion';
import { useStaffDirectory, useInvitations, useStaffTeams, usePermissionSets, useTempAccess, useAccessRequests, useAccessReviews, useApprovalAuthority, useDelegations, useServiceAccounts, useSecurityEvents, useDepartments } from '@/hooks/useStaffData';
import StaffStatsCards from '@/components/admin/staff/StaffStatsCards';
import StaffOverviewTab from './StaffOverviewTab';
import { STAFF_STATUS_CONFIG, MFA_STATE_CONFIG, IDENTITY_TYPES, GLOBAL_ROLES, APPROVAL_AUTHORITY_TYPES, OFFBOARDING_CHECKLIST_ITEMS } from '@/lib/staff-definitions';
import { Search, UserPlus, MoreHorizontal, Mail, Shield, Users, Clock, Key, FileSearch, Timer, ArrowLeftRight, Bot, ShieldAlert, Settings, Building2, ChevronDown, X, Check, AlertTriangle, RefreshCw } from 'lucide-react';

const TABS = [
  { key: 'Overview', icon: Users, label: 'Overview' },
  { key: 'Directory', icon: Search, label: 'Directory' },
  { key: 'Invitations', icon: Mail, label: 'Invitations' },
  { key: 'Teams', icon: Building2, label: 'Teams' },
  { key: 'Roles', icon: Shield, label: 'Roles & Permissions' },
  { key: 'AccessRequests', icon: Key, label: 'Access Requests' },
  { key: 'Reviews', icon: FileSearch, label: 'Reviews' },
  { key: 'TempAccess', icon: Timer, label: 'Temp Access' },
  { key: 'Delegations', icon: ArrowLeftRight, label: 'Delegations' },
  { key: 'ServiceAccounts', icon: Bot, label: 'Service Accounts' },
  { key: 'Security', icon: ShieldAlert, label: 'Security Events' },
  { key: 'Settings', icon: Settings, label: 'Settings' },
];

export default function StaffHub() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { staff, loading: staffLoading } = useStaffDirectory(search || undefined);
  const { invitations, loading: invLoading } = useInvitations();
  const { teams, memberships, loading: teamLoading } = useStaffTeams();
  const { departments, loading: deptLoading } = useDepartments();
  const { sets, assignments, loading: permLoading } = usePermissionSets();
  const { grants, loading: grantLoading } = useTempAccess();
  const { requests, loading: reqLoading } = useAccessRequests();
  const { reviews, loading: reviewLoading } = useAccessReviews();
  const { authorities, loading: authLoading } = useApprovalAuthority();
  const { delegations, loading: delLoading } = useDelegations();
  const { accounts, loading: acctLoading } = useServiceAccounts();
  const { events, loading: evtLoading } = useSecurityEvents();

  const filteredStaff = statusFilter === 'all' ? staff : staff.filter((s: any) => (s.status || 'Active') === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Staff Administration</h1>
          <p className="text-sm text-slate-400 mt-0.5">Identity, teams, roles, permissions and access security</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#06B6D4] text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[#06B6D4]/20 transition-all cursor-pointer whitespace-nowrap">
            <UserPlus className="w-4 h-4" />
            Invite Staff
          </button>
        </div>
      </div>

      <StaffStatsCards />

      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-1 overflow-x-auto border-b border-[rgba(255,255,255,0.06)]">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'Overview' && (
                <StaffOverviewTab staff={staff} staffLoading={staffLoading} invitations={invitations} invLoading={invLoading} />
              )}

              {activeTab === 'Directory' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="relative flex-1 w-full max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search by name, email, reference or role..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[rgba(255,255,255,0.08)] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/20 focus:border-[#06B6D4]/40 transition-all"
                      />
                    </div>
                    <div className="flex gap-2">
                      {['all', 'Active', 'Suspended', 'Offboarded'].map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatusFilter(s)}
                          className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                            statusFilter === s
                              ? 'bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/20'
                              : 'text-slate-400 border-[rgba(255,255,255,0.08)] hover:text-white hover:border-white/20'
                          }`}
                        >
                          {s === 'all' ? 'All Status' : s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[rgba(255,255,255,0.06)]">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Staff</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Reference</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">MFA</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Login</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffLoading ? (
                          <tr><td colSpan={8} className="py-12 text-center">
                            <div className="w-6 h-6 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto" />
                          </td></tr>
                        ) : filteredStaff.length === 0 ? (
                          <tr><td colSpan={8} className="py-16 text-center">
                            <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                            <p className="text-sm text-slate-500">{search || statusFilter !== 'all' ? 'No staff match your filters' : 'No staff records found'}</p>
                          </td></tr>
                        ) : (
                          filteredStaff.map((s: any) => {
                            const status = s.status || 'Active';
                            const mfa = s.mfa_state || 'Unknown';
                            const mfaCfg = MFA_STATE_CONFIG[mfa as keyof typeof MFA_STATE_CONFIG] || MFA_STATE_CONFIG.Unknown;
                            const statusCfg = (STAFF_STATUS_CONFIG as any)[status] || STAFF_STATUS_CONFIG.Active;
                            const identityType = s.identity_type || 'internal';
                            return (
                              <tr key={`${s.source}-${s.id}`} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                                <td className="py-3.5 px-4">
                                  <Link href={`/admin/staff/${s.id}?source=${s.source}`} className="flex items-center gap-3 group cursor-pointer">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#06B6D4]/20 to-[#22D3EE]/10 flex items-center justify-center text-xs font-bold text-[#06B6D4] shrink-0">
                                      {(s.full_name || s.email || '??').slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-white group-hover:text-[#06B6D4] transition-colors">{s.full_name || s.email}</p>
                                      <p className="text-xs text-slate-500">{s.email}</p>
                                    </div>
                                  </Link>
                                </td>
                                <td className="py-3.5 px-4 text-xs font-mono text-slate-400">{s.reference || '—'}</td>
                                <td className="py-3.5 px-4">
                                  <span className="text-xs text-slate-400">{IDENTITY_TYPES[identityType as keyof typeof IDENTITY_TYPES]?.label || identityType}</span>
                                </td>
                                <td className="py-3.5 px-4 text-sm text-slate-300">{s.role || '—'}</td>
                                <td className="py-3.5 px-4">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border || 'border-transparent'}`}>
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusCfg.dot || 'currentColor' }} />
                                    {status}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${mfaCfg.bg} ${mfaCfg.color} ${mfaCfg.border || 'border-transparent'}`}>
                                    {mfaCfg.label}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-xs text-slate-500">{s.last_login_at ? new Date(s.last_login_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                                <td className="py-3.5 px-4 text-right">
                                  <Link
                                    href={`/admin/staff/${s.id}?source=${s.source}`}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#06B6D4] hover:bg-[#06B6D4]/10 rounded-lg transition-colors cursor-pointer"
                                  >
                                    View
                                  </Link>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'Invitations' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Staff Invitations</h3>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#06B6D4]/10 text-[#06B6D4] text-sm font-medium rounded-xl hover:bg-[#06B6D4]/20 transition-colors cursor-pointer whitespace-nowrap border border-[#06B6D4]/20">
                      <UserPlus className="w-4 h-4" />
                      New Invitation
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[rgba(255,255,255,0.06)]">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Proposed Role</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Sent</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Expires</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {invLoading ? (
                          <tr><td colSpan={6} className="py-12 text-center">
                            <div className="w-6 h-6 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto" />
                          </td></tr>
                        ) : invitations.length === 0 ? (
                          <tr><td colSpan={6} className="py-16 text-center">
                            <Mail className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                            <p className="text-sm text-slate-500">No invitations sent yet</p>
                          </td></tr>
                        ) : (
                          invitations.map((inv: any) => (
                            <tr key={inv.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                    <Mail className="w-4 h-4 text-blue-400" />
                                  </div>
                                  <span className="text-sm text-white">{inv.email}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-sm text-slate-300">{inv.proposed_role || '—'}</td>
                              <td className="py-3.5 px-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                                  inv.status === 'Sent' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                  inv.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                  inv.status === 'Expired' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                                  'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                }`}>
                                  <span className="w-1.5 h-1.5 rounded-full" style={{
                                    backgroundColor: inv.status === 'Sent' ? '#60A5FA' : inv.status === 'Accepted' ? '#34D399' : inv.status === 'Expired' ? '#94A3B8' : '#FBBF24'
                                  }} />
                                  {inv.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-xs text-slate-500">{inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                              <td className="py-3.5 px-4 text-xs text-slate-500">{inv.expires_at ? new Date(inv.expires_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                              <td className="py-3.5 px-4 text-right">
                                {inv.status === 'Sent' && (
                                  <button className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer">
                                    Revoke
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'Teams' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                          <Building2 className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-white">Departments</h3>
                      </div>
                      <span className="text-xs text-slate-500">{departments.length} total</span>
                    </div>
                    {deptLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
                        ))}
                      </div>
                    ) : departments.length === 0 ? (
                      <div className="text-center py-10">
                        <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">No departments defined</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {departments.map((d: any) => (
                          <div key={d.id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                              <Building2 className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white">{d.name}</p>
                              {d.description && <p className="text-xs text-slate-500 truncate">{d.description}</p>}
                            </div>
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium border ${
                              d.active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                            }`}>
                              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: d.active ? '#34D399' : '#94A3B8' }} />
                              {d.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center">
                          <Users className="w-3.5 h-3.5 text-[#06B6D4]" />
                        </div>
                        <h3 className="text-sm font-semibold text-white">Teams</h3>
                      </div>
                      <span className="text-xs text-slate-500">{teams.length} total</span>
                    </div>
                    {teamLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
                        ))}
                      </div>
                    ) : teams.length === 0 ? (
                      <div className="text-center py-10">
                        <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">No teams defined</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {teams.map((t: any) => (
                          <div key={t.id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                            <div className="w-9 h-9 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center shrink-0">
                              <Users className="w-4 h-4 text-[#06B6D4]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white">{t.name}</p>
                              <p className="text-xs text-slate-500 truncate">{t.staff_departments?.name || 'No department'}</p>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium border ${
                              t.active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                            }`}>
                              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: t.active ? '#34D399' : '#94A3B8' }} />
                              {t.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'Roles' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <Shield className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-white">Global Roles</h3>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {Object.entries(GLOBAL_ROLES).map(([key, role]: [string, any]) => (
                        <div key={key} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${role.isPrivileged ? 'bg-purple-500/10' : 'bg-slate-500/10'}`}>
                            <Shield className={`w-4 h-4 ${role.isPrivileged ? 'text-purple-400' : 'text-slate-400'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white">{role.label}</p>
                            <p className="text-xs text-slate-500 truncate">{role.description}</p>
                          </div>
                          {role.isPrivileged && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              Privileged
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center">
                          <Key className="w-3.5 h-3.5 text-[#06B6D4]" />
                        </div>
                        <h3 className="text-sm font-semibold text-white">Permission Sets</h3>
                      </div>
                      <span className="text-xs text-slate-500">{sets.length} total</span>
                    </div>
                    {permLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
                        ))}
                      </div>
                    ) : sets.length === 0 ? (
                      <div className="text-center py-10">
                        <Key className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">No permission sets defined</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {sets.map((ps: any) => (
                          <div key={ps.id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                            <div className="w-9 h-9 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center shrink-0">
                              <Key className="w-4 h-4 text-[#06B6D4]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white">{ps.name} <span className="text-[10px] text-slate-500 font-mono">v{ps.version}</span></p>
                              <p className="text-xs text-slate-500 truncate">{ps.description || `${(ps.permissions || []).length} permissions`}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'AccessRequests' && <DataTablePlaceholder title="Access Requests" loading={reqLoading} data={requests} columns={['Requester', 'Requested', 'Reason', 'Status', 'Date']} />}
              {activeTab === 'Reviews' && <DataTablePlaceholder title="Reviews" loading={reviewLoading} data={reviews} columns={['Staff', 'Scope', 'Due Date', 'Status', 'Decision']} />}
              {activeTab === 'TempAccess' && <DataTablePlaceholder title="Temporary Access Grants" loading={grantLoading} data={grants} columns={['Staff', 'Permission', 'Scope', 'Expires', 'Status']} />}
              {activeTab === 'Delegations' && <DataTablePlaceholder title="Delegations" loading={delLoading} data={delegations} columns={['Delegator', 'Delegate', 'Scope', 'Expires', 'Status']} />}
              {activeTab === 'ServiceAccounts' && <DataTablePlaceholder title="Service Accounts" loading={acctLoading} data={accounts} columns={['Name', 'Purpose', 'Environment', 'Status', 'Rotation Due']} />}

              {activeTab === 'Security' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[rgba(255,255,255,0.06)]">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Event</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Staff</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Severity</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Source</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evtLoading ? (
                        <tr><td colSpan={5} className="py-12 text-center">
                          <div className="w-6 h-6 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto" />
                        </td></tr>
                      ) : events.length === 0 ? (
                        <tr><td colSpan={5} className="py-16 text-center">
                          <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                          <p className="text-sm text-slate-500">No security events recorded</p>
                        </td></tr>
                      ) : (
                        events.map((e: any, i: number) => (
                          <tr key={i} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  e.severity === 'critical' ? 'bg-red-500/10' :
                                  e.severity === 'high' ? 'bg-orange-500/10' :
                                  'bg-slate-500/10'
                                }`}>
                                  <ShieldAlert className={`w-3.5 h-3.5 ${
                                    e.severity === 'critical' ? 'text-red-400' :
                                    e.severity === 'high' ? 'text-orange-400' :
                                    'text-slate-400'
                                  }`} />
                                </div>
                                <span className="text-sm text-white">{e.event_type || e.action || 'Unknown Event'}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-xs font-mono text-slate-400">{e.staff_id ? e.staff_id.slice(0, 8) : (e.actor_id ? e.actor_id.slice(0, 8) : '—')}</td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                                e.severity === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                e.severity === 'high' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                'bg-slate-500/10 text-slate-400 border-slate-500/20'
                              }`}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{
                                  backgroundColor: e.severity === 'critical' ? '#F87171' : e.severity === 'high' ? '#FB923C' : '#94A3B8'
                                }} />
                                {e.severity || 'info'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-500">{e.source || e.source_table || '—'}</td>
                            <td className="py-3.5 px-4 text-xs text-slate-500">{e.created_at ? new Date(e.created_at).toLocaleString() : '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'Settings' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-white">Approval Authority Types</h3>
                    </div>
                    <div className="space-y-1.5">
                      {APPROVAL_AUTHORITY_TYPES.map((type) => (
                        <div key={type} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4 text-amber-400" />
                          </div>
                          <p className="text-sm text-white capitalize">{type.replace(/_/g, ' ')}</p>
                          <span className="ml-auto text-xs text-slate-500">{authorities.filter((a: any) => a.authority_type === type).length} assigned</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/[0.02] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <FileSearch className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-white">Offboarding Checklist</h3>
                    </div>
                    <div className="space-y-1.5">
                      {OFFBOARDING_CHECKLIST_ITEMS.map((item) => (
                        <div key={item.key} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                          <div className="w-9 h-9 rounded-xl bg-slate-500/10 flex items-center justify-center shrink-0">
                            <div className="w-2.5 h-2.5 rounded-full border-2 border-slate-500" />
                          </div>
                          <p className="text-sm text-slate-300">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function DataTablePlaceholder({ title, loading, data, columns }: { title: string; loading: boolean; data: any[]; columns: string[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.06)]">
              {columns.map((col) => (
                <th key={col} className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length} className="py-12 text-center">
                <div className="w-6 h-6 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto" />
              </td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={columns.length} className="py-16 text-center">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-5 h-5 text-slate-600" />
                </div>
                <p className="text-sm text-slate-500">No records found</p>
              </td></tr>
            ) : (
              data.map((item: any, i: number) => (
                <tr key={item.id || i} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors">
                  {columns.map((col) => (
                    <td key={col} className="py-3.5 px-4 text-xs text-slate-400">{item[col.toLowerCase()] || '—'}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}