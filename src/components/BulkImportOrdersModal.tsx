'use client';

import React, { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  ClipboardPaste,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Users,
  Building2,
  ShieldAlert,
  ArrowRight,
  PhoneCall,
  PackageCheck,
  Check,
  FileText,
} from 'lucide-react';

interface BulkImportOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
  defaultStatus?: 'PENDING' | 'CONFIRMED';
}

interface ParsedOrderRow {
  customerName: string;
  customerPhone: string;
  customerCity: string;
  customerAddress: string;
  customerNote?: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  source: string;
  utmSource?: string;
  utmCampaign?: string;
  adSet?: string;
  isValid: boolean;
  validationError?: string;
}

export default function BulkImportOrdersModal({
  isOpen,
  onClose,
  onImportSuccess,
  defaultStatus = 'PENDING',
}: BulkImportOrdersModalProps) {
  const { stores, selectedStoreId, currentCountry } = useStore();
  const { currentUser, allUsers } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [targetStoreId, setTargetStoreId] = useState(
    selectedStoreId && selectedStoreId !== 'ALL' ? selectedStoreId : stores[0]?.id || ''
  );
  const [targetStatus, setTargetStatus] = useState<'PENDING' | 'CONFIRMED'>(defaultStatus);
  const [assignMode, setAssignMode] = useState<'AUTO_ROUND_ROBIN' | 'SPECIFIC_AGENT' | 'UNASSIGNED'>('AUTO_ROUND_ROBIN');
  const [specificAgentId, setSpecificAgentId] = useState<string>('');
  const [defaultSource, setDefaultSource] = useState('Import Excel / CSV');

  // Parsed rows state
  const [parsedRows, setParsedRows] = useState<ParsedOrderRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [pasteContent, setPasteContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    importedCount: number;
    failedCount: number;
    errors?: any[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter Agents for the specific store
  const availableAgents = useMemo(() => {
    return allUsers.filter((u) => u.role === 'CALL_AGENT' && u.active);
  }, [allUsers]);

  // Selected Store Object
  const currentStore = useMemo(() => {
    return stores.find((s) => s.id === targetStoreId) || stores[0];
  }, [stores, targetStoreId]);

  if (!isOpen) return null;

  // Helper to map and sanitize row keys
  const mapRawObjectToParsedRow = (raw: Record<string, any>): ParsedOrderRow => {
    const keys = Object.keys(raw);
    const getVal = (candidates: string[]) => {
      for (const c of candidates) {
        const foundKey = keys.find(
          (k) =>
            k.trim().toLowerCase() === c.toLowerCase() ||
            k.trim().toLowerCase().includes(c.toLowerCase())
        );
        if (foundKey && raw[foundKey] !== undefined && raw[foundKey] !== null) {
          return String(raw[foundKey]).trim();
        }
      }
      return '';
    };

    const name = getVal(['nom du client', 'nom client', 'nom', 'name', 'client', 'الاسم', 'اسم الزبون']);
    const rawPhone = getVal(['téléphone', 'telephone', 'phone', 'tel', 'mobile', 'gsm', 'الهاتف', 'رقم الهاتف', 'numéro', 'numero']);
    const city = getVal(['ville', 'city', 'المدينة', 'gouvernorat', 'région', 'region']) || (currentStore?.currency === 'XOF' ? 'Dakar' : 'Casablanca');
    const address = getVal(['adresse', 'address', 'quartier', 'العنوان', 'حي']);
    const note = getVal(['note', 'remarque', 'commentaire', 'ملاحظة']);
    const product = getVal(['produit', 'product', 'article', 'sku', 'المنتج', 'سلعة']) || 'Produit Principal';
    const rawQty = getVal(['quantité', 'quantite', 'quantity', 'qty', 'qte', 'الكمية']);
    const rawPrice = getVal(['prix total', 'total', 'prix', 'montant', 'price', 'cod', 'المبلغ', 'السعر']);
    const source = getVal(['source', 'المصدر', 'canal']) || defaultSource;
    const utmCampaign = getVal(['campagne', 'campaign', 'utm_campaign', 'utm campaign', 'الحملة']);
    const utmSource = getVal(['utm_source', 'utm source', 'plateforme']);
    const adSet = getVal(['adset', 'ad_set', 'ad set']);

    const cleanPhone = rawPhone.replace(/[^0-9+]/g, '');
    const quantity = Math.max(1, parseInt(rawQty) || 1);
    const parsedAmount = parseFloat(rawPrice);
    const defaultProductPrice = currentStore?.currency === 'XOF' ? 15000 : 299;
    const totalAmount = !isNaN(parsedAmount) && parsedAmount > 0 ? parsedAmount : defaultProductPrice * quantity;

    let isValid = true;
    let validationError = '';

    if (!cleanPhone || cleanPhone.length < 8) {
      isValid = false;
      validationError = 'Numéro de téléphone invalide ou manquant';
    }

    return {
      customerName: name || `Client ${cleanPhone ? cleanPhone.slice(-4) : 'Nouveau'}`,
      customerPhone: cleanPhone,
      customerCity: city,
      customerAddress: address,
      customerNote: note,
      productName: product,
      quantity,
      totalAmount,
      source,
      utmCampaign: utmCampaign || undefined,
      utmSource: utmSource || undefined,
      adSet: adSet || undefined,
      isValid,
      validationError,
    };
  };

  // Handle File Upload (.xlsx, .xls, .csv)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!data || data.length === 0) {
          alert('Le fichier est vide ou format non reconnu.');
          return;
        }

        const parsed = (data as Record<string, any>[]).map(mapRawObjectToParsedRow);
        setParsedRows(parsed);
      } catch (err) {
        console.error('Error reading excel file:', err);
        alert('Erreur lors de la lecture du fichier Excel/CSV.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Handle Quick Paste Parse
  const handleParsePastedText = () => {
    if (!pasteContent.trim()) return;
    setImportResult(null);

    const lines = pasteContent.trim().split('\n').filter((l) => l.trim().length > 0);
    if (lines.length === 0) return;

    // Detect delimiter: tab or semicolon or comma
    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : firstLine.includes(';') ? ';' : ',';

    // Check if first line is a header
    const headers = firstLine.split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));
    const isHeaderLine = headers.some((h) =>
      ['nom', 'name', 'tel', 'phone', 'telephone', 'ville', 'city', 'prix', 'total'].includes(h.toLowerCase())
    );

    const dataLines = isHeaderLine ? lines.slice(1) : lines;
    const finalHeaders = isHeaderLine
      ? headers
      : ['Nom', 'Téléphone', 'Ville', 'Adresse', 'Produit', 'Quantité', 'Prix Total'];

    const parsed: ParsedOrderRow[] = [];

    dataLines.forEach((line) => {
      const parts = line.split(delimiter).map((p) => p.trim().replace(/^"|"$/g, ''));
      const rowObj: Record<string, any> = {};
      finalHeaders.forEach((h, idx) => {
        rowObj[h] = parts[idx] || '';
      });
      parsed.push(mapRawObjectToParsedRow(rowObj));
    });

    setParsedRows(parsed);
  };

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const isSn = currentStore?.currency === 'XOF';
    const sampleHeaders = [
      'Nom du client',
      'Téléphone',
      'Ville',
      'Adresse',
      'Produit',
      'Quantité',
      'Prix Total',
      'Source',
      'Campagne UTM',
      'AdSet',
      'Remarque',
    ];

    const sampleRows = isSn
      ? [
          [
            'Mamadou Diallo',
            '+221771234567',
            'Dakar (Almadies)',
            'Près de la Banque CBAO',
            'Pack Sérum Éclat x2',
            1,
            24500,
            'Facebook Ads',
            'Promo_Senegal_Oct',
            'Femmes_Dakar',
            'Client souhaite être appelé avant 14h',
          ],
          [
            'Awa Ndiaye',
            '785432109',
            'Thiès',
            'Quartier Carrière',
            'Montre Connectée Sport',
            1,
            19000,
            'TikTok Ads',
            'Montres_SN',
            'Tech_Interets',
            'Livraison le matin',
          ],
        ]
      : [
          [
            'Fatima Zahra El Amrani',
            '0661234567',
            'Casablanca',
            'Maarif, Rue Jura, Immeuble 12',
            'Pack Beauté Bio Luxe',
            1,
            399,
            'Facebook Ads',
            'Campagne_Maroc_Automne',
            'Femmes_Casa_Rabat',
            'Appeler le matin SVP',
          ],
          [
            'Yassine Benali',
            '0612345678',
            'Marrakech',
            'Gueliz, Boulevard Mohamed V',
            'Montre Smart Ultra',
            2,
            599,
            'Instagram',
            'Influencer_Yassine',
            'Hommes_Sport',
            'Confirmer l heure avant livraison',
          ],
        ];

    const ws = XLSX.utils.aoa_to_sheet([sampleHeaders, ...sampleRows]);
    // Auto-fit column widths
    ws['!cols'] = sampleHeaders.map(() => ({ wch: 22 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Commandes_Import');

    const countryCode = currentStore?.currency === 'XOF' ? 'Senegal_SN' : 'Maroc_MA';
    XLSX.writeFile(wb, `Modele_Import_Commandes_${countryCode}.xlsx`);
  };

  // Submit Bulk Import to API
  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert('Aucune commande valide avec numéro de téléphone correct à importer.');
      return;
    }

    setIsSubmitting(true);
    setImportResult(null);

    try {
      const res = await fetch('/api/orders/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: targetStoreId,
          defaultStatus: targetStatus,
          source: defaultSource,
          assignMode,
          specificAgentId: assignMode === 'SPECIFIC_AGENT' ? specificAgentId : null,
          orders: validRows,
          userName: currentUser?.name || 'Administrateur',
          userRole: currentUser?.role || 'ADMIN',
          userId: currentUser?.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setImportResult({
          success: true,
          importedCount: data.importedCount,
          failedCount: data.failedCount,
          errors: data.errors,
        });
        onImportSuccess();
      } else {
        alert(data.error || 'Erreur lors de l importation.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Erreur réseau lors de l importation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">
                  {t('bulk.title', 'Importation en Masse de Commandes')}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Excel & CSV
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {t(
                  'bulk.subtitle',
                  'Importez des dizaines ou centaines de commandes d\'un coup via fichier Excel ou Copier-Coller'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Target Store & Destination Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            {/* Store / Country Selection */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                {t('bulk.targetStore', 'Boutique / Pays de destination')}
              </label>
              <select
                value={targetStoreId}
                onChange={(e) => setTargetStoreId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.currency === 'XOF' ? '🇸🇳 ' : '🇲🇦 '} {s.name} ({s.currency})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Initial Status */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                {t('bulk.targetStatus', 'Statut initial des commandes')}
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
              >
                <option value="PENDING">{t('bulk.statusPending', '📞 En attente (Pour le Call Center)')}</option>
                <option value="CONFIRMED">{t('bulk.statusConfirmed', '📦 Confirmé directement (Expédition)')}</option>
              </select>
            </div>

            {/* Assignment Mode (Round-Robin or Specific Agent) */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                {t('bulk.assignMode', 'Affectation des agents')}
              </label>
              <select
                value={assignMode}
                onChange={(e) => setAssignMode(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
              >
                <option value="AUTO_ROUND_ROBIN">{t('bulk.assignRoundRobin', '🔄 Distribution équitable automatique')}</option>
                <option value="SPECIFIC_AGENT">{t('bulk.assignSpecific', '👤 Assigner à un agent spécifique')}</option>
                <option value="UNASSIGNED">{t('bulk.assignUnassigned', '⚪ Laisser non assigné')}</option>
              </select>
            </div>
          </div>

          {/* If specific agent selected */}
          {assignMode === 'SPECIFIC_AGENT' && (
            <div className="bg-indigo-50/60 border border-indigo-100 p-3 rounded-xl flex items-center gap-3 text-xs">
              <Users className="w-4 h-4 text-indigo-600 shrink-0" />
              <div className="flex-1">
                <span className="font-bold text-indigo-900 block">Choisir l agent de confirmation :</span>
                <select
                  value={specificAgentId}
                  onChange={(e) => setSpecificAgentId(e.target.value)}
                  className="mt-1 w-full sm:w-72 bg-white border border-indigo-200 rounded-lg p-1.5 font-semibold text-xs"
                >
                  <option value="">Sélectionner un agent...</option>
                  {availableAgents.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name} ({ag.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Import Method Tabs (Upload vs Paste) */}
          <div className="flex items-center justify-between border-b border-slate-200">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-1.5 px-4 py-2 border-b-2 text-xs font-bold transition-all ${
                  activeTab === 'upload'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>{t('bulk.uploadFile', 'Fichier Excel / CSV')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`flex items-center gap-1.5 px-4 py-2 border-b-2 text-xs font-bold transition-all ${
                  activeTab === 'paste'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ClipboardPaste className="w-4 h-4" />
                <span>{t('bulk.quickPaste', 'Copier-Coller Rapide')}</span>
              </button>
            </div>

            {/* Template Download Button */}
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
              title="Télécharger un modèle Excel exemple"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('bulk.downloadTemplate', 'Télécharger Modèle Excel')}</span>
            </button>
          </div>

          {/* TAB 1: FILE UPLOAD ZONE */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 group-hover:border-indigo-300 shadow-xs flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">
                    {fileName ? (
                      <span className="text-indigo-600 flex items-center justify-center gap-1.5">
                        <FileText className="w-4 h-4" /> {fileName}
                      </span>
                    ) : (
                      'Cliquez ou glissez-déposez votre fichier Excel / CSV ici'
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Formats acceptés : <strong>.xlsx</strong>, <strong>.xls</strong>, <strong>.csv</strong> (jusqu à 2000 lignes)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUICK PASTE TEXTAREA */}
          {activeTab === 'paste' && (
            <div className="space-y-2">
              <textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                rows={5}
                placeholder="Copiez des lignes directement depuis Google Sheets ou Excel et collez-les ici...&#10;Exemple :&#10;Fatima Zahra	0661234567	Casablanca	Maarif	Pack Beauté	1	399&#10;Yassine Benali	0612345678	Marrakech	Gueliz	Montre Ultra	1	299"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParsePastedText}
                  disabled={!pasteContent.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  Analyser et prévisualiser les données
                </button>
              </div>
            </div>
          )}

          {/* Success Banner if finished */}
          {importResult && importResult.success && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold">
                    {importResult.importedCount} commandes importées avec succès !
                  </span>
                  {importResult.failedCount > 0 && (
                    <span className="text-emerald-700 ml-2">
                      ({importResult.failedCount} lignes ignorées car numéro manquant).
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 text-xs"
              >
                Terminer & Fermer
              </button>
            </div>
          )}

          {/* PREVIEW TABLE (if rows are parsed) */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-3">
                  <span className="text-slate-800">
                    Aperçu des données ({parsedRows.length} lignes trouvées) :
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                    🟢 {validCount} valides
                  </span>
                  {invalidCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px]">
                      ⚠️ {invalidCount} incomplètes
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setParsedRows([]);
                    setFileName('');
                    setPasteContent('');
                  }}
                  className="text-slate-400 hover:text-rose-600 text-[11px]"
                >
                  Effacer
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Client</th>
                      <th className="p-2.5">Téléphone</th>
                      <th className="p-2.5">Ville</th>
                      <th className="p-2.5">Produit</th>
                      <th className="p-2.5">Total</th>
                      <th className="p-2.5">Source</th>
                      <th className="p-2.5">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedRows.slice(0, 50).map((r, idx) => (
                      <tr key={idx} className={r.isValid ? 'hover:bg-slate-50/80' : 'bg-rose-50/50'}>
                        <td className="p-2 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                        <td className="p-2 font-bold text-slate-900">{r.customerName}</td>
                        <td className="p-2 font-mono font-semibold text-slate-700">
                          {r.customerPhone || <span className="text-rose-500 font-bold">Manquant</span>}
                        </td>
                        <td className="p-2 text-slate-600">{r.customerCity}</td>
                        <td className="p-2 text-slate-600 truncate max-w-[130px]">{r.productName}</td>
                        <td className="p-2 font-extrabold text-slate-900">
                          {r.totalAmount} {currentStore?.currency || 'MAD'}
                        </td>
                        <td className="p-2 text-slate-500 text-[11px] truncate max-w-[100px]">{r.source}</td>
                        <td className="p-2">
                          {r.isValid ? (
                            <span className="text-emerald-600 font-bold text-[10px]">✓ Prêt</span>
                          ) : (
                            <span className="text-rose-600 font-bold text-[10px]" title={r.validationError}>
                              ✗ Erreur
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 50 && (
                <p className="text-[11px] text-slate-400 text-center">
                  + {parsedRows.length - 50} autres lignes non affichées dans l aperçu (seront toutes importées).
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleExecuteImport}
            disabled={isSubmitting || validCount === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Importation en cours...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>
                  Importer {validCount > 0 ? `${validCount} commandes` : 'les commandes'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
