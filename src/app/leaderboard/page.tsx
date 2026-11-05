'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Trophy,
  Crown,
  Medal,
  Gift,
  Sparkles,
  TrendingUp,
  Target,
  Award,
  Zap,
  CheckCircle2,
  Clock,
  Settings,
  X,
  Check,
  Flame,
  Star,
  Users,
} from 'lucide-react';

export default function LeaderboardPage() {
  const { selectedStoreId, currentCountry } = useStore();
  const { currentUser, isAdmin } = useAuth();
  const { t } = useLanguage();

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [challenge, setChallenge] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Admin Edit Challenge Modal
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editTarget, setEditTarget] = useState('150');
  const [editRewardTitle, setEditRewardTitle] = useState('');
  const [editRewardDesc, setEditRewardDesc] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?storeId=${selectedStoreId}`);
      const data = await res.json();
      if (data.success) {
        setLeaderboard(data.leaderboard);
        setChallenge(data.challenge);
        setEditTarget(String(data.challenge.targetDelivered));
        setEditRewardTitle(data.challenge.rewardTitle);
        setEditRewardDesc(data.challenge.rewardDescription);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedStoreId, currentCountry?.code]);

  const handleSaveChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetDelivered: editTarget,
          rewardTitle: editRewardTitle,
          rewardDescription: editRewardDesc,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setChallenge(data.challenge);
        setShowConfigModal(false);
        fetchLeaderboard();
      } else {
        alert(data.error || 'Erreur');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Find active user's stats
  const activeAgentStats = leaderboard.find((a) => a.id === currentUser?.id);

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                <span>{t('lead.title')}</span>
                <span className="text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full capitalize">
                  {challenge?.monthName || 'Mois en cours'}
                </span>
              </h1>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                {t('lead.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Paramétrer l'Objectif & le Cadeau</span>
          </button>
        )}
      </div>

      {/* Target & Cadeau Banner */}
      {challenge && (
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-orange-50/30 border-2 border-amber-300/80 rounded-2xl p-6 shadow-xs relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs tracking-wider uppercase shadow-xs">
                <Gift className="w-3.5 h-3.5" />
                <span>Objectif & Cadeau du Mois 🎁</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {challenge.rewardTitle}
              </h2>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {challenge.rewardDescription}
              </p>
            </div>

            {/* Target Badge Counter */}
            <div className="flex items-center gap-4 bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-amber-200 shadow-sm shrink-0">
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Palier à Atteindre</span>
                <span className="text-3xl font-black text-slate-900 font-mono">
                  {challenge.targetDelivered}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Colis Livrés</span>
              </div>
              <div className="h-10 w-px bg-slate-200" />
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gagnants Actuels</span>
                <span className="text-3xl font-black text-emerald-600 font-mono">
                  {leaderboard.filter((a) => a.isTargetAchieved).length}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Qualifié(s) 🎉</span>
              </div>
            </div>
          </div>

          {/* Active Agent's Personal Progress Bar (If Call Agent) */}
          {activeAgentStats && (
            <div className="mt-5 pt-4 border-t border-amber-200/60">
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-800 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>Votre Progression Personnelle ({activeAgentStats.name}) :</span>
                </span>
                <span className="text-amber-800 font-mono">
                  {activeAgentStats.deliveredCount} / {challenge.targetDelivered} livraisons ({activeAgentStats.progressPercent}%)
                </span>
              </div>

              <div className="w-full bg-amber-100 rounded-full h-3.5 p-0.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500 shadow-xs flex items-center justify-end pr-1 text-[9px] font-black text-white"
                  style={{ width: `${Math.max(5, activeAgentStats.progressPercent)}%` }}
                >
                  {activeAgentStats.progressPercent}%
                </div>
              </div>

              <p className="text-[11px] text-slate-600 font-medium mt-1.5">
                {activeAgentStats.isTargetAchieved ? (
                  <span className="text-emerald-700 font-bold">
                    🎉 Félicitations ! Vous avez dépassé l'objectif du mois et décroché le cadeau officiel !
                  </span>
                ) : (
                  <span>
                    Plus que <strong className="text-amber-700 font-black">{activeAgentStats.remainingForTarget} commandes livrées</strong> pour débloquer votre cadeau ! Continuez sur cette lancée ! 🚀
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Podium des Champions (Top 3) */}
      {leaderboard.length >= 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="text-center max-w-md mx-auto mb-6">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">Top Performers</span>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Le Podium des Champions 🏆</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4 max-w-4xl mx-auto">
            {/* 2ème Place (Silver) */}
            {top2 && (
              <div className="bg-gradient-to-t from-slate-100 to-white rounded-2xl border-2 border-slate-200 p-5 text-center relative order-2 md:order-1 hover:shadow-md transition-all">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-300 text-slate-800 font-black text-[11px] px-3 py-0.5 rounded-full border border-slate-400 flex items-center gap-1 shadow-xs">
                  <Medal className="w-3.5 h-3.5 text-slate-600" />
                  <span>2ème Place</span>
                </div>

                <div className="w-16 h-16 rounded-full bg-slate-200 text-slate-700 font-black text-xl flex items-center justify-center mx-auto mb-2 border-4 border-slate-300 shadow-xs">
                  {top2.name.slice(0, 2).toUpperCase()}
                </div>

                <h4 className="font-black text-sm text-slate-900 truncate">{top2.name}</h4>
                <div className="text-xs text-slate-500 font-medium">{top2.deliveryRate}% de livraison</div>

                <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Livrées</span>
                    <span className="text-base font-black text-slate-800">{top2.deliveredCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">UpSells</span>
                    <span className="text-base font-black text-indigo-600">{top2.upsellCount}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 1ère Place (Gold - Taller & Highlighted) */}
            {top1 && (
              <div className="bg-gradient-to-t from-amber-50/80 via-white to-amber-50/30 rounded-2xl border-3 border-amber-400 p-6 text-center relative order-1 md:order-2 shadow-lg hover:shadow-xl transition-all scale-105 z-10">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 font-black text-xs px-4 py-1 rounded-full border-2 border-amber-500 flex items-center gap-1.5 shadow-md animate-bounce">
                  <Crown className="w-4 h-4 text-amber-950" />
                  <span>1ère Place • Leader</span>
                </div>

                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black text-2xl flex items-center justify-center mx-auto mb-2 border-4 border-white shadow-md">
                  {top1.name.slice(0, 2).toUpperCase()}
                </div>

                <h4 className="font-black text-base text-slate-900 truncate">{top1.name}</h4>
                <div className="text-xs text-amber-700 font-bold flex items-center justify-center gap-1 mt-0.5">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{top1.deliveryRate}% de réussite</span>
                </div>

                <div className="mt-4 pt-3 border-t border-amber-200 grid grid-cols-2 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Colis Livrés</span>
                    <span className="text-xl font-black text-slate-950">{top1.deliveredCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Packs UpSell</span>
                    <span className="text-xl font-black text-indigo-600">{top1.upsellCount}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 text-[11px] font-extrabold text-amber-800 bg-amber-100/70 py-1 rounded-lg">
                  🏆 {top1.points} Points Gamification
                </div>
              </div>
            )}

            {/* 3ème Place (Bronze) */}
            {top3 && (
              <div className="bg-gradient-to-t from-orange-50/50 to-white rounded-2xl border-2 border-amber-200 p-5 text-center relative order-3 md:order-3 hover:shadow-md transition-all">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-700/80 text-white font-black text-[11px] px-3 py-0.5 rounded-full border border-amber-800 flex items-center gap-1 shadow-xs">
                  <Medal className="w-3.5 h-3.5 text-amber-300" />
                  <span>3ème Place</span>
                </div>

                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-900 font-black text-xl flex items-center justify-center mx-auto mb-2 border-4 border-amber-200 shadow-xs">
                  {top3.name.slice(0, 2).toUpperCase()}
                </div>

                <h4 className="font-black text-sm text-slate-900 truncate">{top3.name}</h4>
                <div className="text-xs text-slate-500 font-medium">{top3.deliveryRate}% de livraison</div>

                <div className="mt-3 pt-3 border-t border-amber-100 grid grid-cols-2 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Livrées</span>
                    <span className="text-base font-black text-slate-800">{top3.deliveredCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">UpSells</span>
                    <span className="text-base font-black text-indigo-600">{top3.upsellCount}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600" />
            <h3 className="font-black text-sm text-slate-900">{t('lead.heroTitle')}</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {leaderboard.length} {t('presence.agentsOnline')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-14 text-center">{t('lead.rank')}</th>
                <th className="py-3 px-4">{t('lead.agent')}</th>
                <th className="py-3 px-4 text-center">{t('lead.confirmRate')}</th>
                <th className="py-3 px-4 text-center">{t('lead.delivered')}</th>
                <th className="py-3 px-4 text-center">{t('lead.deliveryRate')}</th>
                <th className="py-3 px-4 text-center">{t('lead.upsellSales')}</th>
                <th className="py-3 px-4 text-center">{t('lead.monthlyGoal')}</th>
                <th className="py-3 px-4 text-right">{t('lead.bonus')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-xs text-slate-400 font-semibold">
                    Aucun agent de confirmation affecté à {currentCountry.name} pour le moment.
                  </td>
                </tr>
              ) : (
                leaderboard.map((agent) => {
                const isMe = agent.id === currentUser?.id;
                return (
                  <tr
                    key={agent.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isMe ? 'bg-indigo-50/40 font-bold' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 text-center">
                      {agent.rank === 1 ? (
                        <span className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center justify-center shadow-xs">
                          1
                        </span>
                      ) : agent.rank === 2 ? (
                        <span className="w-7 h-7 rounded-full bg-slate-300 text-slate-800 font-black text-xs inline-flex items-center justify-center shadow-xs">
                          2
                        </span>
                      ) : agent.rank === 3 ? (
                        <span className="w-7 h-7 rounded-full bg-amber-700 text-white font-black text-xs inline-flex items-center justify-center shadow-xs">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono font-bold">{agent.rank}</span>
                      )}
                    </td>

                    {/* Agent details & Badges */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {agent.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 flex items-center gap-1.5">
                            <span>{agent.name}</span>
                            {isMe && (
                              <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-bold">
                                Vous
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {agent.badges.map((b: string) => (
                              <span
                                key={b}
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {b}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Confirmation Rate */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-slate-800">{agent.confirmationRate}%</span>
                      <span className="text-[10px] text-slate-400 block">
                        ({agent.confirmedCount}/{agent.totalAssigned})
                      </span>
                    </td>

                    {/* Delivered Orders */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-sm font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {agent.deliveredCount}
                      </span>
                    </td>

                    {/* Delivery Rate */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-black text-xs ${
                          agent.deliveryRate >= 75
                            ? 'text-emerald-600'
                            : agent.deliveryRate >= 60
                            ? 'text-blue-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {agent.deliveryRate}%
                      </span>
                    </td>

                    {/* UpSells */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                        <Sparkles className="w-3 h-3" />
                        <span>{agent.upsellCount} UpSells</span>
                      </span>
                    </td>

                    {/* Monthly Target Status */}
                    <td className="py-3.5 px-4 text-center">
                      {agent.isTargetAchieved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px] border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Cadeau Décroché 🎁</span>
                        </span>
                      ) : (
                        <div className="w-32 mx-auto">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-0.5">
                            <span>{agent.deliveredCount} / {challenge?.targetDelivered}</span>
                            <span>{agent.progressPercent}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full"
                              style={{ width: `${agent.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Gamification Points */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-black text-slate-900 text-sm font-mono">
                        {agent.points} pts
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          </table>
        </div>
      </div>

      {/* Gamification Guide & Motivation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-1">
            <Crown className="w-4 h-4 text-amber-500" />
            <span>Leader du Mois 👑</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Attribué à l'agent ayant le plus grand nombre de commandes livrées et le meilleur score.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-1">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Reine de l'UpSell 🚀</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Récompense la capacité à proposer des packs additionnels (+15 points par UpSell validé).
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-1">
            <Target className="w-4 h-4 text-emerald-600" />
            <span>Précision Maximale 🎯</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Pour les confirmatrices ayant un taux de livraison supérieur à 75% avec un faible taux de retour.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-1">
            <Gift className="w-4 h-4 text-purple-600" />
            <span>Cadeau Garanti 🎁</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Accessible à toute l'équipe sans exception : dès que le palier est franchi, le cadeau est versé !
          </p>
        </div>
      </div>

      {/* Admin Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-sm text-white">Paramétrer le Challenge du Mois</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChallenge} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  🎯 Palier de Commandes Livrées pour le Cadeau
                </label>
                <input
                  type="number"
                  value={editTarget}
                  onChange={(e) => setEditTarget(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Ex: 100, 150 ou 200 commandes livrées dans le mois.
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  🎁 Titre de la Récompense / Cadeau
                </label>
                <input
                  type="text"
                  value={editRewardTitle}
                  onChange={(e) => setEditRewardTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  📝 Description & Message de Motivation
                </label>
                <textarea
                  rows={3}
                  value={editRewardDesc}
                  onChange={(e) => setEditRewardDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-black flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingConfig ? 'Enregistrement...' : 'Enregistrer le Challenge'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
