'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, UserPermissions } from '@/context/AuthContext';
import AccessDenied from '@/components/AccessDenied';
import {
  ShieldCheck,
  UserPlus,
  Users,
  Key,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  PhoneCall,
  Lock,
  Mail,
  User,
  Sliders,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Store as StoreIcon,
  CreditCard,
  Building2,
  UserCheck,
  Calendar,
  ArrowRightLeft,
  Award,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useLanguage } from '@/context/LanguageContext';

const defaultAgentPerms: UserPermissions = {
  viewCallCenter: true,
  viewOrders: true,
  onlyOwnOrders: true,
  viewStock: true,
  hideCostPrices: true,
  canManageRemittance: false,
  canChangeDeliveryStatus: false,
  viewDashboard: false,
  viewExpenses: false,
  viewConfirmers: false,
  viewIntegrations: false,
  viewSimulator: false,
  viewAdmin: false,
  assignedStoreIds: [],
  upsellCommissionFee: 5.0,
  bankName: 'CIH Bank',
  bankRib: '',
};

export default function AdminPage() {
  const { canViewPage, refreshUsers: refreshAuthUsers } = useAuth();
  const { allStores, stores, currentCountry, selectedCountry } = useStore();
  const { t } = useLanguage();
  const storeList = allStores && allStores.length > 0 ? allStores : stores;
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCountryFilter, setUserCountryFilter] = useState<string>(selectedCountry || 'ALL');

  useEffect(() => {
    if (selectedCountry) {
      setUserCountryFilter(selectedCountry);
    }
  }, [selectedCountry]);

  const getUserCountryCode = (user: any) => {
    try {
      const p = user.permissions
        ? typeof user.permissions === 'string'
          ? JSON.parse(user.permissions)
          : user.permissions
        : null;
      const assigned = p?.assignedStoreIds;
      if (assigned && Array.isArray(assigned) && assigned.length > 0) {
        const st = storeList.find((s) => assigned.includes(s.id));
        if (st) {
          if (
            st.currency === 'XOF' ||
            (st.name || '').toLowerCase().includes('sénégal') ||
            (st.name || '').toLowerCase().includes('senegal')
          ) {
            return 'SN';
          }
          return 'MA';
        }
      }
    } catch (e) {}
    return 'MA';
  };

  const getUserCurrency = (user: any) => {
    const code = getUserCountryCode(user);
    if (code === 'SN') return 'XOF';
    return 'MAD';
  };

  const filteredUsers = React.useMemo(() => {
    if (userCountryFilter === 'ALL') return users;
    return users.filter((u) => {
      if (u.role === 'ADMIN') return true;
      return getUserCountryCode(u) === userCountryFilter;
    });
  }, [users, userCountryFilter, storeList]);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // Permissions state
  const [perms, setPerms] = useState<UserPermissions>(defaultAgentPerms);
  const [editPerms, setEditPerms] = useState<UserPermissions>(defaultAgentPerms);

  // New User Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('CALL_AGENT');
  const [commissionFee, setCommissionFee] = useState('10.0');
  const [upsellCommissionFee, setUpsellCommissionFee] = useState('5.0');
  const [bankName, setBankName] = useState('CIH Bank');
  const [bankRib, setBankRib] = useState('');

  // Edit User Form State
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('CALL_AGENT');
  const [editCommissionFee, setEditCommissionFee] = useState('10.0');
  const [editUpsellCommissionFee, setEditUpsellCommissionFee] = useState('5.0');
  const [editBankName, setEditBankName] = useState('CIH Bank');
  const [editBankRib, setEditBankRib] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          role,
          commissionFee,
          permissions: {
            ...perms,
            bankName,
            bankRib: bankRib.trim(),
            upsellCommissionFee: parseFloat(upsellCommissionFee) || 5.0,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setName('');
        setEmail('');
        setPassword('');
        setPhone('');
        setRole('CALL_AGENT');
        setCommissionFee('10.0');
        setUpsellCommissionFee('5.0');
        setBankName('CIH Bank');
        setBankRib('');
        setPerms(defaultAgentPerms);
        fetchUsers();
        refreshAuthUsers();
      } else {
        alert(data.error || 'Erreur lors de la création');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAdd = () => {
    const isSn = userCountryFilter === 'SN' || currentCountry?.code === 'SN';
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setRole('CALL_AGENT');
    setCommissionFee(isSn ? '1000' : '10.0');
    setUpsellCommissionFee(isSn ? '500' : '5.0');
    setBankName(isSn ? 'Wave Mobile Money' : 'CIH Bank');
    setBankRib('');

    const targetStores = storeList.filter((s) => {
      const isStoreSn =
        s.currency === 'XOF' ||
        (s.name || '').toLowerCase().includes('sénégal') ||
        (s.name || '').toLowerCase().includes('senegal');
      return isSn ? isStoreSn : !isStoreSn;
    });

    setPerms({
      ...defaultAgentPerms,
      assignedStoreIds: targetStores.map((s) => s.id),
      upsellCommissionFee: isSn ? 500 : 5.0,
      bankName: isSn ? 'Wave Mobile Money' : 'CIH Bank',
      bankRib: '',
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (user: any) => {
    setSelectedUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone || '');
    setEditRole(user.role);
    setEditCommissionFee(user.commissionFee.toString());
    setEditPassword('');

    let userPerms = { ...defaultAgentPerms };
    if (user.permissions) {
      try {
        userPerms = { ...defaultAgentPerms, ...JSON.parse(user.permissions) };
      } catch (err) {
        console.error(err);
      }
    }
    if (!Array.isArray(userPerms.assignedStoreIds)) {
      userPerms.assignedStoreIds = [];
    }
    const isSn = getUserCountryCode(user) === 'SN';
    const upsellFee =
      userPerms.upsellCommissionFee !== undefined
        ? userPerms.upsellCommissionFee.toString()
        : isSn
        ? '500'
        : '5.0';
    setEditUpsellCommissionFee(upsellFee);
    setEditBankName(userPerms.bankName || (isSn ? 'Wave Mobile Money' : 'CIH Bank'));
    setEditBankRib(userPerms.bankRib || '');
    setEditPerms(userPerms);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const payload: any = {
        name: editName,
        email: editEmail,
        phone: editPhone,
        role: editRole,
        commissionFee: editCommissionFee,
        permissions: {
          ...editPerms,
          bankName: editBankName,
          bankRib: editBankRib.trim(),
          upsellCommissionFee: parseFloat(editUpsellCommissionFee) || 5.0,
        },
      };
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        setSelectedUser(null);
        fetchUsers();
        refreshAuthUsers();
      } else {
        alert(data.error || 'Erreur lors de la modification');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = async (user: any) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !user.active }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Absence & Replacement State
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [absenceUser, setAbsenceUser] = useState<any | null>(null);
  const [workStatus, setWorkStatus] = useState<'ACTIVE' | 'ON_LEAVE' | 'QUITTED'>('ACTIVE');
  const [leaveReason, setLeaveReason] = useState('');
  const [replacementAgentId, setReplacementAgentId] = useState('');
  const [commissionRule, setCommissionRule] = useState<'SPLIT_50_50' | 'FULL_TO_RESCUER' | 'FIXED_BONUS'>('SPLIT_50_50');
  const [rescueBonusAmount, setRescueBonusAmount] = useState('10.0');
  const [transferOrdersOnQuit, setTransferOrdersOnQuit] = useState(true);
  const [savingAbsence, setSavingAbsence] = useState(false);

  const handleOpenAbsence = (user: any) => {
    setAbsenceUser(user);
    let p: any = null;
    try {
      p = user.permissions ? (typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions) : null;
    } catch (e) {}

    const currentStatus = p?.workStatus || (user.active ? 'ACTIVE' : 'QUITTED');
    setWorkStatus(currentStatus);
    setLeaveReason(p?.leaveReason || '');
    setReplacementAgentId(p?.replacementAgentId || '');
    setCommissionRule(p?.replacementCommissionMode || 'SPLIT_50_50');
    setRescueBonusAmount((p?.rescueBonusAmount || 10).toString());
    setTransferOrdersOnQuit(true);
    setShowAbsenceModal(true);
  };

  const handleSaveAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!absenceUser) return;
    setSavingAbsence(true);

    try {
      let existingPerms: any = {};
      try {
        existingPerms = absenceUser.permissions
          ? (typeof absenceUser.permissions === 'string' ? JSON.parse(absenceUser.permissions) : absenceUser.permissions)
          : {};
      } catch (err) {}

      const updatedPermissions = {
        ...existingPerms,
        workStatus,
        leaveReason: workStatus !== 'ACTIVE' ? leaveReason : '',
        replacementAgentId: workStatus === 'ON_LEAVE' ? replacementAgentId : '',
        replacementCommissionMode: workStatus === 'ON_LEAVE' ? commissionRule : undefined,
        rescueBonusAmount: workStatus === 'ON_LEAVE' && commissionRule === 'FIXED_BONUS' ? parseFloat(rescueBonusAmount) || 10 : undefined,
      };

      const payload: any = {
        active: workStatus !== 'QUITTED',
        permissions: updatedPermissions,
      };

      if (workStatus === 'QUITTED' && transferOrdersOnQuit && replacementAgentId) {
        payload.transferOrdersTo = replacementAgentId;
      }

      const res = await fetch(`/api/admin/users/${absenceUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setShowAbsenceModal(false);
        fetchUsers();
        refreshAuthUsers();
        alert(
          workStatus === 'ON_LEAVE'
            ? `✅ Statut mis à jour : "${absenceUser.name}" est marqué en congé. Son remplaçant assurera le suivi et touchera les commissions selon la règle choisie.`
            : workStatus === 'QUITTED'
            ? `✅ Compte clôturé : Les commandes en transit ont été transférées vers le remplaçant.`
            : `✅ Compte réactivé en statut "Actif & Présent".`
        );
      } else {
        alert(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingAbsence(false);
    }
  };

  const handleDeleteUser = async (id: string, userName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le compte de ${userName} ?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalAgents = filteredUsers.filter((u) => u.role === 'CALL_AGENT').length;
  const activeAgents = filteredUsers.filter((u) => u.role === 'CALL_AGENT' && u.active).length;

  if (!canViewPage('/admin')) {
    return <AccessDenied moduleName="l'Administration et la Gestion des Équipes" />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {t('admin.title')}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('admin.badge')}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('admin.subtitle')}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>{t('admin.createAccount')}</span>
        </button>
      </div>

      {/* Agent Login Link Info Box */}
      <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-indigo-950 flex items-center gap-2 flex-wrap">
              <span>{t('admin.loginLinkNotice')}</span>
              <span className="font-mono bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-700 font-extrabold text-[11px]">
                /login
              </span>
            </div>
            <p className="text-[11px] text-indigo-700/80 mt-0.5">
              {t('admin.loginLinkDesc')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const url = typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login';
            if (navigator?.clipboard) {
              navigator.clipboard.writeText(url);
            }
            alert(`Lien copié : ${url}`);
          }}
          className="px-3 py-1.5 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer shadow-2xs"
        >
          {t('admin.copyLink')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('admin.totalUsers')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{filteredUsers.length}</div>
          <div className="text-xs text-slate-500 mt-1">{t('admin.usersDesc')}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('admin.activeAgents')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{activeAgents}</div>
          <div className="text-xs text-slate-500 mt-1">{t('admin.agentsDesc').replace('{total}', totalAgents.toString())}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('admin.leadDist')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-black text-slate-900 mt-2">Round-Robin</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">
            {t('admin.distDesc')}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">
              {t('admin.userList')}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {filteredUsers.length} {t('common.accounts', 'compte(s)')}
            </p>
          </div>

          {/* Country Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setUserCountryFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                userCountryFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t('admin.allCountries')} ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setUserCountryFilter('MA')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                userCountryFilter === 'MA'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🇲🇦 Maroc ({users.filter((u) => u.role === 'ADMIN' || getUserCountryCode(u) === 'MA').length})
            </button>
            <button
              type="button"
              onClick={() => setUserCountryFilter('SN')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                userCountryFilter === 'SN'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🇸🇳 Sénégal ({users.filter((u) => u.role === 'ADMIN' || getUserCountryCode(u) === 'SN').length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">{t('admin.colUser')}</th>
                <th className="py-3.5 px-4">{t('table.phone')}</th>
                <th className="py-3.5 px-4">{t('admin.colRole')}</th>
                <th className="py-3.5 px-4">{t('admin.colCommissions')}</th>
                <th className="py-3.5 px-4 text-center">{t('dash.kpi.leads')}</th>
                <th className="py-3.5 px-4 text-center">{t('admin.colStatus')}</th>
                <th className="py-3.5 px-4 text-right">{t('admin.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-800 text-white font-black flex items-center justify-center text-xs">
                        {u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm">{u.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-700">
                    {u.phone || <span className="text-slate-400 italic">Non renseigné</span>}
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : u.role === 'LOGISTICS_MANAGER'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {u.role === 'ADMIN'
                        ? '🛡️ Administrateur'
                        : u.role === 'LOGISTICS_MANAGER'
                        ? '🚚 Responsable Logistique'
                        : '🎧 Agent de Confirmation'}
                    </span>

                    {/* Assigned boutiques */}
                    {u.role === 'CALL_AGENT' && (
                      <div className="flex flex-wrap gap-1 mt-1.5 max-w-[220px]">
                        {(() => {
                          let permsObj: any = null;
                          try {
                            permsObj = u.permissions ? JSON.parse(u.permissions) : null;
                          } catch (e) {}
                          const assigned = permsObj?.assignedStoreIds || [];
                          if (assigned.length === 0) {
                            return (
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                🌐 Toutes les boutiques
                              </span>
                            );
                          }
                          return assigned.map((sId: string) => {
                            const st = storeList.find((s) => s.id === sId);
                            return (
                              <span
                                key={sId}
                                className="text-[10px] text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-semibold inline-flex items-center gap-0.5"
                              >
                                🛍️ {st ? st.name : sId.slice(0, 8)}
                              </span>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4 font-extrabold text-slate-900">
                    {u.role === 'CALL_AGENT' ? (
                      <div className="flex flex-col gap-1 items-start">
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200 text-xs font-black">
                          {u.commissionFee} {getUserCurrency(u)}{' '}
                          <span className="text-[10px] font-normal text-indigo-500">/Livré</span>
                        </span>
                        {(() => {
                          try {
                            const p = u.permissions ? JSON.parse(u.permissions) : null;
                            const uf = p?.upsellCommissionFee !== undefined ? p.upsellCommissionFee : 5.0;
                            return (
                              <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px] font-bold inline-flex items-center gap-1">
                                <span>+{uf} {getUserCurrency(u)} UpSell</span>
                              </span>
                            );
                          } catch (e) {
                            return null;
                          }
                        })()}
                        {(() => {
                          try {
                            const p = u.permissions ? JSON.parse(u.permissions) : null;
                            if (p?.bankName || p?.bankRib) {
                              return (
                                <span
                                  className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 text-[10px] font-semibold inline-flex items-center gap-1 font-mono"
                                  title={p.bankRib ? `RIB: ${p.bankRib}` : undefined}
                                >
                                  <span>🏦 {p.bankName || 'Banque'}</span>
                                  {p.bankRib && <span className="text-slate-400 font-bold">({p.bankRib.slice(-4)})</span>}
                                </span>
                              );
                            }
                            return null;
                          } catch (e) {
                            return null;
                          }
                        })()}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">-</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                    {u._count?.assignedOrders || 0}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    {(() => {
                      let p: any = null;
                      try {
                        p = u.permissions ? (typeof u.permissions === 'string' ? JSON.parse(u.permissions) : u.permissions) : null;
                      } catch (e) {}
                      const repUser = p?.replacementAgentId ? users.find((x) => x.id === p.replacementAgentId) : null;

                      if (p?.workStatus === 'ON_LEAVE') {
                        return (
                          <div className="flex flex-col items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenAbsence(u)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"
                              title="Cliquer pour modifier l absence / le remplaçant"
                            >
                              <span>🏖️ En Congé / Absent</span>
                            </button>
                            {repUser && (
                              <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                                🤝 Remplacé par: <strong>{repUser.name}</strong> ({p.replacementCommissionMode === 'SPLIT_50_50' ? '50/50' : p.replacementCommissionMode === 'FULL_TO_RESCUER' ? '100%' : `+${p.rescueBonusAmount || 10} DH`})
                              </span>
                            )}
                          </div>
                        );
                      }

                      if (p?.workStatus === 'QUITTED' || !u.active) {
                        return (
                          <button
                            type="button"
                            onClick={() => handleOpenAbsence(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="Compte inactif ou clôturé"
                          >
                            <XCircle className="w-3 h-3 text-slate-500" />
                            <span>{p?.workStatus === 'QUITTED' ? '🚪 A Quitté' : 'Suspendu (Inactif)'}</span>
                          </button>
                        );
                      }

                      return (
                        <button
                          type="button"
                          onClick={() => handleOpenAbsence(u)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                          title="Cliquer pour gérer la présence / absence"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Actif (Présent)</span>
                        </button>
                      );
                    })()}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Absence & Replacement Action Button */}
                      {u.role === 'CALL_AGENT' && (
                        <button
                          onClick={() => handleOpenAbsence(u)}
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer shadow-2xs"
                          title="Gérer l absence, le remplaçant et la commission"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                        title="Modifier le compte et mot de passe"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors"
                          title="Supprimer l utilisateur"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: CRÉER UN UTILISATEUR */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg sm:max-w-xl w-full border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Fixed Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0 bg-white">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Créer un Nouveau Compte</h3>
                <p className="text-xs text-slate-500">Ajoutez un agent de confirmation ou un gestionnaire.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Scrollable Content Body */}
              <div className="p-6 overflow-y-auto space-y-3.5 flex-1 overscroll-contain">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom Complet</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sarah Mansouri"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email de Connexion</label>
                <input
                  type="email"
                  required
                  placeholder="Ex: sarah@votre-projet.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mot de Passe</label>
                <input
                  type="password"
                  required
                  placeholder="Mot de passe temporaire ou sécurisé"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Numéro Téléphone</label>
                  <input
                    type="text"
                    placeholder="Ex: 0612345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rôle</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="CALL_AGENT">🎧 Agent de Confirmation</option>
                    <option value="LOGISTICS_MANAGER">🚚 Responsable Logistique</option>
                    <option value="ADMIN">🛡️ Administrateur</option>
                  </select>
                </div>
              </div>

              {role === 'CALL_AGENT' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Commission Base / Livré ({(userCountryFilter === 'SN' || currentCountry?.code === 'SN') ? 'XOF' : (currentCountry?.currency || 'MAD')})
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        required
                        placeholder="Ex: 10 ou 1000"
                        value={commissionFee}
                        onChange={(e) => setCommissionFee(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Payé sur commande livrée.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Prime UpSell / Livré ({(userCountryFilter === 'SN' || currentCountry?.code === 'SN') ? 'XOF' : (currentCountry?.currency || 'MAD')})
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        required
                        placeholder="Ex: 5 ou 500"
                        value={upsellCommissionFee}
                        onChange={(e) => setUpsellCommissionFee(e.target.value)}
                        className="w-full text-xs border border-emerald-300 bg-emerald-50/30 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-800"
                      />
                      <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">
                        Fixe & bloquée pour l'agent.
                      </span>
                    </div>
                  </div>

                  {/* Coordonnées Bancaires de l'Agent */}
                  <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        <span>Coordonnées Bancaires / Mobile Money</span>
                      </span>
                      <span className="text-[10px] bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded font-bold">
                        Virement Commissions
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800/80 mb-2.5">
                      Renseignez la banque, Mobile Money (Wave, Orange Money) ou le RIB de l'agent.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Banque / Portefeuille de l'Agent
                        </label>
                        <select
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {(userCountryFilter === 'SN' || currentCountry?.code === 'SN') ? (
                            <>
                              <optgroup label="🇸🇳 Sénégal (Mobile Money & Banques)">
                                <option value="Wave Mobile Money">Wave Mobile Money 🇸🇳</option>
                                <option value="Orange Money Sénégal">Orange Money Sénégal 🇸🇳</option>
                                <option value="Free Money Sénégal">Free Money Sénégal 🇸🇳</option>
                                <option value="Ecobank Sénégal">Ecobank Sénégal</option>
                                <option value="CBAO Groupe Attijariwafa">CBAO Groupe Attijariwafa (Sénégal)</option>
                                <option value="SGBS Sénégal">Société Générale Sénégal (SGBS)</option>
                                <option value="Bank of Africa Sénégal">Bank of Africa Sénégal</option>
                              </optgroup>
                              <optgroup label="🇲🇦 Maroc (Banques)">
                                <option value="CIH Bank">CIH Bank</option>
                                <option value="Attijariwafa Bank">Attijariwafa Bank</option>
                                <option value="Banque Populaire">Banque Populaire (Chaabi)</option>
                              </optgroup>
                            </>
                          ) : (
                            <>
                              <optgroup label="🇲🇦 Maroc (Banques)">
                                <option value="CIH Bank">CIH Bank</option>
                                <option value="Attijariwafa Bank">Attijariwafa Bank</option>
                                <option value="Banque Populaire">Banque Populaire (Chaabi)</option>
                                <option value="Bank of Africa">Bank of Africa (BMCE)</option>
                                <option value="Al Barid Bank">Al Barid Bank</option>
                                <option value="CFG Bank">CFG Bank</option>
                                <option value="Société Générale">Société Générale Maroc</option>
                                <option value="Crédit Agricole">Crédit Agricole du Maroc</option>
                                <option value="Crédit du Maroc">Crédit du Maroc</option>
                              </optgroup>
                              <optgroup label="🇸🇳 Sénégal (Mobile Money & Banques)">
                                <option value="Wave Mobile Money">Wave Mobile Money 🇸🇳</option>
                                <option value="Orange Money Sénégal">Orange Money Sénégal 🇸🇳</option>
                                <option value="Free Money Sénégal">Free Money Sénégal 🇸🇳</option>
                                <option value="Ecobank Sénégal">Ecobank Sénégal</option>
                              </optgroup>
                            </>
                          )}
                          <option value="Autre">Autre Banque / Compte</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          RIB Bancaire (24 chiffres)
                        </label>
                        <input
                          type="text"
                          maxLength={32}
                          placeholder="Ex: 230 780 0000000000000000 00"
                          value={bankRib}
                          onChange={(e) => setBankRib(e.target.value)}
                          className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Affectation des Boutiques / Niches */}
              <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <StoreIcon className="w-4 h-4 text-amber-600" />
                    <span>Boutiques & Niches Affectées</span>
                  </span>
                  <span className="text-[10px] bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded font-bold">
                    Spécialisation Niche
                  </span>
                </div>
                <p className="text-[11px] text-amber-800/80 mb-2.5">
                  Cochez les boutiques / niches que cet agent traitera. L'agent ne verra que les leads, commandes et stocks de ces boutiques.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {storeList.map((store) => {
                    const isChecked = (perms.assignedStoreIds || []).includes(store.id);
                    return (
                      <label
                        key={store.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-amber-100/80 border-amber-400 font-bold text-amber-950 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const current = perms.assignedStoreIds || [];
                            const updated = e.target.checked
                              ? [...current, store.id]
                              : current.filter((id) => id !== store.id);
                            setPerms({ ...perms, assignedStoreIds: updated });
                          }}
                          className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                        />
                        <span className="truncate">🛍️ {store.name}</span>
                      </label>
                    );
                  })}
                </div>
                {(!perms.assignedStoreIds || perms.assignedStoreIds.length === 0) && (
                  <p className="text-[10px] text-slate-500 mt-2 italic">
                    ℹ️ Si aucune boutique n'est sélectionnée, l'accès sera global par défaut.
                  </p>
                )}
              </div>

              {/* Permissions personnalisées */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Permissions & Accès aux Données</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Contrôle granulaire</span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(perms.viewCallCenter)}
                      onChange={(e) => setPerms({ ...perms, viewCallCenter: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Accès Centre d'Appel (Traitement des Leads)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(perms.viewOrders)}
                      onChange={(e) => setPerms({ ...perms, viewOrders: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Accès Commandes & Expéditions</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer ml-5 text-slate-600">
                    <input
                      type="checkbox"
                      checked={Boolean(perms.onlyOwnOrders)}
                      onChange={(e) => setPerms({ ...perms, onlyOwnOrders: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Voir uniquement ses propres commandes</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer ml-5 text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(perms.canManageRemittance)}
                      onChange={(e) => setPerms({ ...perms, canManageRemittance: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span className="font-semibold text-emerald-800">
                      💰 Autoriser à Marquer les Versements Transporteur (Marquer Versé)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer ml-5 text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(perms.canChangeDeliveryStatus)}
                      onChange={(e) => setPerms({ ...perms, canChangeDeliveryStatus: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span className="font-semibold text-indigo-800">
                      ⚙️ Autoriser à Modifier les Statuts de Livraison (Livré, Refusé, Reporté...)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(perms.viewStock)}
                      onChange={(e) => setPerms({ ...perms, viewStock: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Accès Gestion du Stock</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer ml-5 text-slate-600">
                    <input
                      type="checkbox"
                      checked={Boolean(perms.hideCostPrices)}
                      onChange={(e) => setPerms({ ...perms, hideCostPrices: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-500" />
                      <span>Masquer les Prix d'Achat (COGS)</span>
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-500">
                    <input
                      type="checkbox"
                      checked={Boolean(perms.viewDashboard)}
                      onChange={(e) => setPerms({ ...perms, viewDashboard: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Accès Dashboard Financier & Rentabilité</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-500">
                    <input
                      type="checkbox"
                      checked={Boolean(perms.viewExpenses)}
                      onChange={(e) => setPerms({ ...perms, viewExpenses: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Accès Dépenses & Dépenses Publicitaires</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-500">
                    <input
                      type="checkbox"
                      checked={Boolean(perms.viewConfirmers)}
                      onChange={(e) => setPerms({ ...perms, viewConfirmers: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Accès Facturation Globale Confirmateurs</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-500">
                    <input
                      type="checkbox"
                      checked={Boolean(perms.viewIntegrations)}
                      onChange={(e) => setPerms({ ...perms, viewIntegrations: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Accès Intégrations & Clés API</span>
                  </label>
                </div>
              </div>

              </div>

              {/* Fixed Sticky Footer */}
              <div className="px-6 py-4 border-t border-slate-200/80 bg-slate-50/90 backdrop-blur-xs flex items-center justify-end gap-2.5 flex-shrink-0 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Créer le Compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MODIFIER / CHANGER MOT DE PASSE */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg sm:max-w-xl w-full border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Fixed Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0 bg-white">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Modifier : {selectedUser.name}
                </h3>
                <p className="text-xs text-slate-500">Mettre à jour les accès ou changer le mot de passe.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Scrollable Content Body */}
              <div className="p-6 overflow-y-auto space-y-3.5 flex-1 overscroll-contain">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom Complet</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nouveau Mot de Passe (Laissez vide pour conserver l actuel)
                </label>
                <input
                  type="password"
                  placeholder="Tapez le nouveau mot de passe si besoin"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rôle</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-semibold"
                  >
                    <option value="CALL_AGENT">Agent de Confirmation</option>
                    <option value="LOGISTICS_MANAGER">Responsable Logistique</option>
                    <option value="ADMIN">Administrateur</option>
                  </select>
                </div>
              </div>

              {editRole === 'CALL_AGENT' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Commission Base / Livré ({selectedUser ? getUserCurrency(selectedUser) : (currentCountry?.currency || 'MAD')})
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        required
                        value={editCommissionFee}
                        onChange={(e) => setEditCommissionFee(e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-bold"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Payé sur commande livrée.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Prime UpSell / Livré ({selectedUser ? getUserCurrency(selectedUser) : (currentCountry?.currency || 'MAD')})
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        required
                        value={editUpsellCommissionFee}
                        onChange={(e) => setEditUpsellCommissionFee(e.target.value)}
                        className="w-full text-xs border border-emerald-300 bg-emerald-50/30 rounded-xl p-2.5 font-bold text-emerald-800"
                      />
                      <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">
                        Fixe & bloquée pour l'agent.
                      </span>
                    </div>
                  </div>

                  {/* Coordonnées Bancaires de l'Agent */}
                  <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        <span>Coordonnées Bancaires / Mobile Money</span>
                      </span>
                      <span className="text-[10px] bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded font-bold">
                        Virement Commissions
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800/80 mb-2.5">
                      Renseignez la banque, Mobile Money (Wave, Orange Money) ou le RIB de l'agent.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Banque / Portefeuille de l'Agent
                        </label>
                        <select
                          value={editBankName}
                          onChange={(e) => setEditBankName(e.target.value)}
                          className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {(selectedUser && getUserCountryCode(selectedUser) === 'SN') ? (
                            <>
                              <optgroup label="🇸🇳 Sénégal (Mobile Money & Banques)">
                                <option value="Wave Mobile Money">Wave Mobile Money 🇸🇳</option>
                                <option value="Orange Money Sénégal">Orange Money Sénégal 🇸🇳</option>
                                <option value="Free Money Sénégal">Free Money Sénégal 🇸🇳</option>
                                <option value="Ecobank Sénégal">Ecobank Sénégal</option>
                                <option value="CBAO Groupe Attijariwafa">CBAO Groupe Attijariwafa (Sénégal)</option>
                                <option value="SGBS Sénégal">Société Générale Sénégal (SGBS)</option>
                                <option value="Bank of Africa Sénégal">Bank of Africa Sénégal</option>
                              </optgroup>
                              <optgroup label="🇲🇦 Maroc (Banques)">
                                <option value="CIH Bank">CIH Bank</option>
                                <option value="Attijariwafa Bank">Attijariwafa Bank</option>
                                <option value="Banque Populaire">Banque Populaire (Chaabi)</option>
                              </optgroup>
                            </>
                          ) : (
                            <>
                              <optgroup label="🇲🇦 Maroc (Banques)">
                                <option value="CIH Bank">CIH Bank</option>
                                <option value="Attijariwafa Bank">Attijariwafa Bank</option>
                                <option value="Banque Populaire">Banque Populaire (Chaabi)</option>
                                <option value="Bank of Africa">Bank of Africa (BMCE)</option>
                                <option value="Al Barid Bank">Al Barid Bank</option>
                                <option value="CFG Bank">CFG Bank</option>
                                <option value="Société Générale">Société Générale Maroc</option>
                                <option value="Crédit Agricole">Crédit Agricole du Maroc</option>
                                <option value="Crédit du Maroc">Crédit du Maroc</option>
                              </optgroup>
                              <optgroup label="🇸🇳 Sénégal (Mobile Money & Banques)">
                                <option value="Wave Mobile Money">Wave Mobile Money 🇸🇳</option>
                                <option value="Orange Money Sénégal">Orange Money Sénégal 🇸🇳</option>
                                <option value="Free Money Sénégal">Free Money Sénégal 🇸🇳</option>
                                <option value="Ecobank Sénégal">Ecobank Sénégal</option>
                              </optgroup>
                            </>
                          )}
                          <option value="Autre">Autre Banque / Compte</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          RIB Bancaire (24 chiffres)
                        </label>
                        <input
                          type="text"
                          maxLength={32}
                          placeholder="Ex: 230 780 0000000000000000 00"
                          value={editBankRib}
                          onChange={(e) => setEditBankRib(e.target.value)}
                          className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Affectation des Boutiques / Niches */}
              <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <StoreIcon className="w-4 h-4 text-amber-600" />
                    <span>Boutiques & Niches Affectées</span>
                  </span>
                  <span className="text-[10px] bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded font-bold">
                    Spécialisation Niche
                  </span>
                </div>
                <p className="text-[11px] text-amber-800/80 mb-2.5">
                  Cochez les boutiques / niches que cet agent traitera. L'agent ne verra que les leads, commandes et stocks de ces boutiques.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {storeList.map((store) => {
                    const isChecked = (editPerms.assignedStoreIds || []).includes(store.id);
                    return (
                      <label
                        key={store.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-amber-100/80 border-amber-400 font-bold text-amber-950 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const current = editPerms.assignedStoreIds || [];
                            const updated = e.target.checked
                              ? [...current, store.id]
                              : current.filter((id) => id !== store.id);
                            setEditPerms({ ...editPerms, assignedStoreIds: updated });
                          }}
                          className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                        />
                        <span className="truncate">🛍️ {store.name}</span>
                      </label>
                    );
                  })}
                </div>
                {(!editPerms.assignedStoreIds || editPerms.assignedStoreIds.length === 0) && (
                  <p className="text-[10px] text-slate-500 mt-2 italic">
                    ℹ️ Si aucune boutique n'est sélectionnée, l'accès sera global par défaut.
                  </p>
                )}
              </div>

              {/* Permissions personnalisées */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Permissions & Accès aux Données</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Modifier l'accès</span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editPerms.viewCallCenter)}
                      onChange={(e) => setEditPerms({ ...editPerms, viewCallCenter: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Accès Centre d'Appel (Traitement des Leads)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editPerms.viewOrders)}
                      onChange={(e) => setEditPerms({ ...editPerms, viewOrders: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Accès Commandes & Expéditions</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer ml-5 text-slate-600">
                    <input
                      type="checkbox"
                      checked={Boolean(editPerms.onlyOwnOrders)}
                      onChange={(e) => setEditPerms({ ...editPerms, onlyOwnOrders: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Voir uniquement ses propres commandes</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer ml-5 text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(editPerms.canManageRemittance)}
                      onChange={(e) => setEditPerms({ ...editPerms, canManageRemittance: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span className="font-semibold text-emerald-800">
                      💰 Autoriser à Marquer les Versements Transporteur (Marquer Versé)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer ml-5 text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(editPerms.canChangeDeliveryStatus)}
                      onChange={(e) => setEditPerms({ ...editPerms, canChangeDeliveryStatus: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span className="font-semibold text-indigo-800">
                      ⚙️ Autoriser à Modifier les Statuts de Livraison (Livré, Refusé, Reporté...)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editPerms.viewStock)}
                      onChange={(e) => setEditPerms({ ...editPerms, viewStock: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Accès Gestion du Stock</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer ml-5 text-slate-600">
                    <input
                      type="checkbox"
                      checked={Boolean(editPerms.hideCostPrices)}
                      onChange={(e) => setEditPerms({ ...editPerms, hideCostPrices: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-500" />
                      <span>Masquer les Prix d'Achat (COGS)</span>
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-500">
                    <input
                      type="checkbox"
                      checked={Boolean(editPerms.viewDashboard)}
                      onChange={(e) => setEditPerms({ ...editPerms, viewDashboard: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Accès Dashboard Financier & Rentabilité</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-500">
                    <input
                      type="checkbox"
                      checked={Boolean(editPerms.viewExpenses)}
                      onChange={(e) => setEditPerms({ ...editPerms, viewExpenses: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Accès Dépenses & Dépenses Publicitaires</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-500">
                    <input
                      type="checkbox"
                      checked={Boolean(editPerms.viewConfirmers)}
                      onChange={(e) => setEditPerms({ ...editPerms, viewConfirmers: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Accès Facturation Globale Confirmateurs</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-500">
                    <input
                      type="checkbox"
                      checked={Boolean(editPerms.viewIntegrations)}
                      onChange={(e) => setEditPerms({ ...editPerms, viewIntegrations: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span>Accès Intégrations & Clés API</span>
                  </label>
                </div>
              </div>

              </div>

              {/* Fixed Sticky Footer */}
              <div className="px-6 py-4 border-t border-slate-200/80 bg-slate-50/90 backdrop-blur-xs flex items-center justify-end gap-2.5 flex-shrink-0 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Enregistrer Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL 3: GESTION DE PRÉSENCE, ABSENCE & REMPLACEMENT */}
      {showAbsenceModal && absenceUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg sm:max-w-xl w-full border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-black text-lg border border-amber-200">
                  🏖️
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Gestion d Absence & Remplacement
                  </h3>
                  <p className="text-xs text-slate-500">
                    Agent : <strong>{absenceUser.name}</strong> ({absenceUser.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAbsenceModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAbsence} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
              {/* Status Chooser */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Statut de présence de l agent
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setWorkStatus('ACTIVE')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-black flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      workStatus === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Actif (Présent)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWorkStatus('ON_LEAVE')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-black flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      workStatus === 'ON_LEAVE'
                        ? 'bg-amber-50 text-amber-900 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-base">🏖️</span>
                    <span>En Congé / Absent</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWorkStatus('QUITTED')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-black flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      workStatus === 'QUITTED'
                        ? 'bg-rose-50 text-rose-900 border-rose-500 ring-2 ring-rose-500/20 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-base">🚪</span>
                    <span>A Quitté l Équipe</span>
                  </button>
                </div>
              </div>

              {/* SECTION: EN CONGÉ / MALADE */}
              {workStatus === 'ON_LEAVE' && (
                <div className="space-y-3.5 p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <div>
                    <label className="block text-xs font-bold text-amber-950 mb-1">
                      Motif de l absence
                    </label>
                    <input
                      type="text"
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      placeholder="Ex: Maladie, Congé annuel, Urgence familiale..."
                      className="w-full text-xs border border-amber-300 rounded-xl p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-950 mb-1">
                      Agent Remplaçant (Qui assurera le suivi et les alertes livreur ?)
                    </label>
                    <select
                      value={replacementAgentId}
                      onChange={(e) => setReplacementAgentId(e.target.value)}
                      required
                      className="w-full text-xs font-semibold border border-amber-300 rounded-xl p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    >
                      <option value="">-- Choisir un agent remplaçant --</option>
                      {users
                        .filter((u) => u.role === 'CALL_AGENT' && u.id !== absenceUser.id && u.active)
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            🎧 {u.name} ({u.email})
                          </option>
                        ))}
                    </select>
                    <p className="text-[10px] text-amber-800 mt-1">
                      💡 Cet agent recevra automatiquement la sonnerie d urgence SOS et les alertes livreur pour les commandes de {absenceUser.name}.
                    </p>
                  </div>

                  {/* Commission Sharing Formula */}
                  <div className="space-y-2 pt-2 border-t border-amber-200">
                    <label className="block text-xs font-bold text-amber-950">
                      Règle de Commission pour le Remplaçant
                    </label>

                    <div className="space-y-2 text-xs">
                      {/* Option 1: Split 50/50 */}
                      <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        commissionRule === 'SPLIT_50_50' ? 'bg-white border-amber-500 shadow-2xs font-bold text-slate-900 ring-1 ring-amber-500/20' : 'bg-white/60 border-amber-200 text-slate-600'
                      }`}>
                        <input
                          type="radio"
                          name="commRule"
                          checked={commissionRule === 'SPLIT_50_50'}
                          onChange={() => setCommissionRule('SPLIT_50_50')}
                          className="mt-0.5 text-amber-600 focus:ring-amber-500"
                        />
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>🤝 Partage Équitable 50% / 50% (Recommandé)</span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                            50% pour {absenceUser.name} (effort de confirmation) + 50% pour le remplaçant (effort de suivi & sauvetage).
                          </p>
                        </div>
                      </label>

                      {/* Option 2: 100% to Rescuer */}
                      <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        commissionRule === 'FULL_TO_RESCUER' ? 'bg-white border-amber-500 shadow-2xs font-bold text-slate-900 ring-1 ring-amber-500/20' : 'bg-white/60 border-amber-200 text-slate-600'
                      }`}>
                        <input
                          type="radio"
                          name="commRule"
                          checked={commissionRule === 'FULL_TO_RESCUER'}
                          onChange={() => setCommissionRule('FULL_TO_RESCUER')}
                          className="mt-0.5 text-amber-600 focus:ring-amber-500"
                        />
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            <span>⚡ 100% de la Commission au Remplaçant</span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                            Le remplaçant touche la totalité de la commission livrée pour chaque commande qu il parvient à faire livrer.
                          </p>
                        </div>
                      </label>

                      {/* Option 3: Fixed Bonus */}
                      <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        commissionRule === 'FIXED_BONUS' ? 'bg-white border-amber-500 shadow-2xs font-bold text-slate-900 ring-1 ring-amber-500/20' : 'bg-white/60 border-amber-200 text-slate-600'
                      }`}>
                        <input
                          type="radio"
                          name="commRule"
                          checked={commissionRule === 'FIXED_BONUS'}
                          onChange={() => setCommissionRule('FIXED_BONUS')}
                          className="mt-0.5 text-amber-600 focus:ring-amber-500"
                        />
                        <div className="flex-1">
                          <div className="font-bold flex items-center gap-1.5">
                            <span>🎁 Prime Fixe de Sauvetage Cash</span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                            L agent initial conserve sa commission, et l entreprise verse une prime supplémentaire au remplaçant.
                          </p>
                          {commissionRule === 'FIXED_BONUS' && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-700">Montant de la prime :</span>
                              <input
                                type="number"
                                value={rescueBonusAmount}
                                onChange={(e) => setRescueBonusAmount(e.target.value)}
                                className="w-20 text-xs border border-amber-300 rounded-lg p-1 font-bold"
                              />
                              <span className="text-xs font-bold text-amber-800">DH / Colis</span>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: A QUITTÉ LA SOCIÉTÉ */}
              {workStatus === 'QUITTED' && (
                <div className="space-y-3 p-4 rounded-2xl bg-rose-50 border border-rose-200">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>L agent a quitté la société. Son compte sera désactivé.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-rose-950 mb-1">
                      Transférer toutes ses commandes en transit vers :
                    </label>
                    <select
                      value={replacementAgentId}
                      onChange={(e) => setReplacementAgentId(e.target.value)}
                      required
                      className="w-full text-xs font-semibold border border-rose-300 rounded-xl p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    >
                      <option value="">-- Choisir le repreneur --</option>
                      {users
                        .filter((u) => u.role === 'CALL_AGENT' && u.id !== absenceUser.id && u.active)
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            🎧 {u.name} ({u.email})
                          </option>
                        ))}
                    </select>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-semibold text-rose-900 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={transferOrdersOnQuit}
                      onChange={(e) => setTransferOrdersOnQuit(e.target.checked)}
                      className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    <span>Attribuer 100% des commissions de ces commandes au nouvel agent</span>
                  </label>
                </div>
              )}

              </div>

              {/* Actions Footer */}
              <div className="px-6 py-4 border-t border-slate-200/80 bg-slate-50/90 backdrop-blur-xs flex items-center justify-end gap-2.5 flex-shrink-0 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => setShowAbsenceModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingAbsence}
                  className="px-5 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {savingAbsence ? 'Enregistrement...' : 'Valider & Appliquer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
