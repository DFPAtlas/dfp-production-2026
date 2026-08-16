'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminShell from '../../../../components/admin/AdminShell';
import PaymentApprovalQueue from '../../../../components/admin/uat/PaymentApprovalQueue';
import PaymentDisputesList from '../../../../components/admin/uat/PaymentDisputesList';

function PaymentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [tab, setTab] = useState<'approvals' | 'disputes'>(tabParam === 'disputes' ? 'disputes' : 'approvals');

  useEffect(() => {
    if (tabParam === 'disputes') setTab('disputes');
    else if (tabParam === 'approvals' || !tabParam) setTab('approvals');
  }, [tabParam]);

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">UAT Payments</h1>
            <p className="text-sm text-slate-400 mt-0.5">Payment approval, finance handoff, and dispute management</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTab('approvals')}
              className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap transition-colors ${tab === 'approvals' ? 'bg-[#06B6D4] text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
              Payment Approvals
            </button>
            <button onClick={() => setTab('disputes')}
              className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap transition-colors ${tab === 'disputes' ? 'bg-[#06B6D4] text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
              Disputes
            </button>
          </div>
        </div>

        {tab === 'approvals' && <PaymentApprovalQueue />}
        {tab === 'disputes' && <PaymentDisputesList />}
      </div>
    </AdminShell>
  );
}

import { Suspense } from 'react';
export default function AdminPaymentsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin" /></div>}>
      <PaymentsPageContent />
    </Suspense>
  );
}