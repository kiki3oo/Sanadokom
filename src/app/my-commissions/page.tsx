'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Receipt,
  CheckCircle2,
  Clock,
  Printer,
  DollarSign,
  TrendingUp,
  MapPin,
  Calendar,
  AlertCircle,
  FileText,
  PackageCheck,
  Building2,
  User,
  ArrowRight,
  Filter,
} from 'lucide-react';

export default function MyCommissionsPage() {
  const { selectedStoreId, stores, currentCountry } = useStore();
  const currency = currentCountry.currency;
  const { currentUser, isAdmin, allUsers } = useAuth();
  const { t } = useLanguage();

  const [statement, setStatement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');

  // Filter agents by stores of the active country
  const targetStoreIds = selectedStoreId && selectedStoreId !== 'ALL'
    ? selectedStoreId.split(',')
    : stores.map((s) => s.id);

  const agentsList = allUsers.filter((u) => {
    if (u.role !== 'CALL_AGENT') return false;
    if (u.permissions) {
      try {
        const p = JSON.parse(u.permissions);
        if (Array.isArray(p.assignedStoreIds)) {
          return p.assignedStoreIds.some((id: string) => targetStoreIds.includes(id));
        }
      } catch (e) {}
    }
    return false;
  });

  // For Admin: allow selecting which agent's statement to view
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  useEffect(() => {
    if (isAdmin && agentsList.length > 0) {
      const exists = agentsList.some((a) => a.id === selectedAgentId);
      if (!exists) {
        setSelectedAgentId(agentsList[0].id);
      }
    }
  }, [isAdmin, agentsList, selectedAgentId]);

  const targetAgentId = isAdmin && selectedAgentId ? selectedAgentId : currentUser?.id;

  const fetchStatement = async () => {
    if (!targetAgentId) return;
    setLoading(true);
    try {
      let url = `/api/confirmers/statement?agentId=${targetAgentId}&status=${filterTab}`;
      if (selectedStoreId !== 'ALL') {
        url += `&storeId=${selectedStoreId}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setStatement(data);
      }
    } catch (e) {
      console.error('Error loading statement:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetAgentId) {
      fetchStatement();
    }
  }, [targetAgentId, selectedStoreId, filterTab]);

  const handlePrint = () => {
    window.print();
  };

  const summary = statement?.summary || {
    totalAssigned: 0,
    confirmedCount: 0,
    deliveredCount: 0,
    returnedCount: 0,
    confirmationRate: '0.0',
    deliveryRate: '0.0',
    paidOrdersCount: 0,
    unpaidOrdersCount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    totalEarned: 0,
  };

  const agent = statement?.agent || currentUser;
  const orders = statement?.orders || [];
  const invoiceNumber = `FAC-${agent?.name?.slice(0, 3).toUpperCase() || 'AGT'}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const currentDateStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Printable Area Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Screen Header (Hidden on Print) */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {isAdmin ? t('conf.title') : t('comm.title')}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5" />
              <span>{agent?.commissionFee || 10} {currency} / {t('status.delivered')}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('comm.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && agentsList.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-600 ml-1">{t('table.agent')} :</span>
              <select
                value={selectedAgentId || ''}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="bg-transparent font-extrabold text-slate-800 pr-2 focus:outline-none cursor-pointer"
              >
                {agentsList.map((a) => (
                  <option key={a.id} value={a.id}>
                    🎧 {a.name} ({a.commissionFee} {currency})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>PDF / {t('common.print', 'Imprimer')}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards (Hidden on Print) */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earned */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('comm.totalEarned')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {summary.totalEarned.toLocaleString()} {currency}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {summary.deliveredCount} {t('orders.deliveredTab')}
          </div>
        </div>

        {/* Paid Commissions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('comm.paid')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            {summary.paidAmount.toLocaleString()} {currency}
          </div>
          <div className="text-xs text-emerald-700 font-semibold mt-1">
            ✅ {summary.paidOrdersCount} {t('orders.selectedItems')}
          </div>
        </div>

        {/* Pending Payout */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('comm.due')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {summary.pendingAmount.toLocaleString()} {currency}
          </div>
          <div className="text-[11px] text-slate-600 font-medium mt-1 space-y-0.5">
            <div className="text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>✓ {summary.unlockedAmount || 0} {currency} ({summary.unlockedOrdersCount || 0} colis)</span>
            </div>
          </div>
        </div>

        {/* Delivery Quality */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('lead.deliveryRate')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-600 mt-2">
            {summary.deliveryRate}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {t('lead.confirmRate')} : {summary.confirmationRate}% ({summary.confirmedCount}/{summary.totalAssigned})
          </div>
        </div>
      </div>

      {/* PRINTABLE INVOICE CONTAINER */}
      <div id="printable-invoice" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        {/* Invoice Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
                COD
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                BORDEREAU & FACTURE DE CONFIRMATION
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Réf : {invoiceNumber} • Date : {currentDateStr}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Bénéficiaire (Agent)
            </span>
            <div className="text-base font-extrabold text-slate-900">{agent?.name}</div>
            <div className="text-xs text-slate-500 font-mono">{agent?.email}</div>
            {agent?.phone && <div className="text-xs text-slate-500 font-mono">{agent.phone}</div>}
          </div>
        </div>

        {/* Financial Summary Highlight Box */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-[11px] text-slate-500 uppercase font-semibold">Tarif Commission</span>
            <div className="text-base font-black text-slate-900">{agent?.commissionFee || 10} {currency} / Livré</div>
            <span className="text-[10px] text-slate-400">Par colis livré avec succès</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 uppercase font-semibold">Total Réglé (Virement Reçu)</span>
            <div className="text-base font-black text-emerald-600">{summary.paidAmount.toLocaleString()} {currency}</div>
            <span className="text-[10px] text-emerald-700 font-semibold">{summary.paidOrdersCount} colis payés</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 uppercase font-semibold">Solde Restant à Régler</span>
            <div className="text-base font-black text-amber-600">{summary.pendingAmount.toLocaleString()} {currency}</div>
            <span className="text-[10px] text-amber-700 font-semibold">{summary.unpaidOrdersCount} colis en attente</span>
          </div>
        </div>

        {/* Tab Filter Switcher (Hidden on Print) */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 pb-3 pt-2">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setFilterTab('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterTab === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Toutes les Livraisons ({summary.deliveredCount})
            </button>
            <button
              onClick={() => setFilterTab('PAID')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterTab === 'PAID' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ✅ Déjà Payées ({summary.paidOrdersCount})
            </button>
            <button
              onClick={() => setFilterTab('UNPAID')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterTab === 'UNPAID' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ⏳ En Attente de Règlement ({summary.unpaidOrdersCount})
            </button>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            {orders.length} commande(s) affichée(s)
          </span>
        </div>

        {/* Detailed Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">N° Commande</th>
                <th className="py-3 px-3">Date Livraison</th>
                <th className="py-3 px-3">Boutique</th>
                <th className="py-3 px-3">Client & Ville</th>
                <th className="py-3 px-3">Produit / Offre</th>
                <th className="py-3 px-3 text-right">Montant Encaissé</th>
                <th className="py-3 px-3 text-right">Commission</th>
                <th className="py-3 px-3 text-center">Statut Facturation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {orders.length > 0 ? (
                orders.map((order: any) => {
                  const delivDate = order.deliveredAt
                    ? new Date(order.deliveredAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : new Date(order.createdAt).toLocaleDateString('fr-FR');

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        #{order.orderNumber}
                      </td>

                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {delivDate}
                      </td>

                      <td className="py-3 px-3 text-slate-600">
                        {order.store?.name}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{order.customerName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{order.customerCity}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-slate-800 font-semibold truncate max-w-[180px]">
                          {order.items && order.items[0]?.product?.name || 'Article'}
                        </div>
                        {order.upsell && (
                          <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                            + {order.upsell}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-slate-700">
                        {order.totalAmount} {order.store?.currency || currency}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="font-black text-indigo-600">
                          {order.confirmerFee || agent?.commissionFee || 10} {currency}
                        </div>
                        {order.upsell && (
                          <div className="text-[10px] text-emerald-600 font-bold whitespace-nowrap">
                            (Base {agent?.commissionFee || 10} + UpSell +{Math.max(0, (order.confirmerFee || 10) - (agent?.commissionFee || 10))} {currency})
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {order.confirmerPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Réglé (Payé)</span>
                          </span>
                        ) : ['VERSE', 'PAYE'].includes(order.courierStatus) ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200" title="Fonds encaissés chez le transporteur, prêt à payer">
                            <CheckCircle2 className="w-3 h-3 text-teal-600" />
                            <span>Débloqué (Transporteur versé)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200" title="En attente du virement de la société de livraison">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>En attente versement transporteur</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Aucune commande trouvée pour ce filtre.
                  </td>
                </tr>
              )}
            </tbody>
            {/* Table Footer Totals */}
            <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
              <tr>
                <td colSpan={6} className="py-3 px-3 text-right text-slate-700 uppercase text-xs">
                  Total Commissions Affichées :
                </td>
                <td className="py-3 px-3 text-right text-indigo-700 text-sm font-black">
                  {orders.reduce((sum: number, o: any) => sum + (o.confirmerFee || agent?.commissionFee || 10), 0)} {currency}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Invoice Footer (Signatures & Terms) */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            <p className="font-semibold text-slate-700">Mode de Règlement : Virement Bancaire / Versement Espèces</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Ce document certifie le détail des commissions dues au titre des commandes livrées et encaissées.
            </p>
          </div>

          <div className="text-left sm:text-right border border-slate-200 p-3 rounded-xl bg-slate-50 min-w-[200px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Visa / Validation Direction</span>
            <span className="text-xs font-bold text-emerald-700 mt-1 block">✓ Relevé Certifié Conforme</span>
          </div>
        </div>
      </div>
    </div>
  );
}
