'use client';

import dynamic from 'next/dynamic';

const BusinessCommandCentreWorkspace = dynamic(
  () => import('./BusinessCommandCentreWorkspace'),
  {
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-[#060a14]">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          Loading Northstar Business OS…
        </div>
      </div>
    ),
  },
);

export default function BusinessCommandCentreClient() {
  return <BusinessCommandCentreWorkspace />;
}