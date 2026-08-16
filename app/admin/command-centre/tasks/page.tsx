'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CommandShell from '@/components/admin/CommandShell';

export default function CommandTasksRedirect() {
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => router.replace('/admin/tasks'), 0);
  }, [router]);

  return (
    <CommandShell>
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#06B6D4]/30 border-t-[#06B6D4] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">Redirecting to new task system...</p>
        </div>
      </div>
    </CommandShell>
  );
}