'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ADMIN_ROLE_LABELS, type AdminRoleKey, normaliseAdminRole, isPrivilegedAdminRole } from '@/lib/admin-roles';

export function useStaffMetrics() {
  const [data, setData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [
        { count: activeStaff },
        { count: pendingInvites },
        { count: pendingActivation },
        { count: suspended },
        { count: privileged },
        { count: expiringTemp },
        { count: reviewsDue },
      ] = await Promise.all([
        supabase.from('admin_profiles').select('*', { count: 'exact', head: true }).eq('active', true),
        supabase.from('staff_invitations').select('*', { count: 'exact', head: true }).eq('status', 'Sent'),
        supabase.from('admin_profiles').select('*', { count: 'exact', head: true }).eq('status', 'Pending Activation'),
        supabase.from('admin_profiles').select('*', { count: 'exact', head: true }).eq('status', 'Suspended'),
        supabase.from('admin_profiles').select('*', { count: 'exact', head: true }).in('role', ['owner', 'super_admin']).eq('active', true),
        supabase.from('staff_temp_access').select('*', { count: 'exact', head: true }).eq('status', 'Active').lte('expires_at', new Date(Date.now() + 7 * 86400000).toISOString()),
        supabase.from('staff_access_reviews').select('*', { count: 'exact', head: true }).eq('status', 'Pending').lte('due_date', new Date().toISOString().split('T')[0]),
      ]);
      if (cancelled) return;
      setData({
        activeStaff: activeStaff ?? 0,
        pendingInvites: pendingInvites ?? 0,
        pendingActivation: pendingActivation ?? 0,
        suspended: suspended ?? 0,
        privileged: privileged ?? 0,
        expiringTemp: expiringTemp ?? 0,
        reviewsDue: reviewsDue ?? 0,
      });
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { data, loading };
}

export function useStaffDirectory(search?: string) {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data: admins } = await supabase.from('admin_profiles').select('*').order('full_name');
      const { data: staffP } = await supabase.from('staff_profiles').select('*').order('full_name');
      if (cancelled) return;
      const combined = [
        ...(admins || []).map((a: any) => ({ ...a, source: 'admin_profiles', identity_type: a.identity_type || 'internal' })),
        ...(staffP || []).map((s: any) => ({ ...s, source: 'staff_profiles', identity_type: s.identity_type || 'contractor' })),
      ];
      if (search) {
        const q = search.toLowerCase();
        setStaff(combined.filter((s: any) =>
          (s.full_name || '').toLowerCase().includes(q) ||
          (s.email || '').toLowerCase().includes(q) ||
          (s.reference || '').toLowerCase().includes(q) ||
          (s.role || '').toLowerCase().includes(q)
        ));
      } else {
        setStaff(combined);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [search]);

  return { staff, loading };
}

export function useStaffDetail(staffId: string, source: string) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const table = source === 'staff_profiles' ? 'staff_profiles' : 'admin_profiles';
      const { data } = await supabase.from(table).select('*').eq('id', staffId).maybeSingle();
      if (cancelled) return;
      setProfile(data ? { ...data, source: table } : null);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [staffId, source]);

  return { profile, loading };
}

export function useStaffTeams(staffId?: string) {
  const [teams, setTeams] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data: allTeams } = await supabase.from('staff_teams').select('*, staff_departments(name)').order('name');
      const membershipQuery = supabase.from('staff_team_members').select('*');
      if (staffId) membershipQuery.eq('staff_id', staffId);
      const { data: allMembers } = await membershipQuery;
      if (cancelled) return;
      setTeams(allTeams || []);
      setMemberships(allMembers || []);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [staffId]);

  return { teams, memberships, loading };
}

export function useDepartments() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await supabase.from('staff_departments').select('*').order('name');
      if (cancelled) return;
      setDepartments(data || []);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { departments, loading };
}

export function useInvitations() {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await supabase.from('staff_invitations').select('*').order('created_at', { ascending: false });
      if (cancelled) return;
      setInvitations(data || []);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { invitations, loading };
}

export function usePermissionSets() {
  const [sets, setSets] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [setsRes, assignRes] = await Promise.all([
        supabase.from('staff_permission_sets').select('*').order('name'),
        supabase.from('staff_permission_set_assignments').select('*'),
      ]);
      if (cancelled) return;
      setSets(setsRes.data || []);
      setAssignments(assignRes.data || []);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { sets, assignments, loading };
}

export function useTempAccess() {
  const [grants, setGrants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await supabase.from('staff_temp_access').select('*').order('expires_at');
      if (cancelled) return;
      setGrants(data || []);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { grants, loading };
}

export function useAccessRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await supabase.from('staff_access_requests').select('*').order('created_at', { ascending: false });
      if (cancelled) return;
      setRequests(data || []);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { requests, loading };
}

export function useAccessReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await supabase.from('staff_access_reviews').select('*').order('due_date');
      if (cancelled) return;
      setReviews(data || []);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { reviews, loading };
}

export function useApprovalAuthority(staffId?: string) {
  const [authorities, setAuthorities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      let query = supabase.from('staff_approval_authority').select('*');
      if (staffId) query = query.eq('staff_id', staffId);
      const { data } = await query.order('authority_type');
      if (cancelled) return;
      setAuthorities(data || []);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [staffId]);

  return { authorities, loading };
}

export function useDelegations() {
  const [delegations, setDelegations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await supabase.from('staff_delegations').select('*').order('created_at', { ascending: false });
      if (cancelled) return;
      setDelegations(data || []);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { delegations, loading };
}

export function useServiceAccounts() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await supabase.from('staff_service_accounts').select('*').order('name');
      if (cancelled) return;
      setAccounts(data || []);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { accounts, loading };
}

export function useSecurityEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data: staffEvents } = await supabase.from('staff_security_events').select('*').order('created_at', { ascending: false }).limit(50);
      const { data: auditEvents } = await supabase.from('admin_security_audit_log').select('*').order('created_at', { ascending: false }).limit(50);
      if (cancelled) return;
      setEvents([
        ...(staffEvents || []).map((e: any) => ({ ...e, source_table: 'staff_security_events' })),
        ...(auditEvents || []).map((e: any) => ({ ...e, source_table: 'admin_security_audit_log', event_type: e.action })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 50));
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { events, loading };
}