import { Suspense } from 'react';
import StaffDetailPage from './StaffDetail';

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

export default async function StaffDetailWrapper({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><p className="text-slate-500">Loading...</p></div>}>
      <StaffDetailPage />
    </Suspense>
  );
}