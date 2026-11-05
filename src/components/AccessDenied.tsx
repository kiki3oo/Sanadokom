'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowRight, PhoneCall } from 'lucide-react';

export default function AccessDenied({ moduleName }: { moduleName?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-xs">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-black text-slate-900 tracking-tight">
        Accès Restreint aux Administrateurs
      </h2>
      <p className="text-xs text-slate-500 max-w-md mt-2">
        Votre rôle actuel ne vous permet pas de consulter {moduleName || 'cette section'}. Ce module est réservé à la direction et aux administrateurs financiers.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Link
          href="/call-center"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Aller au Centre d'Appel (Mes Leads)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
