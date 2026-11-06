'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';

export interface Store {
  id: string;
  name: string;
  slug: string;
  currency: string;
  webhookSecret: string;
}

export interface CountryConfig {
  code: string; // 'MA', 'SN', 'CI', 'AE', 'SA'
  name: string; // 'Maroc', 'Sénégal'
  flag: string; // '🇲🇦', '🇸🇳'
  currency: string; // 'MAD', 'XOF'
}

export const COUNTRIES: CountryConfig[] = [
  { code: 'MA', name: 'Maroc', flag: '🇲🇦', currency: 'MAD' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳', currency: 'XOF' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', currency: 'XOF' },
  { code: 'AE', name: 'Émirats Arabes Unis', flag: '🇦🇪', currency: 'AED' },
  { code: 'SA', name: 'Arabie Saoudite', flag: '🇸🇦', currency: 'SAR' },
];

export function getStoreCountry(store: { currency?: string; name?: string; slug?: string }): CountryConfig {
  const cur = store.currency?.toUpperCase() || 'MAD';
  const name = (store.name || '').toLowerCase();
  const slug = (store.slug || '').toLowerCase();

  if (cur === 'XOF' || name.includes('sénégal') || name.includes('senegal') || slug.includes('senegal') || slug.includes('sn')) {
    return { code: 'SN', name: 'Sénégal', flag: '🇸🇳', currency: 'XOF' };
  }
  if (cur === 'AED' || name.includes('emirates') || name.includes('dubai')) {
    return { code: 'AE', name: 'Émirats Arabes Unis', flag: '🇦🇪', currency: 'AED' };
  }
  if (cur === 'SAR' || name.includes('saudi') || name.includes('ksa')) {
    return { code: 'SA', name: 'Arabie Saoudite', flag: '🇸🇦', currency: 'SAR' };
  }
  return { code: 'MA', name: 'Maroc', flag: '🇲🇦', currency: 'MAD' };
}

interface StoreContextType {
  selectedCountry: string;
  setSelectedCountry: (countryCode: string) => void;
  availableCountries: CountryConfig[];
  currentCountry: CountryConfig;
  selectedStoreId: string;
  setSelectedStoreId: (id: string) => void;
  stores: Store[]; // Stores for selected country
  allStores: Store[]; // All stores in system
  allUserStores: Store[]; // Stores accessible to user
  refreshStores: () => void;
  currentStore?: Store;
}

const StoreContext = createContext<StoreContextType>({
  selectedCountry: 'MA',
  setSelectedCountry: () => {},
  availableCountries: COUNTRIES.slice(0, 2),
  currentCountry: COUNTRIES[0],
  selectedStoreId: 'ALL',
  setSelectedStoreId: () => {},
  stores: [],
  allStores: [],
  allUserStores: [],
  refreshStores: () => {},
});

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, isCallAgent, assignedStoreIds } = useAuth();

  const [selectedCountry, setSelectedCountryState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('cod_saas_country');
        if (saved) return saved;
      } catch (e) {}
    }
    return 'MA';
  });

  const [selectedStoreId, setSelectedStoreIdState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('cod_saas_store_id');
        if (saved) return saved;
      } catch (e) {}
    }
    return 'ALL';
  });

  const setSelectedCountry = (countryCode: string) => {
    setSelectedCountryState(countryCode);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cod_saas_country', countryCode);
      } catch (e) {}
    }

    // Instantly switch stores to the new country so all pages and views react immediately
    const targetStores = allUserStores.filter((s) => getStoreCountry(s).code === countryCode);
    if (targetStores.length > 0) {
      const storeIds = targetStores.map((s) => s.id);
      const newStoreId = storeIds.length === 1 ? storeIds[0] : storeIds.join(',');
      setSelectedStoreIdState(newStoreId);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('cod_saas_store_id', newStoreId);
        } catch (e) {}
      }
    } else {
      setSelectedStoreIdState('NONE');
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('cod_saas_store_id', 'NONE');
        } catch (e) {}
      }
    }
  };

  const setSelectedStoreId = (id: string) => {
    setSelectedStoreIdState(id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cod_saas_store_id', id);
      } catch (e) {}
    }
  };

  const [rawStores, setRawStores] = useState<Store[]>([]);

  const fetchStores = async () => {
    try {
      const res = await fetch('/api/stores');
      const data = await res.json();
      if (data.success) {
        setRawStores(data.stores);
      }
    } catch (e) {
      console.error('Failed to load stores', e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchStores();
    }
  }, [currentUser]);

  // Compute all stores accessible to current user
  const allUserStores = useMemo(() => {
    if (isCallAgent && assignedStoreIds && assignedStoreIds.length > 0) {
      return rawStores.filter((s) => assignedStoreIds.includes(s.id));
    }
    return rawStores;
  }, [isCallAgent, assignedStoreIds, rawStores]);

  // Compute available countries based on accessible stores
  const availableCountries = useMemo(() => {
    const codesWithStores = new Set(allUserStores.map((s) => getStoreCountry(s).code));
    if (codesWithStores.size === 0) {
      return COUNTRIES.slice(0, 2); // Default to MA and SN
    }
    // Always include MA and SN for admin/managers
    if (!isCallAgent) {
      codesWithStores.add('MA');
      codesWithStores.add('SN');
    }
    return COUNTRIES.filter((c) => codesWithStores.has(c.code));
  }, [allUserStores, isCallAgent]);

  // Auto-align selectedCountry for call agents if needed
  useEffect(() => {
    if (rawStores.length === 0) return;
    if (availableCountries.length > 0) {
      const exists = availableCountries.some((c) => c.code === selectedCountry);
      if (!exists) {
        setSelectedCountry(availableCountries[0].code);
      }
    }
  }, [availableCountries, selectedCountry, rawStores.length]);

  // Stores filtered by selected country
  const stores = useMemo(() => {
    return allUserStores.filter((s) => getStoreCountry(s).code === selectedCountry);
  }, [allUserStores, selectedCountry]);

  // Current active country config
  const currentCountry = useMemo(() => {
    return COUNTRIES.find((c) => c.code === selectedCountry) || COUNTRIES[0];
  }, [selectedCountry]);

  // Maintain valid selectedStoreId when country or stores change
  useEffect(() => {
    if (rawStores.length === 0) return;
    if (stores.length === 0) {
      setSelectedStoreId('NONE');
      return;
    }

    const storeIds = stores.map((s) => s.id);
    const countryAllId = storeIds.join(',');

    // If current selectedStoreId belongs to another country or is 'ALL' or 'NONE'
    const isSingleMatch = storeIds.includes(selectedStoreId);
    const isAllMatch = selectedStoreId === countryAllId;

    if (!isSingleMatch && !isAllMatch) {
      // Default to all stores of this country (or single store if only 1 exists)
      setSelectedStoreId(storeIds.length === 1 ? storeIds[0] : countryAllId);
    }
  }, [stores, selectedCountry, rawStores.length]);

  // Current Store object
  const currentStore = useMemo(() => {
    const found = allUserStores.find((s) => s.id === selectedStoreId);
    if (found) return found;

    return {
      id: selectedStoreId,
      name: `Toutes les boutiques (${currentCountry.name})`,
      slug: `all-${currentCountry.code.toLowerCase()}`,
      currency: currentCountry.currency,
      webhookSecret: '',
    };
  }, [allUserStores, selectedStoreId, currentCountry]);

  return (
    <StoreContext.Provider
      value={{
        selectedCountry,
        setSelectedCountry,
        availableCountries,
        currentCountry,
        selectedStoreId,
        setSelectedStoreId,
        stores,
        allStores: rawStores,
        allUserStores,
        refreshStores: fetchStores,
        currentStore,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
