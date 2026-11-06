'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  LayoutDashboard,
  PhoneCall,
  PackageCheck,
  Boxes,
  Receipt,
  Network,
  Zap,
  TrendingUp,
  Users,
  ShieldCheck,
  Lock,
  Trophy,
  History,
  Clock,
  BarChart3,
  Headphones,
  Bot,
  Compass,
  Truck,
  Wallet,
  Sparkles,
  Building2,
  Crown,
  Radio,
  X,
} from 'lucide-react';

interface NavItem {
  transKey: string;
  fallback: string;
  href: string;
  icon: any;
  badge?: string;
}

interface NavGroup {
  id: string;
  titleKey: string;
  fallbackTitle: string;
  groupIcon: any;
  dotGlow: string;
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    id: 'overview',
    titleKey: 'nav.group.overview',
    fallbackTitle: 'Vue d\'ensemble',
    groupIcon: Compass,
    dotGlow: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)]',
    iconBg: 'bg-amber-500/15',
    iconBorder: 'border-amber-400/30',
    iconColor: 'text-amber-400',
    items: [
      { transKey: 'nav.dashboard', fallback: 'Tableau de Bord', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    id: 'callCenter',
    titleKey: 'nav.group.callCenter',
    fallbackTitle: 'Centre d\'Appel & Ventes',
    groupIcon: Headphones,
    dotGlow: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]',
    iconBg: 'bg-emerald-500/15',
    iconBorder: 'border-emerald-400/30',
    iconColor: 'text-emerald-400',
    items: [
      { transKey: 'nav.callCenter', fallback: 'Centre d\'Appel (Live)', href: '/call-center', icon: PhoneCall, badge: 'Live' },
      { transKey: 'nav.confirmation', fallback: 'Performance Confirmations', href: '/confirmation', icon: BarChart3, badge: 'KPIs' },
      { transKey: 'nav.whatsappBot', fallback: 'WhatsApp Auto-Bot 🤖', href: '/whatsapp-bot', icon: Bot, badge: 'Auto' },
      { transKey: 'nav.leaderboard', fallback: 'Challenge & Classement 🏆', href: '/leaderboard', icon: Trophy, badge: 'Prime' },
      { transKey: 'nav.productivity', fallback: 'Productivité & Temps ⏱️', href: '/productivity', icon: Clock, badge: 'Temps' },
    ],
  },
  {
    id: 'logistics',
    titleKey: 'nav.group.logistics',
    fallbackTitle: 'Commandes & Livraison',
    groupIcon: Truck,
    dotGlow: 'bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.9)]',
    iconBg: 'bg-sky-500/15',
    iconBorder: 'border-sky-400/30',
    iconColor: 'text-sky-400',
    items: [
      { transKey: 'nav.orders', fallback: 'Commandes & Suivi Colis', href: '/orders', icon: PackageCheck },
      { transKey: 'nav.reclamations', fallback: 'Réclamations & SAV', href: '/reclamations', icon: Headphones, badge: 'SAV' },
      { transKey: 'nav.stock', fallback: 'Gestion du Stock 360°', href: '/stock', icon: Boxes },
      { transKey: 'nav.suppliers', fallback: 'Fournisseurs & Achats', href: '/suppliers', icon: Building2, badge: 'Stock' },
    ],
  },
  {
    id: 'finance',
    titleKey: 'nav.group.finance',
    fallbackTitle: 'Finance & Calcul de Profit',
    groupIcon: Wallet,
    dotGlow: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]',
    iconBg: 'bg-emerald-500/15',
    iconBorder: 'border-emerald-400/30',
    iconColor: 'text-emerald-400',
    items: [
      { transKey: 'nav.reports', fallback: 'Rapports & Bilan P&L', href: '/reports', icon: BarChart3, badge: 'P&L' },
      { transKey: 'nav.myCommissions', fallback: 'Mes Commissions & Facture', href: '/my-commissions', icon: Receipt },
      { transKey: 'nav.confirmers', fallback: 'Confirmateurs & Facturation', href: '/confirmers', icon: Users },
      { transKey: 'nav.expenses', fallback: 'Dépenses & Charges', href: '/expenses', icon: Receipt },
    ],
  },
  {
    id: 'admin',
    titleKey: 'nav.group.admin',
    fallbackTitle: 'Administration & Équipe',
    groupIcon: ShieldCheck,
    dotGlow: 'bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.9)]',
    iconBg: 'bg-purple-500/15',
    iconBorder: 'border-purple-400/30',
    iconColor: 'text-purple-400',
    items: [
      { transKey: 'nav.admin', fallback: 'Administration & Équipes', href: '/admin', icon: ShieldCheck },
      { transKey: 'nav.integrations', fallback: 'Intégrations & APIs', href: '/integrations', icon: Network },
      { transKey: 'nav.auditLogs', fallback: 'Journal d\'Audit & Historique', href: '/audit-logs', icon: History, badge: 'Audit' },
      { transKey: 'nav.simulator', fallback: 'Simulateur Webhook', href: '/simulator', icon: Zap },
    ],
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

function SidebarBody({ isMobile, onClose }: { isMobile?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { currentUser, canViewPage, isAdmin } = useAuth();
  const { t } = useLanguage();

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canViewPage(item.href)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col h-full relative select-none">
      {/* Top Ambient Glow Effect */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-amber-500/5 via-indigo-500/5 to-transparent pointer-events-none" />

      {/* Brand Header: Luxury Prestige Emblem */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-slate-950/40 relative shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center font-bold text-slate-950 shadow-md shadow-amber-500/25 border border-yellow-200/50 shrink-0">
            <Crown className="w-5 h-5 fill-slate-950" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-black text-sm tracking-tight text-white">SANADOKOM</span>
              <span className="px-1.5 py-0.5 text-[8px] font-black uppercase rounded-full bg-gradient-to-r from-amber-400/20 to-yellow-400/20 text-amber-300 border border-amber-400/30 tracking-wider">
                سندكم
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block truncate">
              COD Operating System
            </span>
          </div>
        </div>

        {/* Close Button on Mobile Drawer */}
        {isMobile && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-850 transition-colors cursor-pointer"
            title="Fermer"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-2.5 py-3 space-y-3 overflow-y-auto custom-scrollbar relative">
        {visibleGroups.map((group, groupIdx) => {
          const GroupIcon = group.groupIcon;

          return (
            <div key={group.id} className="space-y-1">
              {groupIdx > 0 && (
                <div className="pt-2 pb-1">
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-800/80 to-transparent" />
                </div>
              )}

              {/* Group Header Banner */}
              <div className="px-2.5 py-1 rounded-lg flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-md ${group.iconBg} border ${group.iconBorder} flex items-center justify-center shrink-0 shadow-xs relative`}
                  >
                    <GroupIcon className={`w-3 h-3 ${group.iconColor}`} />
                    <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${group.dotGlow}`} />
                  </div>

                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-slate-200 transition-colors">
                    {t(group.titleKey, group.fallbackTitle)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-slate-500 px-1.5 py-0.2 rounded-full bg-slate-900 border border-slate-800">
                    {group.items.length}
                  </span>
                  {groupIdx === 0 && !isAdmin && <Lock className="w-3 h-3 text-amber-400" />}
                </div>
              </div>

              {/* Nav Items */}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  const label = t(item.transKey, item.fallback);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => onClose?.()}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all relative group ${
                        isActive
                          ? 'bg-gradient-to-r from-slate-800/90 via-slate-800/60 to-slate-900/40 text-white font-bold border-l-2 border-amber-400 shadow-md shadow-black/20'
                          : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-transform ${
                            isActive
                              ? 'text-amber-400 scale-105 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                              : 'text-slate-400 group-hover:text-slate-200 group-hover:scale-105'
                          }`}
                        />
                        <span className="truncate">{label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`px-1.5 py-0.5 text-[9px] uppercase font-black rounded-md border shrink-0 ${
                            item.badge === 'Live'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 animate-pulse'
                              : item.badge === 'Prime' || item.badge === 'Auto'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* System Status & Executive Account Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 relative shrink-0">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="text-[10px] font-semibold text-emerald-400">Réseau Opérationnel</span>
          </span>
          <span
            className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
              isAdmin
                ? 'bg-amber-400/10 text-amber-300 border-amber-400/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30'
            }`}
          >
            {currentUser?.role === 'ADMIN' ? '👑 CHIEF EXEC' : '🎧 AGENT PRO'}
          </span>
        </div>

        <div className="flex items-center gap-2.5 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center font-bold text-xs text-amber-300 border border-slate-700 shrink-0">
            {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'EX'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-200 truncate">{currentUser ? currentUser.name : 'Utilisateur'}</div>
            <div className="text-[10px] text-slate-500 truncate">{currentUser?.email || 'admin@saas.ma'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop Persistent Sidebar (md+) */}
      <aside className="hidden md:flex w-64 bg-[#0B0F19] text-white flex-col shrink-0 min-h-screen border-r border-slate-800/80 shadow-2xl relative select-none z-20">
        <SidebarBody />
      </aside>

      {/* Mobile Slide-in Drawer (< md) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer Body */}
          <aside className="relative w-72 max-w-[85vw] bg-[#0B0F19] text-white flex flex-col h-full shadow-2xl z-50 border-r border-slate-800/80 animate-in slide-in-from-left duration-200 select-none">
            <SidebarBody isMobile onClose={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
