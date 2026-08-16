'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import UATPortalHeader from './UATPortalHeader';
import UATPortalSidebar from './UATPortalSidebar';
import UATMobileNavigation from './UATMobileNavigation';

export default function UATPortalShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <UATPortalHeader
        onMenuClick={() => setMobileMenuOpen(true)}
        showMobileMenu={true}
      />

      <UATMobileNavigation
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex min-h-[calc(100vh-5rem)]">
        <UATPortalSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main className="min-w-0 flex-1 p-5 sm:p-7 lg:p-9">
          <div className="mx-auto max-w-[1500px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}