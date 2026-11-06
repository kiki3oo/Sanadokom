'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DeliveryRescueAlertNotification from '@/components/DeliveryRescueAlertNotification';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { Crown } from 'lucide-react';

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { dir } = useLanguage();
  const { currentUser, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLoginPage = pathname === '/login';

  // Automatically close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Client-side authentication guard
  useEffect(() => {
    if (!isLoading && !currentUser && !isLoginPage) {
      const loginUrl = pathname && pathname !== '/' ? `/login?from=${encodeURIComponent(pathname)}` : '/login';
      router.replace(loginUrl);
    }
  }, [isLoading, currentUser, isLoginPage, pathname, router]);

  if (isLoginPage) {
    return (
      <main dir={dir} className="min-h-screen bg-gradient-to-br from-[#0B0F19] via-[#090D16] to-[#0D1527] text-white">
        {children}
      </main>
    );
  }

  // Loading splash state while verifying session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070A12] flex flex-col items-center justify-center text-white select-none">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-black shadow-xl shadow-amber-500/20 mb-4 animate-pulse">
          <Crown className="w-7 h-7 fill-slate-950" />
        </div>
        <div className="text-sm font-black tracking-tight text-white font-heading">SANADOKOM • سندكم</div>
        <div className="text-xs text-slate-400 mt-2 font-medium flex items-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span>Vérification de la session...</span>
        </div>
      </div>
    );
  }

  // If not authenticated and not on login page, do not render layout while redirecting
  if (!currentUser) {
    return null;
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
