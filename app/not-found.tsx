'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NotFound() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const isStaffRoute = pathname?.startsWith('/staff');
  const isPortalRoute = pathname?.startsWith('/portal');
  const isUatRoute = pathname?.startsWith('/uat');
  const isProtected = isAdminRoute || isStaffRoute || isPortalRoute || isUatRoute;

  if (isProtected) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center px-4 bg-[#0F172A]">
        <h1 className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-[#06B6D4] to-[#22D3EE] bg-clip-text text-transparent mb-4">404</h1>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Page Not Found</h2>
        <p className="text-lg text-slate-400 mb-2">This page does not exist or you may not have access.</p>
        <p className="text-sm text-slate-500 mb-8">
          {isAdminRoute && 'Return to the admin area.'}
          {isStaffRoute && 'Return to the staff area.'}
          {isPortalRoute && 'Return to the client portal.'}
          {isUatRoute && 'Return to the UAT area.'}
        </p>
        <div className="flex gap-3">
          {isAdminRoute && (
            <Link href="/admin" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-[#06B6D4] hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
              <i className="ri-dashboard-line w-4 h-4 flex items-center justify-center" />
              Admin Dashboard
            </Link>
          )}
          {isStaffRoute && (
            <Link href="/staff/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-[#06B6D4] hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
              <i className="ri-dashboard-line w-4 h-4 flex items-center justify-center" />
              Staff Dashboard
            </Link>
          )}
          {isPortalRoute && (
            <Link href="/portal/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-[#06B6D4] hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
              <i className="ri-dashboard-line w-4 h-4 flex items-center justify-center" />
              Portal Dashboard
            </Link>
          )}
          {isUatRoute && (
            <Link href="/uat/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-[#06B6D4] hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
              <i className="ri-dashboard-line w-4 h-4 flex items-center justify-center" />
              UAT Dashboard
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center px-4 bg-white">
      <h1 className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-[#06B6D4] to-[#22D3EE] bg-clip-text text-transparent mb-4">404</h1>
      <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">Page Not Found</h2>
      <p className="text-lg text-slate-500 mb-8">The page you are looking for does not exist or has been moved.</p>
      <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-[#06B6D4] hover:bg-[#0891B2] transition-all cursor-pointer whitespace-nowrap">
        <i className="ri-arrow-left-line w-4 h-4 flex items-center justify-center" />
        Back to Home
      </Link>
    </div>
  );
}