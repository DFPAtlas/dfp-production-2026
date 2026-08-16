'use client';

import { useState, useEffect } from 'react';
import { motion } from '@/components/motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { DollarSign, Clock, CheckCircle } from 'lucide-react';
import { useUATTester } from '@/components/uat/UATTesterProvider';
import UATPortalBreadcrumbs from '@/components/uat/portal/UATPortalBreadcrumbs';
import UATStatusBadge from '@/components/uat/portal/UATStatusBadge';
import UATEmptyState from '@/components/uat/portal/UATEmptyState';

interface Payment {
  id: string; assignment_id: string; tester_id: string; job_id: string;
  base_amount: number; bonus_amount: number; total_amount: number;
  status: string; payment_method: string | null; payment_reference: string | null;
  paid_at: string | null; admin_notes: string | null; created_at: string;
  job_title?: string; project_name?: string; assignment_status?: string;
}

const statusColors: Record<string, string> = {
  unpaid: 'bg-slate-100 text-slate-600',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-cyan-100 text-cyan-700',
  paid: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
};

export default function TesterPaymentsPage() {
  const router = useRouter();
  const { tester } = useUATTester();
  const testerId = tester.id;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [testerId]);

  const loadData = async () => {
    const { data: payData } = await supabase.from('uat_payments').select('*').eq('tester_id', testerId).order('created_at', { ascending: false });

    if (payData && payData.length > 0) {
      const jobIds = [...new Set(payData.map((p: any) => p.job_id))];
      const assignmentIds = [...new Set(payData.map((p: any) => p.assignment_id))];

      const [{ data: jobs }, { data: assignments }] = await Promise.all([
        supabase.from('uat_jobs').select('id, title, project_id').in('id', jobIds),
        supabase.from('uat_assignments').select('id, status').in('id', assignmentIds),
      ]);

      const jobMap: Record<string, any> = {};
      jobs?.forEach((j: any) => { jobMap[j.id] = j; });
      const assignMap: Record<string, string> = {};
      assignments?.forEach((a: any) => { assignMap[a.id] = a.status; });

      const projectIds = [...new Set(jobs?.map((j: any) => j.project_id).filter(Boolean) || [])];
      const projectMap: Record<string, string> = {};
      if (projectIds.length > 0) {
        const { data: projects } = await supabase.from('uat_projects').select('id, name').in('id', projectIds);
        projects?.forEach((p: any) => { projectMap[p.id] = p.name; });
      }

      const merged = payData.map((p: any) => ({
        ...p,
        job_title: jobMap[p.job_id]?.title || 'Unknown',
        project_name: projectMap[jobMap[p.job_id]?.project_id] || null,
        assignment_status: assignMap[p.assignment_id] || null,
      }));
      setPayments(merged);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 border-[3px] border-[#2878d0]/20 border-t-[#2878d0] rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading payments...</p>
      </div>
    );
  }

  const totalEarned = payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.total_amount, 0);
  const totalPending = payments.filter((p) => ['unpaid', 'pending', 'approved'].includes(p.status)).reduce((sum, p) => sum + p.total_amount, 0);

  return (
    <>
      <UATPortalBreadcrumbs items={[{ label: 'Payments' }]} />
      <div className="mt-4">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#789265]">Earnings</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight sm:text-5xl text-[#17325c]">My Payments</h1>
        <p className="mt-2 text-slate-500">Track your UAT testing earnings</p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-xs text-slate-400">Total Earned</span>
          </div>
          <p className="text-3xl font-bold text-[#17325c]">£{totalEarned.toFixed(2)}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-xs text-slate-400">Pending</span>
          </div>
          <p className="text-3xl font-bold text-[#17325c]">£{totalPending.toFixed(2)}</p>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <UATEmptyState icon={DollarSign} title="No Payments Yet" description="Complete test assignments to start earning." />
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {p.project_name && (
                      <span className="text-xs font-medium text-[#2878d0] bg-[#edf5ff] px-2 py-0.5 rounded-lg">{p.project_name}</span>
                    )}
                    <UATStatusBadge status={p.status} colorMap={statusColors} />
                  </div>
                  <h3 className="text-base font-bold text-[#17325c]">{p.job_title}</h3>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#17325c]">£{p.total_amount}</p>
                  <p className="text-xs text-slate-400">Base: £{p.base_amount}{p.bonus_amount > 0 ? ` + £${p.bonus_amount} bonus` : ''}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                {p.assignment_status && <span>Assignment: {p.assignment_status}</span>}
                {p.paid_at && <span>Paid: {new Date(p.paid_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </>
  );
}