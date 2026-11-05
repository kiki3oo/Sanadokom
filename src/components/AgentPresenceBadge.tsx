'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePresence, AgentPresenceInfo } from '@/context/PresenceContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
import {
  Users,
  Radio,
  PhoneCall,
  Clock,
  Coffee,
  CheckCircle2,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  Shield,
  Circle,
} from 'lucide-react';

export default function AgentPresenceBadge() {
  const { agents, summary, loading, myStatusIntent, setMyStatusIntent, refreshPresence } = usePresence();
  const { currentUser, isCallAgent, isAdmin, isManager } = useAuth();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside (Always declare hooks before any conditional returns)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Strictly hide presence monitoring details from standard users / agents
  if (!isManager) {
    return null;
  }

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshPresence();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const activeCount = summary.online + summary.busy;

  const formatLastSeen = (timestamp?: number | null) => {
    if (!timestamp) return '—';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 45) return t('presence.justNow');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
          activeCount > 0
            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 shadow-2xs'
            : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
        }`}
        title={t('presence.title')}
      >
        <span className="relative flex h-2.5 w-2.5">
          {activeCount > 0 ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-400"></span>
          )}
        </span>

        <span className="flex items-center gap-1 font-extrabold">
          <span>{activeCount}</span>
          <span className="text-slate-400">/</span>
          <span>{summary.totalAgents}</span>
          <span className="hidden sm:inline font-semibold text-[11px] text-slate-600 ml-0.5">
            {t('presence.agentsOnline')}
          </span>
        </span>

        <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold">{t('presence.title')}</h4>
                <p className="text-[10px] text-slate-300">{t('presence.subtitle')}</p>
              </div>
            </div>

            <button
              onClick={handleManualRefresh}
              className={`p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors ${
                isRefreshing ? 'animate-spin' : ''
              }`}
              title="Rafraîchir"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Stats Pill Strip */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 grid grid-cols-4 gap-1.5 text-center text-[10px] font-bold">
            <div className="p-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="block text-xs font-black">{summary.online}</span>
              <span className="text-[9px] uppercase tracking-wider">{t('presence.online')}</span>
            </div>
            <div className="p-1 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
              <span className="block text-xs font-black">{summary.busy}</span>
              <span className="text-[9px] uppercase tracking-wider">{t('presence.busy')}</span>
            </div>
            <div className="p-1 rounded-md bg-orange-100 text-orange-800 border border-orange-200">
              <span className="block text-xs font-black">{summary.paused}</span>
              <span className="text-[9px] uppercase tracking-wider">{t('presence.paused')}</span>
            </div>
            <div className="p-1 rounded-md bg-slate-200 text-slate-700 border border-slate-300">
              <span className="block text-xs font-black">{summary.offline}</span>
              <span className="text-[9px] uppercase tracking-wider">{t('presence.offline')}</span>
            </div>
          </div>

          {/* Agent Self Status Toggle (if current user is call agent) */}
          {isCallAgent && currentUser && (
            <div className="p-3 bg-indigo-50/60 border-b border-indigo-100 flex items-center justify-between text-xs">
              <span className="font-bold text-indigo-950 text-[11px] flex items-center gap-1.5">
                <span>{t('presence.myStatus')}</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMyStatusIntent('AVAILABLE')}
                  className={`px-2.5 py-1 rounded-md font-bold text-[10px] transition-all cursor-pointer ${
                    myStatusIntent === 'AVAILABLE'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {t('presence.setAvailable')}
                </button>
                <button
                  onClick={() => setMyStatusIntent('PAUSED')}
                  className={`px-2.5 py-1 rounded-md font-bold text-[10px] transition-all cursor-pointer ${
                    myStatusIntent === 'PAUSED'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {t('presence.setPaused')}
                </button>
              </div>
            </div>
          )}

          {/* Agents List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 p-2">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400">Chargement...</div>
            ) : agents.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">{t('presence.noAgents')}</div>
            ) : (
              agents.map((agent) => {
                const isCurrent = agent.id === currentUser?.id;
                return (
                  <div
                    key={agent.id}
                    className={`p-2.5 rounded-xl transition-colors hover:bg-slate-50 flex items-start justify-between gap-3 ${
                      isCurrent ? 'bg-indigo-50/40 border border-indigo-100/60' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      {/* Avatar with status dot */}
                      <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[11px]">
                          {agent.name.charAt(0).toUpperCase()}
                        </div>
                        {/* Status indicator dot */}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                            agent.status === 'ONLINE'
                              ? 'bg-emerald-500 ring-2 ring-emerald-200 animate-pulse'
                              : agent.status === 'BUSY'
                              ? 'bg-amber-500 ring-2 ring-amber-200'
                              : agent.status === 'PAUSED'
                              ? 'bg-orange-500'
                              : agent.status === 'IDLE'
                              ? 'bg-yellow-400'
                              : 'bg-slate-300'
                          }`}
                        />
                      </div>

                      {/* Name & Activity */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-800 truncate">{agent.name}</span>
                          {isCurrent && (
                            <span className="text-[9px] bg-indigo-100 text-indigo-700 font-extrabold px-1.5 py-0.2 rounded-full">
                              Vous
                            </span>
                          )}
                        </div>

                        {/* Current Activity detail */}
                        <p className="text-[10px] text-slate-500 truncate mt-0.5 max-w-[190px]">
                          {agent.status === 'BUSY' ? (
                            <span className="text-amber-700 font-bold flex items-center gap-1">
                              <PhoneCall className="w-2.5 h-2.5 inline" />
                              <span>{agent.currentActivity}</span>
                            </span>
                          ) : agent.status === 'PAUSED' ? (
                            <span className="text-orange-600 font-semibold flex items-center gap-1">
                              <Coffee className="w-2.5 h-2.5 inline" />
                              <span>{t('presence.paused')}</span>
                            </span>
                          ) : agent.status === 'ONLINE' ? (
                            <span className="text-emerald-700 font-medium">{agent.currentActivity}</span>
                          ) : (
                            <span className="text-slate-400">
                              {t('presence.lastSeen')} {formatLastSeen(agent.lastHeartbeat)}
                            </span>
                          )}
                        </p>

                        {/* Today's micro stats */}
                        <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-400 font-medium">
                          <span>
                            📞 <strong>{agent.todayCalls}</strong> {t('presence.todayCalls')}
                          </span>
                          <span>•</span>
                          <span className="text-emerald-600 font-semibold">
                            ✅ <strong>{agent.todayConfirmed}</strong> {t('presence.todayConfirmed')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0 text-right">
                      {agent.status === 'ONLINE' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>{t('presence.online')}</span>
                        </span>
                      ) : agent.status === 'BUSY' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <PhoneCall className="w-2.5 h-2.5" />
                          <span>{t('presence.busy')}</span>
                        </span>
                      ) : agent.status === 'PAUSED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                          <Coffee className="w-2.5 h-2.5" />
                          <span>{t('presence.paused')}</span>
                        </span>
                      ) : agent.status === 'IDLE' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{t('presence.idle')}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                          <Circle className="w-1.5 h-1.5 text-slate-400" />
                          <span>{t('presence.offline')}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Link to Productivity */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
            <Link
              href="/productivity"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1"
            >
              <span>{t('presence.viewProductivity')}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
