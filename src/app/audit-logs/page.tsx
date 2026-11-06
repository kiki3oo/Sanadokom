'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { useLanguage } from '@/context/LanguageContext';
import AccessDenied from '@/components/AccessDenied';
import {
  History,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  User,
  Clock,
  ArrowRight,
  Package,
  DollarSign,
  Boxes,
  Users,
  Eye,
  X,
  Calendar,
  AlertCircle,
  CheckCircle2,
  PhoneCall,
  Trash2,
  Edit3,
} from 'lucide-react';

interface AuditLog {
  id: string;
  userId: string | null;
  userName: string;
  userRole: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: string;
  oldValue: string | null;
  newValue: string | null;
  orderId: string | null;
  storeId: string | null;
  createdAt: string;
}

const ACTION_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
> = {
  STATUS_CHANGE: {
    label: 'Changement de Statut',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
  },
  ORDER_EDIT: {
    label: 'Modification Commande',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: <Edit3 className="w-3.5 h-3.5 text-blue-600" />,
  },
  LEAD_LOCKED: {
    label: 'Prise en Charge Lead',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: <PhoneCall className="w-3.5 h-3.5 text-purple-600" />,
  },
  ORDER_ASSIGN: {
    label: 'Assignation Commande',
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    icon: <Users className="w-3.5 h-3.5 text-cyan-600" />,
  },
  BULK_ASSIGN: {
    label: 'Assignation en Masse',
    bg: 'bg-cyan-50',
    text: 'text-cyan-800',
    border: 'border-cyan-300',
    icon: <Users className="w-3.5 h-3.5 text-cyan-700" />,
  },
  ORDER_DELETE: {
    label: 'Suppression Commande',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: <Trash2 className="w-3.5 h-3.5 text-rose-600" />,
  },
  STOCK_UPDATE: {
    label: 'Mouvement de Stock',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: <Boxes className="w-3.5 h-3.5 text-amber-700" />,
  },
  EXPENSE_ADD: {
    label: 'Ajout de Charge',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    icon: <DollarSign className="w-3.5 h-3.5 text-indigo-600" />,
  },
  EXPENSE_DELETE: {
    label: 'Suppression Charge',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: <Trash2 className="w-3.5 h-3.5 text-rose-600" />,
  },
  USER_CREATE: {
    label: 'Création Utilisateur',
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-300',
    icon: <User className="w-3.5 h-3.5 text-slate-700" />,
  },
  USER_EDIT: {
    label: 'Modification Utilisateur',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    icon: <User className="w-3.5 h-3.5 text-slate-600" />,
  },
};

export default function AuditLogsPage() {
  const { canViewPage, allUsers } = useAuth();
  const { selectedStoreId, stores, currentCountry } = useStore();
  const { t } = useLanguage();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<any>({ totalActions: 0, topUsers: [], actionCounts: {} });
  const [loading, setLoading] = useState(true);

  // Filter users by current country
  const countryUsers = React.useMemo(() => {
    const storeIds = stores.map((s) => s.id);
    return allUsers.filter((u) => {
      if (u.role === 'ADMIN' || u.role === 'LOGISTICS_MANAGER') return true;
      let assigned = null;
      if (u.permissions) {
        try {
          const p = typeof u.permissions === 'string' ? JSON.parse(u.permissions) : u.permissions;
          assigned = p.assignedStoreIds;
        } catch (e) {}
      } else if ((u as any).assignedStoreIds) {
        assigned = (u as any).assignedStoreIds;
      }
      if (!assigned || !Array.isArray(assigned) || assigned.length === 0) return true;
      return assigned.some((sid: string) => storeIds.includes(sid));
    });
  }, [allUsers, stores]);

  // Filters
  const [filterUser, setFilterUser] = useState('ALL');
  const [filterAction, setFilterAction] = useState('ALL');
  const [filterEntity, setFilterEntity] = useState('ALL');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStoreId && selectedStoreId !== 'ALL') {
        params.append('storeId', selectedStoreId);
      }
      if (filterUser && filterUser !== 'ALL') params.append('userId', filterUser);
      if (filterAction && filterAction !== 'ALL') params.append('action', filterAction);
      if (filterEntity && filterEntity !== 'ALL') params.append('entity', filterEntity);
      if (search.trim()) params.append('search', search.trim());
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('page', page.toString());
      params.append('limit', '40');

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setStats(data.stats || {});
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterUser, filterAction, filterEntity, startDate, endDate, page, selectedStoreId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleResetFilters = () => {
    setFilterUser('ALL');
    setFilterAction('ALL');
    setFilterEntity('ALL');
    setSearch('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  if (!canViewPage('/audit-logs')) {
    return <AccessDenied moduleName="le Journal d'Audit & l'Historique des Actions" />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {t('audit.title')}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
              Traçabilité 100%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {t('audit.subtitle')}
          </p>
        </div>

        <button
          onClick={() => fetchLogs()}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          <span>{t('btn.refresh')}</span>
        </button>
      </div>

      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Actions Récentes</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.totalActions || 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Actions enregistrées dans le journal</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Changements de Statuts</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {stats.actionCounts?.STATUS_CHANGE || 0}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">Confirmations, annulations, etc.</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Modifications Commandes</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">
            {stats.actionCounts?.ORDER_EDIT || 0}
          </div>
          <div className="text-[11px] text-blue-500 mt-1 font-medium">Téléphone, adresse, montants</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Stock & Dépenses</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-800 mt-2">
            {(stats.actionCounts?.STOCK_UPDATE || 0) + (stats.actionCounts?.EXPENSE_ADD || 0)}
          </div>
          <div className="text-[11px] text-amber-600 mt-1 font-medium">Mouvements de stock et frais</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Rechercher par N° commande, nom agent, action, détail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs font-medium pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Filter by User */}
          <select
            value={filterUser}
            onChange={(e) => {
              setFilterUser(e.target.value);
              setPage(1);
            }}
            className="text-xs font-semibold border border-slate-200 rounded-xl p-2 bg-white text-slate-700"
          >
            <option value="ALL">Tous les Utilisateurs</option>
            {countryUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>

          {/* Filter by Action */}
          <select
            value={filterAction}
            onChange={(e) => {
              setFilterAction(e.target.value);
              setPage(1);
            }}
            className="text-xs font-semibold border border-slate-200 rounded-xl p-2 bg-white text-slate-700"
          >
            <option value="ALL">Toutes les Actions</option>
            <option value="STATUS_CHANGE">Changement de Statut</option>
            <option value="ORDER_EDIT">Modification Commande</option>
            <option value="LEAD_LOCKED">Prise en charge Lead</option>
            <option value="BULK_ASSIGN">Assignation en masse</option>
            <option value="STOCK_UPDATE">Mouvement de Stock</option>
            <option value="EXPENSE_ADD">Ajout de Charge</option>
            <option value="EXPENSE_DELETE">Suppression de Charge</option>
            <option value="ORDER_DELETE">Suppression Commande</option>
            <option value="USER_EDIT">Modification Utilisateur</option>
          </select>

          {/* Filter by Entity */}
          <select
            value={filterEntity}
            onChange={(e) => {
              setFilterEntity(e.target.value);
              setPage(1);
            }}
            className="text-xs font-semibold border border-slate-200 rounded-xl p-2 bg-white text-slate-700"
          >
            <option value="ALL">Toutes les Entités</option>
            <option value="ORDER">Commandes</option>
            <option value="PRODUCT">Stock / Produits</option>
            <option value="EXPENSE">Dépenses & Charges</option>
            <option value="USER">Comptes Utilisateurs</option>
          </select>

          {/* Date Range */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="border border-slate-200 rounded-xl p-1.5 text-xs font-semibold text-slate-700"
            />
            <span>à</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="border border-slate-200 rounded-xl p-1.5 text-xs font-semibold text-slate-700"
            />
          </div>

          <button
            type="submit"
            className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
          >
            Filtrer
          </button>

          {(filterUser !== 'ALL' ||
            filterAction !== 'ALL' ||
            filterEntity !== 'ALL' ||
            search ||
            startDate ||
            endDate) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-rose-600 font-bold hover:underline"
            >
              Réinitialiser
            </button>
          )}
        </form>
      </div>

      {/* Main Audit Feed Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">Historique Détaillé des Opérations</h3>
          </div>
          <span className="text-xs text-slate-400 font-semibold">
            {logs.length} action(s) affichée(s)
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Chargement du journal d'audit...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <History className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Aucun historique trouvé</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Toutes les actions effectuées par les utilisateurs (modifications de commande, changements de statut, ajouts de stock ou charges) apparaîtront automatiquement ici.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Date & Heure</th>
                  <th className="py-3.5 px-4">Utilisateur / Auteur</th>
                  <th className="py-3.5 px-4">Type d'Action</th>
                  <th className="py-3.5 px-4">Entité</th>
                  <th className="py-3.5 px-4">Détails de l'Opération</th>
                  <th className="py-3.5 px-4 text-center">Avant ➔ Après</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const conf = ACTION_CONFIG[log.action] || {
                    label: log.action,
                    bg: 'bg-slate-100',
                    text: 'text-slate-700',
                    border: 'border-slate-300',
                    icon: <AlertCircle className="w-3.5 h-3.5 text-slate-500" />,
                  };

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {new Date(log.createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            à{' '}
                            {new Date(log.createdAt).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>

                      {/* User */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-xs">
                            {log.userName ? log.userName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block leading-tight">
                              {log.userName}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              {log.userRole || 'Utilisateur'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] border ${conf.bg} ${conf.text} ${conf.border}`}
                        >
                          {conf.icon}
                          <span>{conf.label}</span>
                        </span>
                      </td>

                      {/* Entity */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-700 uppercase text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {log.entity}
                        </span>
                      </td>

                      {/* Details */}
                      <td className="py-3.5 px-4 text-slate-800 font-semibold max-w-md">
                        <p className="line-clamp-2 leading-relaxed">{log.details}</p>
                      </td>

                      {/* Old vs New Value */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {log.oldValue || log.newValue ? (
                          <div className="inline-flex items-center gap-1 text-[11px] font-mono">
                            {log.oldValue && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                {log.oldValue}
                              </span>
                            )}
                            {log.oldValue && log.newValue && (
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                            )}
                            {log.newValue && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {log.newValue}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 bg-slate-50/50">
            <span>
              Page {page} sur {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                Précédent
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
