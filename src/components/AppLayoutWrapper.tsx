'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DeliveryRescueAlertNotification from '@/components/DeliveryRescueAlertNotification';
import { useLanguage } from '@/context/LanguageContext';

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { dir } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLoginPage = pathname === '/login';

  // Automatically close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (isLoginPage) {
    return (
      <main dir={dir} className="min-h-screen bg-gradient-to-br from-[#0B0F19] via-[#090D16] to-[#0D1527] text-white">
        {children}
      </main>
    );
  }

  return (
    <div dir={dir} className="flex min-h-screen bg-slate-50 text-slate-900 selection:bg-slate-900 selection:text-white overflow-x-hidden">
      <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
        <Header onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <main className="flex-1 p-3 sm:p-5 lg:p-7 overflow-y-auto overflow-x-hidden bg-gradient-to-b from-slate-50 via-slate-50/70 to-slate-100/50">
          <div className="max-w-[1700px] mx-auto w-full">
            {children}
          </div>
        </main>
        <DeliveryRescueAlertNotification />
      </div>
    </div>
  );
}
