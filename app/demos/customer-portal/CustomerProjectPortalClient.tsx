'use client';

import dynamic from 'next/dynamic';

const CustomerProjectPortalWorkspace = dynamic(
  () => import('./CustomerProjectPortalWorkspace'),
  {
    loading: () => (
      <main className="flex h-screen flex-col items-center justify-center bg-[#f6f5f2]">
        <div className="mx-auto max-w-md animate-pulse rounded-2xl border border-[#e8e5df] bg-white p-8 text-sm text-[#8a8a8a]">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#3b82f6]"></span>
            Loading Customer Portal demo...
          </div>
        </div>
      </main>
    ),
  },
);

export default function CustomerProjectPortalClient() {
  return <CustomerProjectPortalWorkspace />;
}