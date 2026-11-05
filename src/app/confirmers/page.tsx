'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import AccessDenied from '@/components/AccessDenied';
import {
  Users,
  CheckCircle2,
  DollarSign,
  PhoneCall,
  Clock,
  TrendingUp,
  Receipt,
  Check,
  FileText,
  Printer,
  X,
  Building2,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';

export default function ConfirmersPage() {
  const { selectedStoreId, currentCountry } = useStore();
  const currency = currentCountry.currency;
  const { canViewPage } = useAuth();
  const { t } = useLanguage();
  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Payment Modal State
  const [payingAgent, setPayingAgent] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Virement CIH Bank');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);

  const fetchConfirmers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/confirmers?storeId=${selectedStoreId}`);
      const data = await res.json();
      if (data.success) {
        setReport(data.report);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfirmers();
  }, [selectedStoreId, currentCountry?.code]);

  const handleOpenPaymentModal = (agent: any) => {
    setPayingAgent(agent);
    setPaymentMethod(agent.bankName ? `Virement ${agent.bankName}` : 'Virement CIH Bank');
    setTransactionRef(`VIR-${Date.now().toString().slice(-6)}`);
    setPaymentNotes('');
  };

  const handleConfirmPayout = async () => {
    if (!payingAgent) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/confirmers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PAY_COMMISSIONS',
          agentId: payingAgent.id,
          paymentMethod,
          transactionRef,
          notes: paymentNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPayingAgent(null);
        setReceipt(data.receipt);
        fetchConfirmers();
      } else {
        alert(data.error || 'Erreur lors du règlement');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canViewPage('/confirmers')) {
    return <AccessDenied moduleName="la Facturation & Commissions des Confirmateurs" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            👨‍💼 {t('conf.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('conf.subtitle')}
          </p>
        </div>
      </div>

      {/* Agents Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {report.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">{t('presence.noAgents')} ({currentCountry.name})</h3>
            <p className="text-xs text-slate-400 mt-1">
              {t('admin.subtitle')}
            </p>
          </div>
        ) : (
          report.map((agent) => (
            <div key={agent.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
            <div>
              {/* Agent Title & Commission Rate */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {agent.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{agent.name}</h3>
                    <span className="text-[11px] text-slate-500">{agent.email}</span>
                    {agent.bankName && (
                      <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 block mt-1 font-semibold w-fit">
                        🏦 {agent.bankName} {agent.bankRib ? `(${agent.bankRib.slice(-4)})` : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">{t('admin.colCommissions')}</span>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                      {agent.commissionFee} {currency} / {t('status.delivered')}
                    </span>
                    {agent.upsellCommissionFee !== undefined && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        +{agent.upsellCommissionFee} {currency} UpSell
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-2 gap-3 py-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">{t('lead.confirmRate')}</span>
                  <span className="text-base font-extrabold text-slate-900">{agent.confirmationRate}%</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {agent.confirmedOrders} / {agent.totalOrders} {t('dash.kpi.leads')}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">{t('lead.deliveryRate')}</span>
                  <span className="text-base font-extrabold text-emerald-600">{agent.deliveryRate}%</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {agent.deliveredOrders} {t('status.delivered')}
                  </span>
                </div>
              </div>

              {/* Facturation Details */}
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{t('comm.totalEarned')} :</span>
                  <span className="font-bold text-slate-200">{agent.totalEarnedCommission} {currency}</span>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t('conf.paidPayout')} :</span>
                    </span>
                    <span className="font-extrabold text-emerald-400 text-sm">{agent.unlockedPayout || 0} {currency}</span>
                  </div>
                  <div className="text-[10px] text-emerald-300/80">
                    ✓ {agent.unlockedOrdersCount || 0} {t('orders.selectedItems')}
                  </div>

                  {(agent.lockedPayout || 0) > 0 && (
                    <div className="pt-1.5 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-amber-300">
                        <span className="flex items-center gap-1 font-semibold">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>{t('conf.pendingPayout')} :</span>
                        </span>
                        <span className="font-bold">{agent.lockedPayout} {currency}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ⏳ {agent.lockedOrdersCount} {t('orders.selectedItems')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="pt-4 mt-2 space-y-2">
              <Link
                href="/my-commissions"
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>{t('conf.viewStatement')}</span>
              </Link>

              <button
                onClick={() => handleOpenPaymentModal(agent)}
                disabled={(agent.unlockedPayout || 0) === 0}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{t('conf.payCommission')} ({agent.unlockedPayout || 0} {currency})</span>
              </button>
            </div>
          </div>
        ))
      )}
    </div>

      {/* 1. Modal Saisie Règlement / Virement */}
      {payingAgent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Règlement des Commissions Débloquées</h3>
                  <p className="text-[11px] text-slate-400">Agent : {payingAgent.name}</p>
                </div>
              </div>
              <button
                onClick={() => setPayingAgent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* Financial Recap Box */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-emerald-800 font-semibold block">Montant Débloqué à Régler (Versé par Transporteur)</span>
                  <span className="text-2xl font-black text-emerald-700">{payingAgent.unlockedPayout || payingAgent.pendingPayout} {currency}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-emerald-800 font-semibold block">Commandes Encaissées</span>
                  <span className="text-sm font-black text-emerald-900 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                    {payingAgent.unlockedOrdersCount || payingAgent.unpaidOrdersCount} colis
                  </span>
                </div>
              </div>

              {payingAgent.lockedPayout > 0 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Note Transparence :</strong> {payingAgent.lockedPayout} {currency} ({payingAgent.lockedOrdersCount} colis) restent en attente du versement de la société de livraison avant déblocage.
                  </span>
                </div>
              )}

              {/* Coordonnées Bancaires de l'Agent */}
              {(payingAgent.bankName || payingAgent.bankRib) && (
                <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 text-indigo-950 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-700 block">Banque & RIB de l'Agent</span>
                      <span className="text-xs font-black text-slate-900">{payingAgent.bankName || 'Compte Bancaire'}</span>
                      {payingAgent.bankRib ? (
                        <span className="text-[11px] font-mono text-slate-700 block font-bold mt-0.5">
                          {payingAgent.bankRib}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic block">RIB non renseigné</span>
                      )}
                    </div>
                  </div>

                  {payingAgent.bankRib && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(payingAgent.bankRib);
                        alert(`✅ RIB de ${payingAgent.name} copié dans le presse-papier !`);
                      }}
                      className="px-2.5 py-1.5 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-300 rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      title="Copier le RIB pour faire le virement bancaire"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Copier RIB</span>
                    </button>
                  )}
                </div>
              )}

              {/* Payment Method Selector */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Mode de Paiement</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  {payingAgent.bankName && (
                    <option value={`Virement ${payingAgent.bankName}`}>
                      🏦 Virement {payingAgent.bankName} (Compte de l'agent)
                    </option>
                  )}
                  <option value="Virement CIH Bank">🏦 Virement CIH Bank</option>
                  <option value="Virement Attijariwafa Bank">🏦 Virement Attijariwafa Bank</option>
                  <option value="Virement Banque Populaire">🏦 Virement Banque Populaire (Chaabi)</option>
                  <option value="Virement Bank of Africa (BMCE)">🏦 Virement Bank of Africa (BMCE)</option>
                  <option value="Virement Al Barid Bank">🏦 Virement Al Barid Bank</option>
                  <option value="Virement CFG Bank">🏦 Virement CFG Bank</option>
                  <option value="Paiement Espèces (Cash)">💵 Paiement en Espèces (Cash)</option>
                  <option value="Chèque Bancaire">📝 Chèque Bancaire</option>
                </select>
              </div>

              {/* Transaction Reference */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Référence de la Transaction / N° d'Opération
                </label>
                <input
                  type="text"
                  placeholder="Ex: VIR-CIH-202610-8492"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Notes & Remarques (Optionnel)</label>
                <input
                  type="text"
                  placeholder="Ex: Virement des commissions de la 2ème semaine d'Octobre"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPayingAgent(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayout}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Validation...' : 'Valider & Émettre Reçu'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Reçu Officiel de Paiement & Décharge Financière */}
      {receipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Top Bar */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between print:hidden">
              <span className="font-bold text-xs flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Règlement enregistré avec succès ! Reçu officiel généré</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer le Reçu</span>
                </button>
                <button
                  onClick={() => setReceipt(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Container */}
            <div id="payment-receipt" className="p-8 space-y-6 text-xs bg-white text-slate-900">
              {/* Receipt Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
                      COD
                    </div>
                    <span className="text-xl font-black tracking-tight text-slate-900">COD MASTER PLATFORM</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-semibold">
                    Plateforme ERP E-commerce & Confirmation Maroc
                  </p>
                </div>

                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 font-black rounded-lg text-xs tracking-wider uppercase border border-emerald-300">
                    Reçu de Paiement • Payé
                  </span>
                  <div className="text-slate-500 font-mono text-[11px] mt-1.5">
                    N° Reçu : <span className="font-bold text-slate-900">{receipt.receiptNumber}</span>
                  </div>
                  <div className="text-slate-500 font-mono text-[11px]">
                    Date : {new Date(receipt.paidAt).toLocaleDateString('fr-FR')} à {new Date(receipt.paidAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              {/* Beneficiary & Method Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Bénéficiaire (Agent de Confirmation)</span>
                  <div className="font-black text-sm text-slate-900 mt-0.5">{receipt.agentName}</div>
                  <div className="text-slate-600 text-[11px]">{receipt.agentEmail}</div>
                  {receipt.agentPhone && <div className="text-slate-500 text-[11px] font-mono">{receipt.agentPhone}</div>}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mode & Référence de Transaction</span>
                  <div className="font-black text-sm text-emerald-700 mt-0.5">{receipt.paymentMethod}</div>
                  <div className="text-slate-700 font-mono text-[11px] font-bold">Réf: {receipt.transactionRef}</div>
                  {receipt.notes && <div className="text-slate-500 text-[11px] italic mt-0.5">"{receipt.notes}"</div>}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Désignation</th>
                      <th className="py-2.5 px-4 text-center">Nombre Commandes</th>
                      <th className="py-2.5 px-4 text-right">Montant Total Réglé</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">Commissions sur Commandes Livrées (DELIVERED)</div>
                        <div className="text-slate-400 text-[10px]">
                          Règlement complet et définitif des commandes confirmées et livrées avec succès
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">
                        {receipt.paidOrdersCount}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-700 text-sm">
                        {receipt.totalAmount} {currency}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200 font-black">
                    <tr>
                      <td colSpan={2} className="py-3 px-4 text-right text-slate-700 uppercase tracking-wider text-xs">
                        Net Versé au Bénéficiaire :
                      </td>
                      <td className="py-3 px-4 text-right text-lg text-emerald-600">
                        {receipt.totalAmount} {currency}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures & Legal Discharge */}
              <div className="pt-6 grid grid-cols-2 gap-8 border-t border-slate-200 text-center">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block mb-8">Pour la Direction Générale (Émetteur)</span>
                  <div className="inline-block border-b border-dashed border-slate-400 px-8 pb-1 text-[11px] font-bold text-slate-700">
                    Validé par Admin • Cachet
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-500 block mb-8">Pour le Bénéficiaire (Décharge de Règlement)</span>
                  <div className="inline-block border-b border-dashed border-slate-400 px-8 pb-1 text-[11px] font-bold text-slate-700">
                    Reçu avec remerciements
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
