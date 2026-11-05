'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '@/lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  dir: 'rtl' | 'ltr';
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'fr',
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
  dir: 'ltr',
  isRtl: false,
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('fr');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cod_saas_lang') as Language;
      if (saved && (saved === 'ar' || saved === 'fr' || saved === 'en')) {
        setLanguageState(saved);
      }
    } catch (e) {
      console.error('Error loading saved language:', e);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('cod_saas_lang', lang);
    } catch (e) {
      console.error('Error saving language:', e);
    }
  };

  const isRtl = language === 'ar';
  const dir = isRtl ? 'rtl' : 'ltr';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = dir;
    }
  }, [language, dir]);

  const t = (key: string, fallback?: string): string => {
    const entry = translations[key];
    if (!entry) {
      return fallback || key;
    }
    return entry[language] || fallback || entry['fr'] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
