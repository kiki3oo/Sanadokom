'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DeliveryRescueAlertNotification from '@/components/DeliveryRescueAlertNotification';
import { useLanguage } from '@/context/LanguageContext';

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { dir } = useLanguage();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return (
      <main dir={dir} className="min-h-screen bg-gradient-to-br from-[#0B0F19] via-[#090D16] to-[#0D1527] text-white">
        {children}
      </main>
    );
  }

  return (
    <div dir={dir} className="flex min-h-screen bg-slate-50 text-slate-900 selection:bg-slate-900 selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-7 overflow-y-auto bg-gradient-to-b from-slate-50 via-slate-50/70 to-slate-100/50">
          <div className="max-w-[1700px] mx-auto w-full">
            {children}
          </div>
        </main>
        <DeliveryRescueAlertNotification />
      </div>
    </div>
  );
}
