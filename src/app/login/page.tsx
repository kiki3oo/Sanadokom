'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  PhoneCall,
  Shield,
  Zap,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Headphones,
  Crown,
  Sparkles,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t, language } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success && result.user) {
        if (result.user.role === 'CALL_AGENT') {
          router.push('/call-center');
        } else {
          router.push('/');
        }
      } else {
        setError(result.error || 'Email ou mot de passe incorrect');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-screen bg-gradient-to-br from-[#070A12] via-[#0B0F19] to-[#0D1527] flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden select-none"
    >
      {/* Background Luxury Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <div className="flex items-center justify-between max-w-5xl w-full mx-auto relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/30 border border-yellow-200/50">
            <Crown className="w-5 h-5 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-white font-black text-sm tracking-tight font-heading">SANADOKOM</span>
              <span className="px-1.5 py-0.2 text-[8px] font-black uppercase rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                سندكم
              </span>
            </div>
            <span className="text-slate-400 text-[10px] font-semibold tracking-wider uppercase block">
              COD Operating System
            </span>
          </div>
        </div>

        <div>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Main Luxury Login Card */}
      <div className="max-w-md w-full mx-auto my-8 relative z-10">
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-7 sm:p-9 shadow-2xl border border-white/50 ring-1 ring-black/5">
          {/* Card Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center mx-auto mb-3 border border-slate-800 shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">
              {t('login.title')}
            </h1>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
              {t('login.subtitle')}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('login.email')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder={t('login.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-semibold shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('login.password')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-semibold shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-black text-xs text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.99] transition-all shadow-lg shadow-black/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <span>{t('login.signingIn')}</span>
              ) : (
                <>
                  <span>{t('login.signInBtn')}</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts Helper */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2.5 text-center">
              {t('login.quickAccess')}
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('agent.salma@codsaas.com', 'agent123')}
                className="p-2.5 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 hover:bg-emerald-100/80 text-left transition-all text-xs cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-1.5 text-emerald-900 font-extrabold text-[11px]">
                  <PhoneCall className="w-3 h-3 text-emerald-600" />
                  <span>Salma (Agent)</span>
                </div>
                <div className="text-[10px] text-emerald-700 font-mono mt-0.5 truncate">
                  agent.salma@codsaas.com
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@codsaas.com', 'admin123')}
                className="p-2.5 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/70 to-yellow-50/40 hover:bg-amber-100/80 text-left transition-all text-xs cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-1.5 text-amber-950 font-extrabold text-[11px]">
                  <Crown className="w-3 h-3 text-amber-600" />
                  <span>Yassine (Admin)</span>
                </div>
                <div className="text-[10px] text-amber-800 font-mono mt-0.5 truncate">
                  admin@codsaas.com
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-slate-500 text-[11px] relative z-10">
        <span>COD PRESTIGE Enterprise Edition © {new Date().getFullYear()} • OptiTrav High-Ticket Architecture</span>
      </div>
    </div>
  );
}
