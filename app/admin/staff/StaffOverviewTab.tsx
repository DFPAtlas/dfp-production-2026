'use client';

import Link from 'next/link';
import { STAFF_STATUS_CONFIG } from '@/lib/staff-definitions';
import { Shield, Mail, UserPlus, Clock, AlertTriangle, Users } from 'lucide-react';

interface StaffOverviewTabProps {
  staff: any[];
  staffLoading: boolean;
  invitations: any[];
  invLoading: boolean;
}

export default function StaffOverviewTab({ staff, staffLoading, invitations, invLoading }: StaffOverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-[#06B6D4]" />
            </div>
            <h3 className="text-sm font-semibold text-white">Recent Staff</h3>
          </div>
          <Link href="/admin/staff?tab=Directory" className="text-xs text-[#06B6D4] hover:text-[#22D3EE] transition-colors cursor-pointer whitespace-nowrap">
            View all
          </Link>
        </div>
        <div className="p-3">
          {staffLoading ? (
            <div className="space-y-3 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-white/5" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-32 bg-white/5 rounded" />
                    <div className="h-2 w-20 bg-white/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : staff.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No staff records found</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {staff.slice(0, 8).map((s: any) => {
                const status = s.status || 'Active';
                const statusCfg = (STAFF_STATUS_CONFIG as any)[status] || STAFF_STATUS_CONFIG.Active;
                return (
                  <Link
                    key={`${s.source}-${s.id}`}
                    href={`/admin/staff/${s.id}?source=${s.source}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#06B6D4]/20 to-[#22D3EE]/10 flex items-center justify-center text-xs font-bold text-[#06B6D4] shrink-0">
                      {(s.full_name || s.email || '??').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white group-hover:text-[#06B6D4] transition-colors truncate">{s.full_name || s.email}</p>
                      <p className="text-xs text-slate-500 truncate">{s.role || 'No role'} {s.department ? `· ${s.department}` : ''}</p>
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium border shrink-0 ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border || 'border-transparent'}`}>
                      {status}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Mail className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <h3 className="text-sm font-semibold text-white">Recent Invitations</h3>
          </div>
          <Link href="/admin/staff?tab=Invitations" className="text-xs text-[#06B6D4] hover:text-[#22D3EE] transition-colors cursor-pointer whitespace-nowrap">
            View all
          </Link>
        </div>
        <div className="p-3">
          {invLoading ? (
            <div className="space-y-3 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-white/5" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-32 bg-white/5 rounded" />
                    <div className="h-2 w-20 bg-white/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-10">
              <Mail className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No invitations yet</p>
              <Link href="/admin/staff?tab=Invitations" className="inline-block mt-3 text-xs text-[#06B6D4] hover:underline cursor-pointer">
                Send an invitation
              </Link>
            </div>
          ) : (
            <div className="space-y-0.5">
              {invitations.slice(0, 8).map((inv: any) => (
                <div key={inv.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors">
                  <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{inv.email}</p>
                    <p className="text-xs text-slate-500">{inv.proposed_role || 'No role'}</p>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium border shrink-0 ${
                    inv.status === 'Sent' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    inv.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    inv.status === 'Expired' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {inv.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-3 bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <h3 className="text-sm font-semibold text-white">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/[0.02] border border-[rgba(255,255,255,0.05)] hover:border-[#06B6D4]/30 hover:bg-[#06B6D4]/5 transition-all cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center group-hover:bg-[#06B6D4]/20 transition-colors">
              <UserPlus className="w-5 h-5 text-[#06B6D4]" />
            </div>
            <span className="text-xs text-slate-400 group-hover:text-white transition-colors whitespace-nowrap">Invite Staff</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/[0.02] border border-[rgba(255,255,255,0.05)] hover:border-purple-500/30 hover:bg-purple-500/5 transition-all cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-xs text-slate-400 group-hover:text-white transition-colors whitespace-nowrap">Manage Roles</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/[0.02] border border-[rgba(255,255,255,0.05)] hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xs text-slate-400 group-hover:text-white transition-colors whitespace-nowrap">Review Access</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/[0.02] border border-[rgba(255,255,255,0.05)] hover:border-red-500/30 hover:bg-red-500/5 transition-all cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-xs text-slate-400 group-hover:text-white transition-colors whitespace-nowrap">Security Log</span>
          </button>
        </div>
      </div>
    </div>
  );
}