'use client';

import React from 'react';
import { usePresence } from '@/context/PresenceContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Radio, PhoneCall, Coffee, Clock, CheckCircle2, Circle } from 'lucide-react';

export default function CallCenterLivePresenceBar() {
  const { agents, summary, myStatusIntent, setMyStatusIntent } = usePresence();
  const { currentUser, isCallAgent, isManager } = useAuth();
  const { t } = useLanguage();

  // Strictly hide presence monitoring strip from standard users / agents
  if (!isManager) {
    return null;
  }

  const activeAgents = agents.filter((a) => a.status !== 'OFFLINE');

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Section Header & Count */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">{t('presence.liveBarTitle')}</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                {summary.online + summary.busy} {t('presence.online')}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {summary.busy > 0
                ? `${summary.busy} en communication téléphonique • ${summary.online} prêts à recevoir des leads`
                : `${summary.online} agents disponibles immédiatement`}
            </p>
          </div>
        </div>

        {/* Center: Live Agents Avatars Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {activeAgents.length === 0 ? (
            <span className="text-xs text-slate-400 italic py-1">{t('presence.noAgents')}</span>
          ) : (
            activeAgents.map((agent) => {
              const isCurrent = agent.id === currentUser?.id;
              return (
                <div
                  key={agent.id}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs shrink-0 transition-all ${
                    agent.status === 'BUSY'
                      ? 'bg-amber-50/80 border-amber-300 text-amber-900 shadow-2xs'
                      : agent.status === 'PAUSED'
                      ? 'bg-orange-50/80 border-orange-300 text-orange-900'
                      : agent.status === 'ONLINE'
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                  title={`${agent.name} - ${agent.currentActivity}`}
                >
                  {/* Status dot */}
                  <span className="relative flex h-2 w-2 shrink-0">
                    {agent.status === 'BUSY' ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </>
                    ) : agent.status === 'ONLINE' ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </>
                    ) : agent.status === 'PAUSED' ? (
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    ) : (
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
                    )}
                  </span>

                  {/* Name */}
                  <span className="font-bold text-[11px] truncate max-w-[110px]">
                    {agent.name} {isCurrent && '(Vous)'}
                  </span>

                  {/* Status label / Order badge */}
                  {agent.status === 'BUSY' ? (
                    <span className="inline-flex items-center gap-0.5 bg-amber-200/80 text-amber-900 text-[9px] font-black px-1.5 py-0.5 rounded-md">
                      <PhoneCall className="w-2.5 h-2.5" />
                      <span>{agent.currentOrderNumber ? `#${agent.currentOrderNumber}` : t('presence.busy')}</span>
                    </span>
                  ) : agent.status === 'PAUSED' ? (
                    <span className="inline-flex items-center gap-0.5 bg-orange-200/80 text-orange-900 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                      <Coffee className="w-2.5 h-2.5" />
                      <span>{t('presence.paused')}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-700 font-semibold">
                      {agent.todayConfirmed > 0 && `(✅ ${agent.todayConfirmed})`}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right: Quick Pause / Available Toggle for current agent */}
        {isCallAgent && currentUser && (
          <div className="flex items-center gap-1 shrink-0 self-end md:self-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setMyStatusIntent('AVAILABLE')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                myStatusIntent === 'AVAILABLE'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('presence.setAvailable')}
            </button>
            <button
              onClick={() => setMyStatusIntent('PAUSED')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                myStatusIntent === 'PAUSED'
                  ? 'bg-orange-500 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('presence.setPaused')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
