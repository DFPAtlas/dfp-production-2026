'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface WorkforceMetrics {
  activeTesters: number;
  availableTesters: number;
  applicantsAwaitingReview: number;
  activeAssignments: number;
  capacityReached: number;
  restrictedTesters: number;
  paymentsAwaitingApproval: number;
  paymentFailures: number;
  paymentDisputes: number;
  loading: boolean;
}

export function useWorkforceMetrics(): WorkforceMetrics {
  const [metrics, setMetrics] = useState<WorkforceMetrics>({
    activeTesters: 0, availableTesters: 0, applicantsAwaitingReview: 0,
    activeAssignments: 0, capacityReached: 0, restrictedTesters: 0,
    paymentsAwaitingApproval: 0, paymentFailures: 0, paymentDisputes: 0,
    loading: true,
  });

  const fetch = useCallback(async () => {
    const [
      { count: activeTesters },
      { count: applicantsReview },
      { count: activeAssignments },
      { count: restrictedTesters },
      { count: paymentsApproval },
      { count: paymentFailures },
      { count: disputes },
      { data: testers },
    ] = await Promise.all([
      supabase.from('uat_testers').select('*', { count: 'exact', head: true }).in('status', ['active', 'temporarily_unavailable']),
      supabase.from('uat_testers').select('*', { count: 'exact', head: true }).eq('onboarding_status', 'under_review'),
      supabase.from('uat_assignments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('uat_testers').select('*', { count: 'exact', head: true }).in('status', ['restricted', 'suspended']),
      supabase.from('uat_payments').select('*', { count: 'exact', head: true }).in('eligibility_state', ['draft', 'awaiting_review', 'changes_required', 'approved']),
      supabase.from('uat_payments').select('*', { count: 'exact', head: true }).eq('eligibility_state', 'failed'),
      supabase.from('uat_payment_disputes').select('*', { count: 'exact', head: true }).in('status', ['open', 'under_review']),
      supabase.from('uat_testers').select('id, max_concurrent_assignments, current_active_assignments').in('status', ['active']),
    ]);

    const capacityReached = (testers || []).filter(
      (t: any) => t.current_active_assignments >= t.max_concurrent_assignments
    ).length;

    const { count: availableTesters } = await supabase
      .from('uat_tester_availability')
      .select('*', { count: 'exact', head: true })
      .eq('availability_state', 'available');

    setMetrics({
      activeTesters: activeTesters || 0,
      availableTesters: availableTesters || 0,
      applicantsAwaitingReview: applicantsReview || 0,
      activeAssignments: activeAssignments || 0,
      capacityReached,
      restrictedTesters: restrictedTesters || 0,
      paymentsAwaitingApproval: paymentsApproval || 0,
      paymentFailures: paymentFailures || 0,
      paymentDisputes: disputes || 0,
      loading: false,
    });
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return metrics;
}

export function useTesters(filters?: { status?: string; onboarding_status?: string; search?: string }) {
  const [testers, setTesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    let q = supabase.from('uat_testers').select('*').order('created_at', { ascending: false });
    if (filters?.status) q = q.eq('status', filters.status);
    if (filters?.onboarding_status) q = q.eq('onboarding_status', filters.onboarding_status);
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      q = q.or(`full_name.ilike.%${s}%,email.ilike.%${s}%`);
    }
    const { data } = await q;
    setTesters(data || []);
    setLoading(false);
  }, [filters?.status, filters?.onboarding_status, filters?.search]);

  useEffect(() => { fetch(); }, [fetch]);

  return { testers, loading, refetch: fetch };
}

export function useTesterDetail(testerId: string) {
  const [tester, setTester] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [capabilities, setCapabilities] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [entitlements, setEntitlements] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!testerId) return;
    const [
      { data: t },
      { data: d },
      { data: c },
      { data: a },
      { data: ag },
      { data: w },
      { data: r },
      { data: asgn },
      { data: ent },
      { data: disp },
    ] = await Promise.all([
      supabase.from('uat_testers').select('*').eq('id', testerId).maybeSingle(),
      supabase.from('uat_tester_devices').select('*').eq('tester_id', testerId).order('created_at'),
      supabase.from('uat_tester_capabilities').select('*').eq('tester_id', testerId).order('capability_type'),
      supabase.from('uat_tester_availability').select('*').eq('tester_id', testerId).order('created_at'),
      supabase.from('uat_tester_agreements').select('*').eq('tester_id', testerId).order('created_at', { ascending: false }),
      supabase.from('uat_tester_warnings').select('*').eq('tester_id', testerId).order('created_at', { ascending: false }),
      supabase.from('uat_tester_ratings').select('*').eq('tester_id', testerId).order('created_at', { ascending: false }),
      supabase.from('uat_assignments').select('*, uat_jobs:job_id(title)').eq('tester_id', testerId).order('created_at', { ascending: false }),
      supabase.from('uat_payment_entitlements').select('*').eq('tester_id', testerId).order('created_at', { ascending: false }),
      supabase.from('uat_payment_disputes').select('*').eq('tester_id', testerId).order('created_at', { ascending: false }),
    ]);

    setTester(t || null);
    setDevices(d || []);
    setCapabilities(c || []);
    setAvailability(a || []);
    setAgreements(ag || []);
    setWarnings(w || []);
    setRatings(r || []);
    setAssignments(asgn?.map((a: any) => ({ ...a, job_title: a.uat_jobs?.title || '' })) || []);
    setEntitlements(ent || []);
    setDisputes(disp || []);
    setLoading(false);
  }, [testerId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { tester, devices, capabilities, availability, agreements, warnings, ratings, assignments, entitlements, disputes, loading, refetch: fetch };
}

export function usePaymentApprovals(filters?: { status?: string }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data: payData } = await supabase.from('uat_payments').select('*').order('created_at', { ascending: false });
    if (!payData) { setLoading(false); return; }

    const testerIds = [...new Set(payData.map((p: any) => p.tester_id))];
    const jobIds = [...new Set(payData.map((p: any) => p.job_id))];
    const assignIds = [...new Set(payData.map((p: any) => p.assignment_id))];

    const [{ data: testers }, { data: jobs }, { data: assigns }] = await Promise.all([
      supabase.from('uat_testers').select('id, full_name, email, reference').in('id', testerIds),
      supabase.from('uat_jobs').select('id, title, project_id').in('id', jobIds),
      supabase.from('uat_assignments').select('id, status').in('id', assignIds),
    ]);

    const testerMap: Record<string, any> = {};
    testers?.forEach((t: any) => { testerMap[t.id] = t; });
    const jobMap: Record<string, any> = {};
    jobs?.forEach((j: any) => { jobMap[j.id] = j; });
    const assignMap: Record<string, string> = {};
    assigns?.forEach((a: any) => { assignMap[a.id] = a.status; });

    let merged = payData.map((p: any) => ({
      ...p,
      tester_name: testerMap[p.tester_id]?.full_name || 'Unknown',
      tester_email: testerMap[p.tester_id]?.email || '',
      tester_reference: testerMap[p.tester_id]?.reference || '',
      job_title: jobMap[p.job_id]?.title || 'Unknown',
      assignment_status: assignMap[p.assignment_id] || '',
    }));

    if (filters?.status) merged = merged.filter((p: any) => p.eligibility_state === filters.status);

    setPayments(merged);
    setLoading(false);
  }, [filters?.status]);

  useEffect(() => { fetch(); }, [fetch]);

  return { payments, loading, refetch: fetch };
}

export function useDisputes(filters?: { status?: string }) {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data: dispData } = await supabase.from('uat_payment_disputes').select('*').order('created_at', { ascending: false });
    if (!dispData) { setLoading(false); return; }

    const testerIds = [...new Set(dispData.map((d: any) => d.tester_id))];
    const { data: testers } = await supabase.from('uat_testers').select('id, full_name, email, reference').in('id', testerIds);
    const testerMap: Record<string, any> = {};
    testers?.forEach((t: any) => { testerMap[t.id] = t; });

    let merged = dispData.map((d: any) => ({
      ...d,
      tester_name: testerMap[d.tester_id]?.full_name || 'Unknown',
      tester_email: testerMap[d.tester_id]?.email || '',
      tester_reference: testerMap[d.tester_id]?.reference || '',
    }));

    if (filters?.status) merged = merged.filter((d: any) => d.status === filters.status);

    setDisputes(merged);
    setLoading(false);
  }, [filters?.status]);

  useEffect(() => { fetch(); }, [fetch]);

  return { disputes, loading, refetch: fetch };
}