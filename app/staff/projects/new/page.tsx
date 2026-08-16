import { Suspense } from 'react';
import StaffShell from '../../../../components/staff/StaffShell';
import NewProjectClient from './NewProjectClient';

export default function NewProjectPage() {
  return (
    <Suspense fallback={
      <StaffShell>
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#1E293B] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-white/5 rounded w-40" />
              <div className="h-4 bg-white/5 rounded w-64" />
              <div className="h-64 bg-white/5 rounded-xl mt-6" />
            </div>
          </div>
        </div>
      </StaffShell>
    }>
      <NewProjectClient />
    </Suspense>
  );
}