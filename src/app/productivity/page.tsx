'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import AccessDenied from '@/components/AccessDenied';
import {
  Clock,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Users,
  Search,
  Filter,
  RefreshCw,
  ArrowRight,
  Flame,
  Award,
  Calendar,
  X,
  PhoneCall,
  User,
  Sparkles,
  BarChart2,
  ChevronRight,
  Send,
  Coffee,
  Circle,
  Radio,
} from 'lucide-react';
import { usePresence } from '@/context/PresenceContext';

interface AgentProductivity {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  totalActions: number;
  ordersTreatedCount: number;
  confirmedCalls: number;
  confirmationRate: number;
  avgGapMinutes: number;
  totalIdleMinutes: number;
  longestIdleGapMin: number;
  pendingBacklog: number;
  firstActionTime: string;
  lastActionTime: string;
  cadenceStatus: 'VERY_FAST' | 'NORMAL' | 'SLOW' | 'VERY_SLOW';
  cadenceLabel: string;
  cadenceColor: string;
  dispatchScore: number;
  recentGaps: { start: string; end: string; durationMin: number; isIdle: boolean }[];
}

export default function ProductivityPage() {
  const { selectedStoreId, currentCountry } = useStore();
  const { canViewPage } = useAuth();
  const { t, language } = useLanguage();
  const { agents: presenceAgents } = usePresence();

  const [agents, setAgents] = useState<AgentProductivity[]>([]);
  const [stats, setStats] = useState<any>({
    totalAgents: 0,
    activeToday: 0,
    totalOrdersTreatedToday: 0,
    avgTeamGapMin: '0',
  });
  const [topAgent, setTopAgent] = useState<AgentProductivity | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedAgentDetails, setSelectedAgentDetails] = useState<AgentProductivity | null>(null);

  const fetchProductivity = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedStoreId && selectedStoreId !== 'ALL') params.append('storeId', selectedStoreId);

      const res = await fetch(`/api/agents/productivity?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents || []);
        setStats(data.stats || {});
        setTopAgent(data.topRecommendedAgent || null);
      }
    } catch (err) {
      console.error('Error fetching productivity:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductivity();
  }, [selectedStoreId, startDate, endDate]);

  if (!canViewPage('/productivity')) {
    return <AccessDenied moduleName="le Contrôle du Temps & Productivité des Agents" />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {t('prod.title')}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-600" />
              <span>{t('prod.avgGap')}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {t('prod.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => fetchProductivity()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('btn.refresh')}</span>
          </button>

          <Link
            href="/orders"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{t('prod.distributeOrders')}</span>
          </Link>
        </div>
      </div>

      {/* Hero Dispatch Advisor: "L'Agent N°1 Recommandé pour recevoir les leads" */}
      {topAgent ? (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white rounded-2xl p-6 shadow-xl border border-indigo-900/60 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider mb-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span>{t('prod.heroTitle')}</span>
              </div>

              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-black text-white">
                  {t('prod.heroGiveTo')} <span className="text-emerald-400 underline decoration-emerald-500/50">{topAgent.name}</span>
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {t('prod.heroScore')} {topAgent.dispatchScore}/100
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-2 max-w-3xl leading-relaxed font-medium">
                {language === 'ar' ? (
                  <>
                    هذا المؤكد هو الأسرع حالياً: يستغرق فقط <strong className="text-emerald-300">{topAgent.avgGapMinutes} دقيقة</strong> بين كل طلبية وأخرى، بنسبة تأكيد تبلغ <strong className="text-emerald-300">{topAgent.confirmationRate}%</strong> وبدون تراكم في الطلبات العالقة ({topAgent.pendingBacklog} في الانتظار). إسناد الطلبيات إليه يضمن سرعة التواصل ورفع نسبة التسليم.
                  </>
                ) : language === 'en' ? (
                  <>
                    This agent is currently the fastest: averaging only <strong className="text-emerald-300">{topAgent.avgGapMinutes} min</strong> between orders, with a confirmation rate of <strong className="text-emerald-300">{topAgent.confirmationRate}%</strong> and minimal backlog ({topAgent.pendingBacklog} pending). Assigning new leads to them ensures rapid follow-up and higher delivery rates.
                  </>
                ) : (
                  <>
                    Cet agent est actuellement le plus rapide : cadence de seulement <strong className="text-emerald-300">{topAgent.avgGapMinutes} min</strong> entre chaque commande, taux de confirmation de <strong className="text-emerald-300">{topAgent.confirmationRate}%</strong> et faible arriéré ({topAgent.pendingBacklog} en attente). Lui donner les nouveaux leads maximise votre réactivité et vos ventes.
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 shrink-0">
              <div className="text-center px-2">
                <div className="text-[10px] text-slate-400 font-bold uppercase">{t('prod.avgGap')}</div>
                <div className="text-lg font-black text-emerald-400">{topAgent.avgGapMinutes} min</div>
              </div>
              <div className="h-8 w-px bg-slate-700"></div>
              <div className="text-center px-2">
                <div className="text-[10px] text-slate-400 font-bold uppercase">{t('table.status')}</div>
                <div className="text-lg font-black text-white">{topAgent.ordersTreatedCount}</div>
              </div>
              <div className="h-8 w-px bg-slate-700"></div>
              <div className="text-center px-2">
                <div className="text-[10px] text-slate-400 font-bold uppercase">{t('dashboard.confirmationRate')}</div>
                <div className="text-lg font-black text-indigo-300">{topAgent.confirmationRate}%</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs font-medium text-amber-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Pas assez d'activité aujourd'hui pour calculer l'agent N°1. Les agents doivent traiter des commandes pour activer la recommandation.</span>
        </div>
      )}

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('prod.activeAgents')}</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {stats.activeToday} / {stats.totalAgents}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">
            {t('presence.agentsOnline')}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{t('prod.ordersTreated')}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {stats.totalOrdersTreatedToday}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-semibold">
            {t('dash.kpi.confirmed')}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">{t('prod.avgWaitTime')}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-800 mt-2">
            {stats.avgTeamGapMin} min
          </div>
          <div className="text-[11px] text-amber-600 mt-1 font-semibold">
            {t('prod.avgGap')}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">{t('prod.cadenceTarget')}</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-800 mt-2">&lt; 5 min</div>
          <div className="text-[11px] text-purple-600 mt-1 font-semibold">
            COD Standard
          </div>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span className="font-bold text-slate-700">{t('prod.analysisPeriod')}</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-700"
          />
          <span className="text-slate-400">{t('exp.filter.to')}</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-700"
          />
          <button
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              setStartDate(today);
              setEndDate(today);
            }}
            className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors cursor-pointer"
          >
            {t('period.today')}
          </button>
        </div>

        <div className="text-xs text-slate-500 font-semibold">
          {agents.length} {t('presence.agentsOnline')}
        </div>
      </div>

      {/* Agents Productivity Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">{t('prod.title')}</h3>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">{t('table.loading')}</div>
        ) : agents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">{t('presence.noAgents')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">{t('prod.rankDispatch')}</th>
                  <th className="py-3.5 px-4">{t('prod.agentCol')}</th>
                  <th className="py-3.5 px-4">{t('presence.liveStatusCol')}</th>
                  <th className="py-3.5 px-4">{t('prod.cadenceCol')}</th>
                  <th className="py-3.5 px-4 text-center">{t('prod.avgBetweenCol')}</th>
                  <th className="py-3.5 px-4 text-center">{t('prod.totalDeadTimeCol')}</th>
                  <th className="py-3.5 px-4 text-center">{t('prod.longestBreakCol')}</th>
                  <th className="py-3.5 px-4 text-center">{t('prod.ordersTreated')}</th>
                  <th className="py-3.5 px-4 text-center">{t('dashboard.confirmationRate')}</th>
                  <th className="py-3.5 px-4 text-center">{t('prod.pendingLeadsCol')}</th>
                  <th className="py-3.5 px-4 text-center">{t('prod.detailsCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-xs text-slate-400 font-semibold">
                      Aucun agent de confirmation actif pour {currentCountry.name} sur cette période.
                    </td>
                  </tr>
                ) : (
                  agents.map((agent, index) => (
                  <tr key={agent.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Rank */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {index === 0 && agent.dispatchScore > 30 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-black flex items-center justify-center text-xs border border-amber-300">
                            1 👑
                          </span>
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs">
                            {index + 1}
                          </span>
                        )}
                        {index === 0 && agent.dispatchScore > 30 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Top Choix
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Agent Name */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-xs">
                          {agent.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 block leading-tight">
                            {agent.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {agent.firstActionTime !== '—' ? `${agent.firstActionTime} ➔ ${agent.lastActionTime}` : 'Pas encore d appel'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Live Presence Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {(() => {
                        const p = presenceAgents.find((x) => x.id === agent.id);
                        if (!p || p.status === 'OFFLINE') {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                              <Circle className="w-2 h-2 text-slate-400" />
                              <span>{t('presence.offline')}</span>
                            </span>
                          );
                        }
                        if (p.status === 'BUSY') {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <PhoneCall className="w-2.5 h-2.5 animate-pulse" />
                              <span>{p.currentOrderNumber ? `#${p.currentOrderNumber}` : t('presence.busy')}</span>
                            </span>
                          );
                        }
                        if (p.status === 'PAUSED') {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-300">
                              <Coffee className="w-2.5 h-2.5" />
                              <span>{t('presence.paused')}</span>
                            </span>
                          );
                        }
                        return (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span>{t('presence.online')}</span>
                          </span>
                        );
                      })()}
                    </td>

                    {/* Cadence Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] border ${agent.cadenceColor}`}>
                        <span>{agent.cadenceLabel}</span>
                      </span>
                    </td>

                    {/* Avg Gap */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`font-black text-sm ${
                        agent.avgGapMinutes === 0
                          ? 'text-slate-400'
                          : agent.avgGapMinutes <= 5
                          ? 'text-emerald-600'
                          : agent.avgGapMinutes <= 10
                          ? 'text-blue-600'
                          : agent.avgGapMinutes <= 20
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}>
                        {agent.avgGapMinutes > 0 ? `${agent.avgGapMinutes} min` : '—'}
                      </span>
                    </td>

                    {/* Total Idle Minutes */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`font-bold text-xs ${
                        agent.totalIdleMinutes > 45 ? 'text-rose-600' : 'text-slate-700'
                      }`}>
                        {agent.totalIdleMinutes > 0 ? `${agent.totalIdleMinutes} min` : '0 min'}
                      </span>
                    </td>

                    {/* Longest Pause */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap text-xs text-slate-600 font-medium">
                      {agent.longestIdleGapMin > 0 ? (
                        <span className={agent.longestIdleGapMin > 30 ? 'font-black text-rose-600' : ''}>
                          {agent.longestIdleGapMin} min
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Orders Treated */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap font-black text-slate-900 text-sm">
                      {agent.ordersTreatedCount}
                    </td>

                    {/* Confirmation Rate */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="font-extrabold text-indigo-700 text-xs">
                        {agent.confirmationRate}%
                      </span>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {agent.confirmedCalls} confirmée(s)
                      </div>
                    </td>

                    {/* Pending Backlog */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        agent.pendingBacklog > 15
                          ? 'bg-rose-100 text-rose-800'
                          : agent.pendingBacklog > 5
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {agent.pendingBacklog} en attente
                      </span>
                    </td>

                    {/* Details Action */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedAgentDetails(agent)}
                        className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                      >
                        Chronologie
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drill-Down Timeline Modal */}
      {selectedAgentDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  {selectedAgentDetails.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Chronologie des Pauses & Activité : {selectedAgentDetails.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Moyenne d'attente entre commandes : <strong>{selectedAgentDetails.avgGapMinutes} min</strong> | Temps mort total : <strong>{selectedAgentDetails.totalIdleMinutes} min</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAgentDetails(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-[420px] overflow-y-auto space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Historique des Gaps / Pauses récentes entre les appels :
              </h4>

              {selectedAgentDetails.recentGaps.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Pas assez d'appels consécutifs enregistrés aujourd'hui.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedAgentDetails.recentGaps.map((gap, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                        gap.isIdle
                          ? 'bg-rose-50/70 border-rose-200 text-rose-800'
                          : gap.durationMin <= 5
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className={`w-3.5 h-3.5 ${gap.isIdle ? 'text-rose-600' : 'text-slate-500'}`} />
                        <span className="font-semibold">
                          De <strong>{gap.start}</strong> à <strong>{gap.end}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm">
                          {gap.durationMin} min
                        </span>
                        {gap.isIdle ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-200/80 text-rose-800 border border-rose-300">
                            Pause Longue
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                            Cadence Normale
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setSelectedAgentDetails(null)}
                className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200/80 rounded-xl transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
