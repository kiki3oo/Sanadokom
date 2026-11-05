'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  X,
  Plus,
  PhoneCall,
  MessageCircle,
  Users,
  ShoppingBag,
  MapPin,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  Target,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
  defaultStatus?: 'CONFIRMED' | 'PENDING';
}

const MOROCCAN_CITIES = [
  'Casablanca',
  'Rabat',
  'Marrakech',
  'Tanger',
  'Fès',
  'Agadir',
  'Meknès',
  'Oujda',
  'Kenitra',
  'Tétouan',
  'Salé',
  'Temara',
  'Mohammedia',
  'El Jadida',
  'Nador',
  'Béni Mellal',
  'Khouribga',
  'Settat',
  'Safi',
  'Autre Ville',
];

export default function ManualOrderModal({
  isOpen,
  onClose,
  onOrderCreated,
  defaultStatus = 'CONFIRMED',
}: ManualOrderModalProps) {
  const { stores, selectedStoreId } = useStore();
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const [storeId, setStoreId] = useState('');
  const [source, setSource] = useState('WhatsApp Direct');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [adSet, setAdSet] = useState('');
  const [showUtmDetails, setShowUtmDetails] = useState(false);
  const [status, setStatus] = useState<'CONFIRMED' | 'PENDING'>(defaultStatus);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCity, setCustomerCity] = useState('Casablanca');
  const [customCity, setCustomCity] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [agentNotes, setAgentNotes] = useState('');
  const [upsell, setUpsell] = useState('');

  // Products from store
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState<number | string>('');

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (stores.length > 0 && !storeId) {
      setStoreId(selectedStoreId !== 'ALL' ? selectedStoreId : stores[0].id);
    }
  }, [stores, selectedStoreId]);

  useEffect(() => {
    if (storeId) {
      fetchProducts();
    }
  }, [storeId]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`/api/stock?storeId=${storeId}`);
      const data = await res.json();
      if (data.success && data.products) {
        setAvailableProducts(data.products);
        if (data.products.length > 0 && !selectedProductId) {
          setSelectedProductId(data.products[0].id);
          setUnitPrice(data.products[0].sellingPrice);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleProductChange = (pId: string) => {
    setSelectedProductId(pId);
    const prod = availableProducts.find((p) => p.id === pId);
    if (prod) {
      setUnitPrice(prod.sellingPrice);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg('Veuillez renseigner le nom et le numéro de téléphone du client.');
      return;
    }

    if (!selectedProductId) {
      setErrorMsg('Veuillez sélectionner au moins un produit.');
      return;
    }

    setSubmitting(true);
    try {
      const cityToSave = customerCity === 'Autre Ville' ? customCity.trim() || 'Maroc' : customerCity;

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          source,
          utmSource: source,
          utmCampaign: utmCampaign.trim() || undefined,
          adSet: adSet.trim() || undefined,
          status,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerCity: cityToSave,
          customerAddress: customerAddress.trim(),
          customerNote: customerNote.trim() || undefined,
          agentNotes: agentNotes.trim() || undefined,
          upsell: upsell.trim() || undefined,
          items: [
            {
              productId: selectedProductId,
              quantity: Number(quantity),
              unitPrice: Number(unitPrice),
            },
          ],
          userId: currentUser?.id,
          userName: currentUser?.name || 'Admin',
          userRole: currentUser?.role || 'ADMIN',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error || 'Erreur lors de la création de la commande.');
      } else {
        onOrderCreated();
        onClose();
        // Reset
        setCustomerName('');
        setCustomerPhone('');
        setCustomerAddress('');
        setCustomerNote('');
        setAgentNotes('');
        setUpsell('');
        setUtmCampaign('');
        setAdSet('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur de connexion');
    } finally {
      setSubmitting(false);
    }
  };

  const activeStore = stores.find((s) => s.id === storeId) || stores[0];
  const activeCurrency = activeStore?.currency || 'MAD';

  if (!isOpen) return null;

  const totalCalculated = (Number(unitPrice) || 0) * (Number(quantity) || 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                {t('manual.modalTitle')}
              </h3>
              <p className="text-[11px] text-slate-500">
                {t('manual.modalSubtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Row 1: Source / Canal & Store */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('manual.source')} *</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full font-semibold border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="WhatsApp Direct">💬 WhatsApp Direct</option>
                <option value="Instagram Ads">📸 Instagram Ads</option>
                <option value="Instagram DM">📸 Instagram DM / Bio</option>
                <option value="Facebook Ads">🔵 Facebook Ads</option>
                <option value="Facebook Messenger">🔵 Facebook Messenger</option>
                <option value="TikTok Ads">🎵 TikTok Ads</option>
                <option value="TikTok DM">🎵 TikTok DM / Bio</option>
                <option value="Snapchat Ads">👻 Snapchat Ads</option>
                <option value="Google Ads">🔍 Google Ads</option>
                <option value="Appel Téléphonique Entrant">📞 Appel Téléphonique Entrant</option>
                <option value="Recommandation d'un ami (Bouche-à-oreille)">🤝 Recommandation d'un ami</option>
                <option value="Vente Directe / Magasin">🏪 Vente Directe / Magasin</option>
                <option value="Landing Page / Site Web">🌐 Landing Page / Site Web</option>
                <option value="Autre Source">Autre Source</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('manual.store')} *</label>
              <select
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className="w-full font-semibold border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.currency})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Marketing Attribution (UTM Campaign & AdSet) */}
          <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
            <button
              type="button"
              onClick={() => setShowUtmDetails(!showUtmDetails)}
              className="w-full flex items-center justify-between text-xs font-bold text-indigo-900 hover:text-indigo-700 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                <span>Attribution Marketing (UTM Campagne & AdSet) - Optionnel</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600">
                <span>{showUtmDetails ? 'Masquer' : 'Afficher'}</span>
                {showUtmDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            {showUtmDetails && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2.5 pt-2.5 border-t border-indigo-100/80">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    🎯 Nom de la Campagne (utm_campaign)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: PROMO_RAMADAN_2026, ETE_SN_01..."
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    className="w-full font-medium border border-slate-200 rounded-lg p-2 bg-white text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    🏷️ AdSet / Audience (adset_name)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Femmes_Dakar_25_45, Interets_Cosmetique..."
                    value={adSet}
                    onChange={(e) => setAdSet(e.target.value)}
                    className="w-full font-medium border border-slate-200 rounded-lg p-2 bg-white text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Row 2: Status Routing Toggle */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label className="block font-bold text-slate-800 mb-2">{t('manual.destination')} :</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('CONFIRMED')}
                className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all ${
                  status === 'CONFIRMED'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs ring-2 ring-emerald-500'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${status === 'CONFIRMED' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div>
                  <span className="font-extrabold block text-xs">{t('manual.destConfirmed')}</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStatus('PENDING')}
                className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all ${
                  status === 'PENDING'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs ring-2 ring-indigo-500'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Clock className={`w-4 h-4 shrink-0 mt-0.5 ${status === 'PENDING' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <div>
                  <span className="font-extrabold block text-xs">{t('manual.destPending')}</span>
                </div>
              </button>
            </div>
          </div>

          {/* Row 3: Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('manual.clientName')} *</label>
              <input
                type="text"
                placeholder="Youssef Alami"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full font-semibold border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('manual.phone')} *</label>
              <input
                type="tel"
                placeholder="0661234567"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full font-bold font-mono border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Row 4: City & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('manual.city')} *</label>
              <select
                value={customerCity}
                onChange={(e) => setCustomerCity(e.target.value)}
                className="w-full font-semibold border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {MOROCCAN_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {customerCity === 'Autre Ville' && (
                <input
                  type="text"
                  placeholder="Tapez le nom de la ville..."
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  className="w-full font-semibold border border-slate-200 rounded-xl p-2 mt-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('manual.address')}</label>
              <input
                type="text"
                placeholder="Ex: Quartier Maarif, Rue Jura..."
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full font-semibold border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Row 5: Product Selection & Pricing */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <label className="block font-bold text-slate-800">{t('manual.product')} :</label>

            {loadingProducts ? (
              <div className="text-slate-400 py-2">{t('table.loading')}</div>
            ) : availableProducts.length === 0 ? (
              <div className="text-rose-600 font-semibold py-2">
                Aucun produit trouvé dans cette boutique.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">{t('manual.product')}</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="w-full font-semibold border border-slate-200 rounded-lg p-2 bg-white text-xs"
                    required
                  >
                    {availableProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sellingPrice} {activeCurrency} - Stock: {p.stockQuantity})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">{t('manual.quantity')}</label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full font-bold border border-slate-200 rounded-lg p-2 text-center bg-white text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">{t('manual.sellingPrice')}</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      className="w-full font-bold border border-slate-200 rounded-lg p-2 text-right bg-white text-xs"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
              <span className="font-semibold text-slate-600">{t('table.amount')} (COD) :</span>
              <span className="font-black text-slate-900 text-base">{totalCalculated.toFixed(2)} {activeCurrency}</span>
            </div>
          </div>

          {/* Row 6: UpSell & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('manual.upsellPrime')}</label>
              <input
                type="text"
                placeholder="Ex: +50 DH, Pack Accessoire..."
                value={upsell}
                onChange={(e) => setUpsell(e.target.value)}
                className="w-full font-semibold border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">{t('manual.deliveryNotes')}</label>
              <input
                type="text"
                placeholder="Ex: Livrer après 17h..."
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                className="w-full font-semibold border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              {t('btn.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {submitting ? '...' : t('manual.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
