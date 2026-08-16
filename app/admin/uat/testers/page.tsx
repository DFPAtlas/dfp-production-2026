'use client';

import { useRouter } from 'next/navigation';
import AdminShell from '../../../../components/admin/AdminShell';
import TesterOverviewCards from '../../../../components/admin/uat/TesterOverviewCards';
import TestersTable from '../../../../components/admin/uat/TestersTable';
import { UserPlus } from 'lucide-react';

export default function AdminUATTestersPage() {
  const router = useRouter();

  const handleFilterClick = (filter: string) => {
    if (filter === 'status:active') router.push('/admin/uat/testers?status=active');
    else if (filter.startsWith('availability:')) router.push('/admin/uat/testers?availability=available');
    else if (filter.startsWith('onboarding:')) router.push('/admin/uat/testers?onboarding=under_review');
    else if (filter.startsWith('assignments:')) router.push('/admin/uat/assignments');
    else if (filter.startsWith('status:')) router.push('/admin/uat/testers?status=restricted');
    else if (filter.startsWith('payments:')) router.push('/admin/uat/payments');
    else if (filter.startsWith('disputes:')) router.push('/admin/uat/payments?tab=disputes');
    else if (filter.startsWith('capacity:')) router.push('/admin/uat/testers');
  };

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">UAT Testers</h1>
            <p className="text-sm text-slate-400 mt-0.5">Tester profiles, performance, payments, and workforce management</p>
          </div>
          <button onClick={() => router.push('/admin/uat/testers/new')}
            className="px-4 py-2.5 bg-[#06B6D4] hover:bg-[#0891B2] rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap flex items-center gap-2 transition-colors">
            <UserPlus className="w-4 h-4" /> Add Tester
          </button>
        </div>

        <TesterOverviewCards onFilterClick={handleFilterClick} />
        <TestersTable />
      </div>
    </AdminShell>
  );
}