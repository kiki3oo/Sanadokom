'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePresence } from '@/context/PresenceContext';
import AccessDenied from '@/components/AccessDenied';
import {
  Settings,
  RefreshCw,
  Save,
  Calendar,
  PhoneCall,
  Clock,
  Activity,
  Target,
  Truck,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  CheckCircle2,
  Inbox,
  AlertTriangle,
  Bell,
  PhoneMissed,
  X,
  ExternalLink,
  ShieldCheck,
  Users,
  Search,
  Sparkles,
  Radio,
} from 'lucide-react';

interface AgentCardData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  initials: string;
  active: boolean;
  presenceStatus?: 'ONLINE' | 'BUSY' | 'PAUSED' | 'IDLE' | 'OFFLINE';
  currentActivity?: string;
  currentOrderNumber?: string | null;
  lastHeartbeat?: number | null;
  convRate: number;
  confirmedCount: number;
  contactedCount: number;
  deliveryRate: number;
  deliveredCount: number;
  shippedCount: number;
  totalCallsCount: number;
  totalCallTimeFormatted: string;
  sessionDurationFormatted: string;
  assignedCount: number;
  inProgressCount: number;
  callbacksCount: number;
  noAnswerCount: number;
  reviewCount: number;
  recentActivityCount: number;
  recentOrders: any[];
}

interface TeamOverviewData {
  avgHandlingTime: string;
  avgSessionDuration: string;
  contactedTeam: number;
  teamConvRate: number;
  totalOrders: number;
  totalAgents: number;
  onlineAgents?: number;
}

export default function ConfirmationManagementPage() {
  const { selectedStoreId, currentCountry, stores } = useStore();
  const { canViewPage, isAdmin, isManager, isCallAgent, currentUser } = useAuth();
  const canManageStrategy = (isAdmin || isManager) && !isCallAgent;
  const { t } = useLanguage();
  const { agents: presenceAgents } = usePresence();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'performance' | 'settings'>('performance');

  // Time Period Filters
  const [period, setPeriod] = useState<'today' | 'yesterday' | '7days' | 'month' | 'max' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Metric & Sorting Toggles
  const [sortByMetric, setSortByMetric] = useState<'conv' | 'delivery'>('conv');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  // Data States
  const [agents, setAgents] = useState<AgentCardData[]>([]);
  const [teamOverview, setTeamOverview] = useState<TeamOverviewData>({
    avgHandlingTime: '0s',
    avgSessionDuration: '0m',
    contactedTeam: 0,
    teamConvRate: 0,
    totalOrders: 0,
    totalAgents: 0,
    onlineAgents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [rebalancing, setRebalancing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Drilldown Modal
  const [selectedAgentModal, setSelectedAgentModal] = useState<AgentCardData | null>(null);

  // Smart Call Strategy & Lead Rotation Settings
  const [strategySettings, setStrategySettings] = useState({
    enableAutoRotation: true,
    maxAttemptsBeforeRotation: 3,
    relanceTimeoutHours: 2,
    maxUnansweredBacklog: 8,
    enableBacklogThrottle: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchStrategySettings = async () => {
    try {
      const res = await fetch('/api/settings/call-strategy');
      const data = await res.json();
      if (data.success && data.settings) {
        setStrategySettings(data.settings);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveStrategySettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/settings/call-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...strategySettings,
          userId: currentUser?.id,
          userName: currentUser?.name || 'Admin',
          userRole: currentUser?.role || 'ADMIN',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ text: t('strat.saveSuccess', 'Règles de relance et rotation mises à jour avec succès !'), type: 'success' });
      } else {
        setFeedbackMsg({ text: data.error || t('strat.saveError', 'Erreur lors de la sauvegarde.'), type: 'error' });
      }
    } catch (e: any) {
      setFeedbackMsg({ text: e.message || 'Erreur réseau.', type: 'error' });
    } finally {
      setSavingSettings(false);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  // Fetch Confirmation Performance Data
  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('period', period);
      if (selectedStoreId && selectedStoreId !== 'ALL') {
        params.append('storeId', selectedStoreId);
      }
      if (currentCountry?.code) {
        params.append('country', currentCountry.code);
      }
      if (period === 'custom' && customStartDate) {
        params.append('startDate', customStartDate);
        if (customEndDate) params.append('endDate', customEndDate);
      }
      if (currentUser?.id) {
        params.append('requestUserId', currentUser.id);
      }
      if (currentUser?.role) {
        params.append('requestRole', currentUser.role);
      }

      const res = await fetch(`/api/confirmation-management?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents || []);
        if (data.teamOverview) {
          setTeamOverview(data.teamOverview);
        }
      }
    } catch (err) {
      console.error('Error fetching confirmation stats:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && canManageStrategy) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('tab') === 'settings') {
        setActiveTab('settings');
      }
    } else if (!canManageStrategy && activeTab === 'settings') {
      setActiveTab('performance');
    }
    fetchData(true);
    if (canManageStrategy) {
      fetchStrategySettings();
    }
    // Real-time automatic background polling every 12 seconds so stats change dynamically
    const pollTimer = setInterval(() => {
      fetchData(false);
    }, 12000);
    return () => clearInterval(pollTimer);
  }, [selectedStoreId, currentCountry.code, period, customStartDate, customEndDate, currentUser?.id, canManageStrategy]);

  // Handle Rebalance Action (Round-Robin pending leads redistribution)
  const handleRebalance = async () => {
    if (!confirm('Voulez-vous rééquilibrer équitablement les leads non traités entre tous les agents actifs ?')) {
      return;
    }
    setRebalancing(true);
    try {
      const res = await fetch('/api/confirmation-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REBALANCE',
          storeId: selectedStoreId,
          userRole: currentUser?.role,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ text: data.message || 'Leads rééquilibrés avec succès !', type: 'success' });
        fetchData(false);
      } else {
        setFeedbackMsg({ text: data.error || 'Erreur lors du rééquilibrage', type: 'error' });
      }
    } catch (e: any) {
      setFeedbackMsg({ text: e.message || 'Erreur de connexion', type: 'error' });
    } finally {
      setRebalancing(false);
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  // Merge server agent cards with client-side live presence from PresenceContext
  const liveAgents = useMemo(() => {
    return agents.map((agent) => {
      const live = presenceAgents.find((p) => p.id === agent.id);
      if (live) {
        const isOnline = ['ONLINE', 'BUSY', 'IDLE'].includes(live.status);
        return {
          ...agent,
          active: isOnline,
          presenceStatus: live.status,
          currentActivity: live.currentActivity || agent.currentActivity,
          currentOrderNumber: live.currentOrderNumber || agent.currentOrderNumber,
          lastHeartbeat: live.lastHeartbeat || agent.lastHeartbeat,
        };
      }
      const isSelf = currentUser?.id === agent.id;
      return {
        ...agent,
        active: isSelf ? true : (agent.active ?? false),
        presenceStatus: isSelf ? ('ONLINE' as const) : (agent.presenceStatus || 'OFFLINE'),
      };
    });
  }, [agents, presenceAgents, currentUser?.id]);

  // Sort Agents List
  const sortedAgents = useMemo(() => {
    return [...liveAgents].sort((a, b) => {
      const valA = sortByMetric === 'conv' ? a.convRate : a.deliveryRate;
      const valB = sortByMetric === 'conv' ? b.convRate : b.deliveryRate;
      return sortDirection === 'desc' ? valB - valA : valA - valB;
    });
  }, [liveAgents, sortByMetric, sortDirection]);

  if (!canViewPage('/confirmation')) {
    return <AccessDenied moduleName="la Gestion et Statistiques des Confirmations" />;
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 border border-slate-200 shadow-2xs">
            <Settings className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {isCallAgent ? t('conf.myTitle', 'Mon Espace Performance (Confirmation)') : t('confMgmt.title', 'Confirmation Management')}
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <span>{currentCountry.flag}</span>
                <span>{currentCountry.name}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isCallAgent
                ? t('conf.mySubtitle', 'Suivez vos indicateurs personnels, vos taux de conversion et vos objectifs')
                : t('confMgmt.subtitle', 'Configure assignment rules and track performance')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Live Real-Time Agent Presence Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-extrabold text-slate-800">
              {liveAgents.filter((a) => a.active).length} / {liveAgents.length}
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              {t('conf.onlineCount', 'En ligne')}
            </span>
            <button
              onClick={() => fetchData(true)}
              disabled={loading}
              className="text-slate-400 hover:text-indigo-600 transition-colors ml-1 p-0.5 rounded"
              title={t('conf.liveSync', 'Actualiser maintenant')}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>

          {isCallAgent ? (
            <div className="flex items-center gap-2">
              <Link
                href="/call-center"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-all"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>{t('nav.callCenter', 'Centre d\'Appel')}</span>
              </Link>
              <Link
                href="/leaderboard"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-2xs transition-all"
              >
                <span>🏆 {t('nav.leaderboard', 'Podium')}</span>
              </Link>
            </div>
          ) : (
            <>
              <button
                onClick={handleRebalance}
                disabled={rebalancing}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs transition-all disabled:opacity-50"
                title="Rééquilibrer équitablement les leads en attente entre les agents actifs"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${rebalancing ? 'animate-spin' : ''}`} />
                <span>{rebalancing ? t('conf.rebalancing', 'Rééquilibrage...') : t('conf.rebalance', 'Rebalance')}</span>
              </button>

              {canManageStrategy && (
                <button
                  onClick={() => setActiveTab(activeTab === 'settings' ? 'performance' : 'settings')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-indigo-600 text-white shadow-indigo-200'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300'
                  }`}
                  title={t('conf.strategyBtn', 'Régler le délai d\'heures et le nombre de tentatives')}
                >
                  <Settings className={`w-3.5 h-3.5 ${activeTab === 'settings' ? 'text-white' : 'text-indigo-600'}`} />
                  <span>{activeTab === 'settings' ? t('conf.returnPerf', '📊 Retour aux Performances') : t('conf.strategyBtn', '⚙️ Stratégie & Rotation')}</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Page Navigation Tabs */}
      <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 w-full sm:w-fit flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <button
          onClick={() => setActiveTab('performance')}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'performance'
              ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Activity className="w-4 h-4 text-indigo-500" />
          <span>{isCallAgent ? t('conf.myPerf', 'Mes Performances') : t('conf.agentPerf', '📊 Performance des Confirmateurs')}</span>
        </button>

        {canManageStrategy && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-700'
                : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200'
            }`}
          >
            <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-white' : 'text-indigo-600'}`} />
            <span>{t('conf.settings', '⚙️ Stratégie & Rotation des Leads (Pas de Réponse)')}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'settings' ? 'bg-indigo-800 text-white' : 'bg-indigo-200 text-indigo-900'
            }`}>
              {t('conf.settingsBadge', 'تعديل الساعات والمحاولات ⚙️')}
            </span>
          </button>
        )}
      </div>

      {activeTab === 'performance' || !canManageStrategy ? (
        <>
          {/* 3. Filters & Sorting Toolbar */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            {/* Period Pills */}
            <div className="flex items-center gap-1.5 bg-slate-100/70 p-1 rounded-xl border border-slate-200/60 overflow-x-auto max-w-full w-full sm:w-auto no-scrollbar scroll-smooth whitespace-nowrap">
              <button
                onClick={() => setPeriod('today')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                  period === 'today'
                    ? 'bg-slate-900 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{t('conf.today', 'Today')}</span>
              </button>

              <button
                onClick={() => setPeriod('yesterday')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                  period === 'yesterday'
                    ? 'bg-slate-900 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{t('conf.yesterday', 'Yesterday')}</span>
              </button>

              <button
                onClick={() => setPeriod('7days')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                  period === '7days'
                    ? 'bg-slate-900 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{t('conf.past7days', 'Past 7 days')}</span>
              </button>

              <button
                onClick={() => setPeriod('month')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                  period === 'month'
                    ? 'bg-slate-900 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{t('conf.thisMonth', 'This month')}</span>
              </button>

              <button
                onClick={() => setPeriod('max')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                  period === 'max'
                    ? 'bg-slate-900 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{t('conf.maximum', 'Maximum')}</span>
              </button>

              <button
                onClick={() => setShowCustomModal(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                  period === 'custom'
                    ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3 h-3 text-indigo-400" />
                <span>{t('conf.custom', 'Custom')}</span>
              </button>
            </div>

            {/* Sort & Metric Selector */}
            <div className="flex items-center gap-2 overflow-x-auto max-w-full w-full sm:w-auto no-scrollbar scroll-smooth whitespace-nowrap">
              <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold shadow-2xs shrink-0">
                <button
                  onClick={() => setSortByMetric('conv')}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                    sortByMetric === 'conv'
                      ? 'bg-slate-100 text-slate-900 font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Target className="w-3 h-3 text-indigo-500" />
                  <span>{t('conf.convRate', 'Conv. rate')}</span>
                </button>

                <button
                  onClick={() => setSortByMetric('delivery')}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                    sortByMetric === 'delivery'
                      ? 'bg-slate-100 text-slate-900 font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Truck className="w-3 h-3 text-emerald-500" />
                  <span>{t('conf.deliveryRate', 'Delivery rate')}</span>
                </button>
              </div>

              <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold shadow-2xs">
                <button
                  onClick={() => setSortDirection('desc')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                    sortDirection === 'desc'
                      ? 'bg-slate-100 text-slate-900 font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ArrowDown className="w-3 h-3 text-slate-600" />
                  <span>{t('conf.highToLow', 'High to low')}</span>
                </button>

                <button
                  onClick={() => setSortDirection('asc')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                    sortDirection === 'asc'
                      ? 'bg-slate-100 text-slate-900 font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ArrowUp className="w-3 h-3 text-slate-600" />
                  <span>{t('conf.lowToHigh', 'Low to high')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Personal Performance Hero Banner (Exclusive for Call Agent) */}
          {isCallAgent && sortedAgents[0] && (
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-indigo-500/30 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-300">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{t('conf.heroTitle', 'Votre Espace Performance & Objectifs 🎯')}</span>
                </div>
                <div className="text-base font-extrabold text-white mt-1">
                  {t('conf.convRate', 'Votre Taux de Confirmation')} : <span className="text-emerald-400 text-lg font-black">{sortedAgents[0].convRate}%</span>
                  {teamOverview.teamConvRate > 0 && (
                    <span className="text-xs text-slate-300 font-medium ml-2">
                      ({t('conf.teamConvRate', 'Moyenne globale de l\'équipe')} : <strong className="text-white">{teamOverview.teamConvRate}%</strong>)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {t('conf.heroDesc', 'Bienvenue ! Voici vos indicateurs en direct, taux de transformation et commandes assignées.')}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/call-center"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{t('nav.callCenter', 'Centre d\'Appel')}</span>
                </Link>
                <Link
                  href="/leaderboard"
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1"
                >
                  <span>🏆 {t('nav.leaderboard', 'Podium')}</span>
                </Link>
              </div>
            </div>
          )}

          {/* 4. Team Overview Top 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Avg handling time */}
            <div className="bg-gradient-to-br from-purple-50/60 to-purple-100/30 border border-purple-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-extrabold text-slate-900 leading-tight">
                  {teamOverview.avgHandlingTime}
                </div>
                <div className="text-[11px] font-semibold text-slate-500">
                  {t('conf.avgHandling', 'Avg handling time')}
                </div>
              </div>
            </div>

            {/* Avg session duration */}
            <div className="bg-gradient-to-br from-fuchsia-50/60 to-fuchsia-100/30 border border-fuchsia-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-fuchsia-100 flex items-center justify-center text-fuchsia-700 shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-extrabold text-slate-900 leading-tight">
                  {teamOverview.avgSessionDuration}
                </div>
                <div className="text-[11px] font-semibold text-slate-500">
                  {t('conf.avgSession', 'Avg session duration')}
                </div>
              </div>
            </div>

            {/* Contacted (team) */}
            <div className="bg-gradient-to-br from-sky-50/60 to-sky-100/30 border border-sky-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700 shrink-0">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-extrabold text-slate-900 leading-tight">
                  {teamOverview.contactedTeam.toLocaleString()}
                </div>
                <div className="text-[11px] font-semibold text-slate-500">
                  {t('conf.contactedTeam', 'Contacted (team)')}
                </div>
              </div>
            </div>

            {/* Team conv. rate */}
            <div className="bg-gradient-to-br from-emerald-50/60 to-emerald-100/30 border border-emerald-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-extrabold text-slate-900 leading-tight">
                  {teamOverview.teamConvRate}%
                </div>
                <div className="text-[11px] font-semibold text-slate-500">
                  {t('conf.teamConvRate', 'Team conv. rate')}
                </div>
              </div>
            </div>
          </div>

          {/* 5. Agent Cards Grid (Exact reproduction of screenshot) */}
          {loading ? (
            <div className="p-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
              <span>Chargement des statistiques de confirmation...</span>
            </div>
          ) : sortedAgents.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
              <Users className="w-8 h-8 mx-auto text-slate-300" />
              <h3 className="text-sm font-bold text-slate-700">Aucun agent trouvé</h3>
              <p className="text-xs text-slate-400">
                Aucun agent actif ou aucune commande trouvée pour le pays ({currentCountry.name}) sur cette période.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sortedAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col"
                >
                  {/* Card Header: Avatar, Name, Email, Arrow */}
                  <div className="p-4 pb-3 flex items-start justify-between gap-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                          {agent.initials}
                        </div>
                        {agent.presenceStatus === 'BUSY' ? (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-white ring-2 ring-amber-300 animate-pulse"></span>
                        ) : agent.presenceStatus === 'PAUSED' ? (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-orange-500 border-2 border-white"></span>
                        ) : agent.active ? (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-200 animate-pulse"></span>
                        ) : (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-slate-300 border-2 border-white"></span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-xs font-extrabold text-slate-900">
                            {agent.name}
                          </h3>
                          {agent.presenceStatus === 'BUSY' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                              <span>{t('conf.busy', 'En appel 📞')}</span>
                            </span>
                          ) : agent.presenceStatus === 'PAUSED' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                              <span>{t('conf.paused', 'En pause ☕')}</span>
                            </span>
                          ) : agent.active ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                              </span>
                              <span>{t('conf.online', 'En ligne 🟢')}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              <span>{t('conf.offline', 'Hors ligne ⚪')}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate max-w-[170px]">
                          {agent.email}
                        </p>
                        {agent.currentActivity && agent.currentActivity !== 'Hors ligne' && (
                          <div className="text-[10px] text-slate-600 font-medium truncate max-w-[170px] mt-0.5 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-indigo-500 shrink-0"></span>
                            <span className="truncate">{agent.currentActivity}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedAgentModal(agent)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors"
                      title={t('conf.viewDetails', 'Voir détails')}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Gauges Row: Conv Rate & Delivery Rate */}
                  <div className="p-4 pb-3 grid grid-cols-2 gap-3">
                    {/* Conv Rate Gauge Box */}
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        {t('conf.convRate', 'Conv. Rate')}
                      </span>
                      <div className="flex items-center gap-2.5">
                        <CircularProgressRing value={agent.convRate} colorClass="text-teal-500" strokeWidth={5} />
                        <div>
                          <div className="text-lg font-black text-slate-900 leading-none">
                            {agent.convRate}%
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                            {agent.confirmedCount} / {agent.contactedCount}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Rate Gauge Box */}
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        {t('conf.deliveryRate', 'Delivery Rate')}
                      </span>
                      <div className="flex items-center gap-2.5">
                        <CircularProgressRing value={agent.deliveryRate} colorClass="text-emerald-500" strokeWidth={5} />
                        <div>
                          <div className="text-lg font-black text-slate-900 leading-none">
                            {agent.deliveryRate}%
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                            {agent.deliveredCount} / {agent.shippedCount || agent.deliveredCount}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Activity Mini-Stats (Calls, Call Time, Session Duration) */}
                  <div className="px-4 pb-3 grid grid-cols-3 gap-1.5 text-center">
                    <div className="bg-sky-50/60 border border-sky-100 rounded-lg py-1.5 px-1">
                      <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-sky-900">
                        <PhoneCall className="w-3 h-3 text-sky-600" />
                        <span>{agent.totalCallsCount}</span>
                      </div>
                      <span className="text-[9px] font-medium text-slate-500">{t('conf.calls', 'Calls')}</span>
                    </div>

                    <div className="bg-purple-50/60 border border-purple-100 rounded-lg py-1.5 px-1">
                      <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-purple-900">
                        <Clock className="w-3 h-3 text-purple-600" />
                        <span>{agent.totalCallTimeFormatted}</span>
                      </div>
                      <span className="text-[9px] font-medium text-slate-500 truncate block">{t('conf.totalCallTime', 'Total call time')}</span>
                    </div>

                    <div className="bg-fuchsia-50/60 border border-fuchsia-100 rounded-lg py-1.5 px-1">
                      <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-fuchsia-900">
                        <Activity className="w-3 h-3 text-fuchsia-600" />
                        <span>{agent.sessionDurationFormatted}</span>
                      </div>
                      <span className="text-[9px] font-medium text-slate-500 truncate block">{t('conf.sessionDuration', 'Session duration')}</span>
                    </div>
                  </div>

                  {/* Metrics 2x2 Grid (Assigned, Contacted, Confirmed, Conv. rate) */}
                  <div className="px-4 pb-3 grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5">
                      <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
                        <Inbox className="w-3.5 h-3.5 text-slate-600" />
                        <span className="text-base font-black text-slate-900">{agent.assignedCount}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">{t('conf.assigned', 'Assigned')}</span>
                    </div>

                    <div className="bg-sky-50/50 border border-sky-100 rounded-xl p-2.5">
                      <div className="flex items-center gap-1.5 text-sky-600 mb-0.5">
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span className="text-base font-black text-slate-900">{agent.contactedCount}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">{t('conf.contacted', 'Contacted')}</span>
                    </div>

                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-2.5">
                      <div className="flex items-center gap-1.5 text-emerald-600 mb-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-base font-black text-slate-900">{agent.confirmedCount}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">{t('conf.confirmed', 'Confirmed')}</span>
                    </div>

                    <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-2.5">
                      <div className="flex items-center gap-1.5 text-purple-600 mb-0.5">
                        <Target className="w-3.5 h-3.5" />
                        <span className="text-base font-black text-slate-900">{agent.convRate}%</span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">{t('conf.convRate', 'Conv. rate')}</span>
                    </div>
                  </div>

                  {/* Status Breakdown Mini-Pills (In progress, Callbacks, No answer, Review) */}
                  <div className="px-4 pb-3 grid grid-cols-4 gap-1.5">
                    <div className="bg-amber-50/70 border border-amber-200/60 rounded-lg p-1.5 text-center">
                      <div className="flex items-center justify-center gap-1 text-[11px] font-extrabold text-amber-900">
                        <Clock className="w-2.5 h-2.5 text-amber-600" />
                        <span>{agent.inProgressCount}</span>
                      </div>
                      <span className="text-[8.5px] font-bold text-amber-700/80 block truncate">{t('conf.inProgress', 'In progress')}</span>
                    </div>

                    <div className="bg-indigo-50/70 border border-indigo-200/60 rounded-lg p-1.5 text-center">
                      <div className="flex items-center justify-center gap-1 text-[11px] font-extrabold text-indigo-900">
                        <Bell className="w-2.5 h-2.5 text-indigo-600" />
                        <span>{agent.callbacksCount}</span>
                      </div>
                      <span className="text-[8.5px] font-bold text-indigo-700/80 block truncate">{t('conf.callbacks', 'Callbacks')}</span>
                    </div>

                    <div className="bg-pink-50/70 border border-pink-200/60 rounded-lg p-1.5 text-center">
                      <div className="flex items-center justify-center gap-1 text-[11px] font-extrabold text-pink-900">
                        <PhoneMissed className="w-2.5 h-2.5 text-pink-600" />
                        <span>{agent.noAnswerCount}</span>
                      </div>
                      <span className="text-[8.5px] font-bold text-pink-700/80 block truncate">{t('conf.noAnswer', 'No answer')}</span>
                    </div>

                    <div className="bg-orange-50/70 border border-orange-200/60 rounded-lg p-1.5 text-center">
                      <div className="flex items-center justify-center gap-1 text-[11px] font-extrabold text-orange-900">
                        <AlertTriangle className="w-2.5 h-2.5 text-orange-600" />
                        <span>{agent.reviewCount}</span>
                      </div>
                      <span className="text-[8.5px] font-bold text-orange-700/80 block truncate">{t('conf.review', 'Review')}</span>
                    </div>
                  </div>

                  {/* Card Footer: Recent Activity & View Details Button */}
                  <div className="mt-auto px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-slate-400" />
                      <span>{agent.recentActivityCount} {t('conf.recentActivity', 'recent activity')}</span>
                    </span>

                    <button
                      onClick={() => setSelectedAgentModal(agent)}
                      className="text-[11px] font-bold text-slate-700 hover:text-slate-950 flex items-center gap-1 transition-colors group cursor-pointer"
                    >
                      <span>{t('conf.viewDetails', 'View details')}</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : canManageStrategy ? (
        /* Settings Tab: Attribution & Assignment Rules - Visible ONLY to Admin & Manager */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 max-w-4xl">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900">
                {t('strat.title', 'Stratégie de Relance & Rotation Automatique des Leads')}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {t('strat.badge', 'Anti-Gaspillage 🛡️')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t('strat.subtitle', 'Contrôlez le délai d\'attente, le nombre d\'heures et de tentatives pour empêcher les agents d\'abandonner les commandes sans réponse.')}
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* 1. Toggle Global Auto-Rotation */}
            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900">
                    {t('strat.autoRotateTitle', 'Activer la Rotation Intelligente des Leads "Pas de Réponse"')}
                  </h4>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                    {t('strat.recommended', 'Recommandé')}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  {t('strat.autoRotateDesc', 'Si un client ne répond pas, le système surveille les délais et le nombre d\'appels pour réattribuer automatiquement la commande à un autre agent avec un nouveau numéro.')}
                </p>
              </div>
              <input
                type="checkbox"
                checked={strategySettings.enableAutoRotation}
                onChange={(e) => setStrategySettings((prev) => ({ ...prev, enableAutoRotation: e.target.checked }))}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-5 w-5 cursor-pointer mt-0.5"
              />
            </div>

            {/* 2. Grid of Configurable Numbers & Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
              {/* Max Attempts before Rotation */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                <label className="font-bold text-slate-800 block text-xs">
                  {t('strat.maxAttemptsLabel', 'Nombre max de tentatives avant changement d\'agent')}
                </label>
                <p className="text-[11px] text-slate-500">
                  {t('strat.maxAttemptsDesc', 'Après ce nombre d\'appels sans réponse, la commande est retirée de l\'agent et transférée à un collègue.')}
                </p>
                <select
                  value={strategySettings.maxAttemptsBeforeRotation}
                  onChange={(e) =>
                    setStrategySettings((prev) => ({ ...prev, maxAttemptsBeforeRotation: parseInt(e.target.value) }))
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={2}>{t('strat.attempts2', '2 tentatives')}</option>
                  <option value={3}>{t('strat.attempts3', '3 tentatives (Standard Recommandé)')}</option>
                  <option value={4}>{t('strat.attempts4', '4 tentatives')}</option>
                  <option value={5}>{t('strat.attempts5', '5 tentatives')}</option>
                </select>
              </div>

              {/* Relance Timeout Hours */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                <label className="font-bold text-slate-800 block text-xs">
                  {t('strat.timeoutHoursLabel', 'Délai max d\'attente de relance (en heures)')}
                </label>
                <p className="text-[11px] text-slate-500">
                  {t('strat.timeoutHoursDesc', 'Si l\'agent tarde et ne rappelle pas le client avant ce délai, le système intervient et réattribue la commande.')}
                </p>
                <select
                  value={strategySettings.relanceTimeoutHours}
                  onChange={(e) =>
                    setStrategySettings((prev) => ({ ...prev, relanceTimeoutHours: parseFloat(e.target.value) }))
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={0.5}>{t('strat.timeout30m', '30 minutes (Flux très urgent)')}</option>
                  <option value={1}>{t('strat.timeout1h', '1 heure (Flux rapide)')}</option>
                  <option value={2}>{t('strat.timeout2h', '2 heures (Équilibré Recommandé)')}</option>
                  <option value={3}>{t('strat.timeout3h', '3 heures')}</option>
                  <option value={4}>{t('strat.timeout4h', '4 heures')}</option>
                  <option value={6}>{t('strat.timeout6h', '6 heures')}</option>
                  <option value={12}>{t('strat.timeout12h', '12 heures')}</option>
                  <option value={24}>{t('strat.timeout24h', '24 heures (1 jour)')}</option>
                </select>
              </div>
            </div>

            {/* 3. Backlog Throttle Rule (Anti-Cherry Picking) */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900">
                    {t('strat.backlogTitle', 'Discipline Anti-Abandon (Plafond de leads sans réponse)')}
                  </h4>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                    {t('strat.fluxControl', 'Contrôle Flux')}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  {t('strat.backlogDesc', 'Empêche un agent de continuer à tirer des commandes fraîches s\'il a accumulé trop de commandes en retard dans son onglet "Pas de réponse". Le système lui sert sa relance en priorité.')}
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-600">
                    {t('strat.backlogCapLabel', 'Plafond max toléré :')}
                  </span>
                  <select
                    value={strategySettings.maxUnansweredBacklog}
                    onChange={(e) =>
                      setStrategySettings((prev) => ({ ...prev, maxUnansweredBacklog: parseInt(e.target.value) }))
                    }
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 font-bold text-xs text-slate-800"
                  >
                    <option value={3}>{t('strat.backlog3', '3 leads en retard')}</option>
                    <option value={5}>{t('strat.backlog5', '5 leads en retard')}</option>
                    <option value={8}>{t('strat.backlog8', '8 leads en retard (Recommandé)')}</option>
                    <option value={10}>{t('strat.backlog10', '10 leads en retard')}</option>
                    <option value={15}>{t('strat.backlog15', '15 leads en retard')}</option>
                  </select>
                </div>
              </div>
              <input
                type="checkbox"
                checked={strategySettings.enableBacklogThrottle}
                onChange={(e) => setStrategySettings((prev) => ({ ...prev, enableBacklogThrottle: e.target.checked }))}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-5 w-5 cursor-pointer mt-0.5"
              />
            </div>

            {/* 4. Classical attribution rules */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-4">
              <div>
                <h4 className="font-bold text-slate-900">
                  {t('strat.collisionLockTitle', 'Verrouillage Intelligent de Commande (Lock Anti-Collision)')}
                </h4>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  {t('strat.collisionLockDesc', 'Empêche deux agents d\'appeler le même client en même temps avec libération automatique après 10 minutes d\'inactivité.')}
                </p>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4" />
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-4">
              <div>
                <h4 className="font-bold text-slate-900">
                  {t('strat.countryStrictTitle', 'Respect Strict des Boutiques par Pays')} ({currentCountry.name})
                </h4>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  {t('strat.countryStrictDesc', 'Les agents assignés au Maroc ne reçoivent que les leads du Maroc, et les agents du Sénégal ne reçoivent que le Sénégal.')}
                </p>
              </div>
              <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4" />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400">
              {t('strat.footerNotice', 'Les modifications sont appliquées immédiatement au Call Center et aux règles d\'attribution.')}
            </span>
            <button
              onClick={handleSaveStrategySettings}
              disabled={savingSettings}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              {savingSettings ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{t('strat.savingBtn', 'Enregistrement...')}</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{t('strat.saveBtn', 'Enregistrer les modifications')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : null}

      {/* Drilldown Agent Details Modal */}
      {selectedAgentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-sm">
                  {selectedAgentModal.initials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{selectedAgentModal.name}</h3>
                    {selectedAgentModal.presenceStatus === 'BUSY' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                        <span>{t('conf.busy', 'En appel 📞')}</span>
                      </span>
                    ) : selectedAgentModal.presenceStatus === 'PAUSED' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                        <span>{t('conf.paused', 'En pause ☕')}</span>
                      </span>
                    ) : selectedAgentModal.active ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>{t('conf.online', 'En ligne 🟢')}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        <span>{t('conf.offline', 'Hors ligne ⚪')}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span>{selectedAgentModal.email}</span>
                    {selectedAgentModal.currentActivity && selectedAgentModal.currentActivity !== 'Hors ligne' && (
                      <>
                        <span>•</span>
                        <span className="text-indigo-600 font-medium">{selectedAgentModal.currentActivity}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAgentModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 block font-semibold">Taux Conv.</span>
                  <span className="text-base font-extrabold text-slate-900">{selectedAgentModal.convRate}%</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 block font-semibold">Taux Livr.</span>
                  <span className="text-base font-extrabold text-slate-900">{selectedAgentModal.deliveryRate}%</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 block font-semibold">Total Appels</span>
                  <span className="text-base font-extrabold text-slate-900">{selectedAgentModal.totalCallsCount}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 block font-semibold">Assignés</span>
                  <span className="text-base font-extrabold text-slate-900">{selectedAgentModal.assignedCount}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2">Dernières Commandes Traitées</h4>
                {selectedAgentModal.recentOrders && selectedAgentModal.recentOrders.length > 0 ? (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {selectedAgentModal.recentOrders.map((o) => (
                      <div key={o.id} className="p-2.5 bg-white flex items-center justify-between text-[11px]">
                        <div>
                          <span className="font-bold text-slate-900">#{o.orderNumber}</span>
                          <span className="text-slate-400 ml-2">{o.customerName} ({o.customerCity})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900">
                            {o.totalAmount} {o.store?.currency || 'MAD'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            o.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400">Aucune commande récente.</div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedAgentModal(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Date Range Picker Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 border border-slate-200 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Sélectionner une Période Personnalisée</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Date de Début</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Date de Fin</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setPeriod('custom');
                  setShowCustomModal(false);
                }}
                disabled={!customStartDate}
                className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold disabled:opacity-50"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Mini Circular SVG Progress Ring Component
function CircularProgressRing({
  value,
  colorClass = 'text-teal-500',
  strokeWidth = 4,
}: {
  value: number;
  colorClass?: string;
  strokeWidth?: number;
}) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
      <svg className="w-11 h-11 transform -rotate-90" viewBox="0 0 44 44">
        {/* Background Circle */}
        <circle
          cx="22"
          cy="22"
          r={radius}
          className="text-slate-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
        />
        {/* Animated Progress Circle */}
        <circle
          cx="22"
          cy="22"
          r={radius}
          className={colorClass}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
        />
      </svg>
    </div>
  );
}
