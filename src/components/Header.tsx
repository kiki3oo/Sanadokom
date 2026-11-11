'use client';

import React, { useState } from 'react';
import { useStore, getStoreCountry } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import AgentPresenceBadge from '@/components/AgentPresenceBadge';
import SmartAlertHub from '@/components/SmartAlertHub';
import { Store, Plus, LogOut, Shield, PhoneCall, Menu, X } from 'lucide-react';

export default function Header({ onToggleMobileMenu }: { onToggleMobileMenu?: () => void }) {
  const {
    selectedCountry,
    setSelectedCountry,
    availableCountries,
    currentCountry,
    selectedStoreId,
    setSelectedStoreId,
    stores,
    refreshStores,
    currentStore,
  } = useStore();

  const { currentUser, allUsers, setCurrentUser, isAdmin, isCallAgent, isManager, logout } = useAuth();
  const { t } = useLanguage();
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreSlug, setNewStoreSlug] = useState('');
  const [newStoreCurrency, setNewStoreCurrency] = useState(currentCountry.currency);
  const [submitting, setSubmitting] = useState(false);

  const handleOpenAddStore = () => {
    setNewStoreCurrency(currentCountry.currency);
    setShowAddStoreModal(true);
  };

  // Filter users for the switcher: Always include admins, and filter agents strictly by the active country/stores
  const countryUsers = React.useMemo(() => {
    const targetStoreIds =
      selectedStoreId && selectedStoreId !== 'ALL' && selectedStoreId !== 'NONE'
        ? selectedStoreId.split(',').map((id) => id.trim())
        : stores.map((s) => s.id);

    return allUsers.filter((u) => {
      // 1. Always keep Admins and Logistics Managers in the switcher list
      if (u.role === 'ADMIN' || u.role === 'LOGISTICS_MANAGER') return true;

      // 2. Keep currently selected user so select doesn't break
      if (currentUser?.id === u.id) return true;

      // 3. For Call Agents: match assignedStoreIds with target stores of the current country
      if (u.permissions) {
        try {
          const p = typeof u.permissions === 'string' ? JSON.parse(u.permissions) : u.permissions;
          if (Array.isArray(p.assignedStoreIds) && p.assignedStoreIds.length > 0) {
            return p.assignedStoreIds.some((id: string) => targetStoreIds.includes(id));
          }
        } catch (e) {}
      }

      return false;
    });
  }, [allUsers, stores, selectedStoreId, currentUser?.id]);

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName || !newStoreSlug) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newStoreName, slug: newStoreSlug, currency: newStoreCurrency }),
      });
      const data = await res.json();
      if (data.success) {
        refreshStores();
        // Determine country of the created store
        const country = getStoreCountry(data.store);
        setSelectedCountry(country.code);
        setSelectedStoreId(data.store.id);
        setShowAddStoreModal(false);
        setNewStoreName('');
        setNewStoreSlug('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Hamburger & Country Selector (Store Selector hidden on mobile, accessible in Drawer) */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="p-2 -ml-1 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 md:hidden transition-colors cursor-pointer shrink-0"
          title="Menu"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* 1. Sélecteur de Pays (Drapeau + Pays) */}
        {isCallAgent ? (
          availableCountries.length === 1 ? (
            <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-50 hover:bg-slate-100 transition-colors px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 text-slate-900 font-black text-xs shadow-2xs shrink-0">
              <span className="text-base">{availableCountries[0].flag}</span>
              <span className="hidden sm:inline">{availableCountries[0].name}</span>
              <span className="sm:hidden text-[11px] font-extrabold">{availableCountries[0].code}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs transition-all shrink-0">
              <select aria-label={t('header.changeCountry', 'Changer de pays')}
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-900 ps-2 pe-1 py-1 cursor-pointer max-w-[110px] sm:max-w-none truncate"
              >
                {availableCountries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>
          )
        ) : (
          /* Admin & Manager Country Switcher */
          <div className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100/90 transition-all p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0">
            <select aria-label={t('header.changeCountry', 'Changer de pays')}
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="bg-transparent text-xs font-black text-slate-900 ps-2 pe-1 py-1 cursor-pointer max-w-[135px] sm:max-w-none truncate"
              title="Changer de pays"
            >
              {availableCountries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.currency})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 2. Sélecteur de Boutique (uniquement affiché sur desktop/tablette sm+, sur mobile il est dans le Menu) */}
        <div className="hidden sm:flex items-center">
          {isCallAgent ? (
            stores.length === 1 ? (
              /* Single assigned store badge */
              <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 px-3 py-1.5 rounded-xl border border-amber-200/90 text-amber-950 font-bold text-xs shadow-2xs">
                <Store className="w-4 h-4 text-amber-600" />
                <span className="truncate max-w-[140px]">🛍️ {stores[0]?.name || t('nav.allModules')}</span>
                <span className="text-[10px] bg-amber-200/80 text-amber-950 px-1.5 py-0.5 rounded-md font-extrabold ml-1 border border-amber-300">
                  {t('header.assigned')}
                </span>
              </div>
            ) : stores.length > 1 ? (
              /* Multiple assigned stores in this country */
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50/80 to-yellow-50/60 p-1 rounded-xl border border-amber-200 shadow-2xs">
                <Store className="w-4 h-4 text-amber-600 ml-2" />
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="bg-transparent text-xs font-extrabold text-amber-950 pr-6 py-1 focus:outline-none cursor-pointer max-w-[180px] truncate"
                >
                  <option value={stores.map((s) => s.id).join(',')}>
                    {t('header.allStoresOfCountry')} ({currentCountry.name})
                  </option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      🛍️ {s.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 font-semibold text-xs">
                <Store className="w-4 h-4 text-rose-500" />
                <span>{t('header.noStoreOfCountry')} ({currentCountry.name})</span>
              </div>
            )
          ) : (
            /* Admin / Manager Scoped Store Selector */
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
              <Store className="w-4 h-4 text-indigo-600 ml-2" />
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="bg-transparent text-xs font-extrabold text-slate-900 pr-6 py-1 focus:outline-none cursor-pointer max-w-[190px] truncate"
              >
                {stores.length > 1 && (
                  <option value={stores.map((s) => s.id).join(',')}>
                    {t('header.allStoresOfCountry')} ({currentCountry.name})
                  </option>
                )}
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    🛍️ {s.name}
                  </option>
                ))}
                {stores.length === 0 && (
                  <option value="NONE">{t('header.noStoreOfCountry')} ({currentCountry.name})</option>
                )}
              </select>
            </div>
          )}
        </div>

        {/* New Store button: Only for Admin / Manager */}
        {!isCallAgent && (
          <button
            onClick={handleOpenAddStore}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
            title={t('header.newProject')}
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('header.newProject')}</span>
          </button>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Smart Operational Alerts Hub (Notifications Bell & Morning Brief) */}
        <SmartAlertHub />

        {/* Live Agents Presence Indicator */}
        {isManager && (
          <div className="flex items-center">
            <AgentPresenceBadge />
          </div>
        )}

        {/* Language Switcher Dropdown (Desktop only in header, accessible in drawer for mobile) */}
        <div className="hidden sm:block">
          <LanguageSwitcher />
        </div>

        {/* Currency Tag */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 text-xs font-black border border-emerald-200/90 shadow-2xs">
          <span>{currentCountry.flag}</span>
          <span className="font-heading tracking-tight">{t('header.currencyLabel')} {currentCountry.currency}</span>
        </div>

        {/* User Session & Role (Desktop only) */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50/90 hover:bg-slate-100 transition-colors border border-slate-200 rounded-xl p-1 px-2.5 shadow-2xs">
          {currentUser?.role === 'ADMIN' ? (
            <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          ) : (
            <PhoneCall className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          )}

          <div className="text-left">
            <span className="text-[9px] text-slate-400 block leading-tight font-black uppercase tracking-wider">
              {t('header.activeSession')}
            </span>

            {/* If Admin: allow testing other accounts with dropdown */}
            {isAdmin ? (
              <select
                value={currentUser?.id || ''}
                onChange={(e) => {
                  const found = allUsers.find((u) => u.id === e.target.value);
                  if (found) setCurrentUser(found);
                }}
                className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                {countryUsers.length > 0 ? (
                  countryUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role === 'ADMIN' ? '👑 Admin' : '🎧 Agent'})
                    </option>
                  ))
                ) : (
                  <option value="admin-default">{currentUser?.name || 'Younes OUAKRIM'} (👑 Admin)</option>
                )}
              </select>
            ) : (
              <span className="text-xs font-bold text-slate-900 block truncate max-w-[120px]">
                {currentUser?.name || 'Agent'}
              </span>
            )}
          </div>
        </div>

        {/* User Avatar badge */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-900 to-slate-800 text-amber-300 ring-2 ring-amber-400/30 flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
          {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'YA'}
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer shrink-0"
          title={t('login.logout')}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>

    {/* Modal Add Store (Rendered outside header to avoid stacking context & clipping) */}
    {showAddStoreModal && (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 my-auto animate-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-black text-slate-900">{t('header.createStoreTitle')}</h2>
            <button
              type="button"
              onClick={() => setShowAddStoreModal(false)}
              className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            {t('header.createStoreDesc')}
          </p>

          <form onSubmit={handleCreateStore} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('header.countryAndCurrency')}
              </label>
              <select
                value={newStoreCurrency}
                onChange={(e) => setNewStoreCurrency(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2.5 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
              >
                <option value="MAD">🇲🇦 Maroc (MAD - Dirham)</option>
                <option value="XOF">🇸🇳 Sénégal (XOF / FCFA)</option>
                <option value="CI_XOF">🇨🇮 Côte d'Ivoire (XOF / FCFA)</option>
                <option value="AED">🇦🇪 Émirats Arabes Unis (AED)</option>
                <option value="SAR">🇸🇦 Arabie Saoudite (SAR)</option>
                <option value="EUR">🇪🇺 Europe (EUR - Euro)</option>
                <option value="USD">🇺🇸 International (USD - Dollar)</option>
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {t('header.storeCurrencyNotice')}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('header.storeName')}</label>
              <input
                type="text"
                required
                placeholder={newStoreCurrency === 'XOF' ? 'Ex: Dakar Parfums Store' : 'Ex: Moroccan Argan Glow'}
                value={newStoreName}
                onChange={(e) => {
                  setNewStoreName(e.target.value);
                  if (!newStoreSlug) {
                    setNewStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                  }
                }}
                className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('header.storeSlug')}</label>
              <input
                type="text"
                required
                placeholder="Ex: dakar-parfums"
                value={newStoreSlug}
                onChange={(e) => setNewStoreSlug(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowAddStoreModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                {t('btn.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {submitting ? t('header.creating') : t('header.createStoreBtn')}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </>
  );
}
