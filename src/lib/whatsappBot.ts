import { runtimeDataPath } from './runtimeData';
import fs from 'fs';
import path from 'path';

export interface WhatsAppTemplate {
  messageText: string;
  btnConfirm: string;
  btnCancel: string;
  btnModify: string;
  confirmedReply: string;
  cancelledReply: string;
  upsellOffer: string;
  upsellBtnYes: string;
  upsellBtnNo: string;
  rescueText: string;
}

export interface WhatsAppBotConfig {
  enabled: boolean;
  provider: 'META_CLOUD_API' | 'GREEN_API' | 'WASAPI' | 'ULTRAMSG' | 'SIMULATOR_TEST';
  apiToken: string;
  phoneNumberId: string;
  instanceId?: string;
  webhookSecret: string;
  senderPhone: string;
  delaySeconds: number; // Delay before sending (e.g. 5-30s)
  upsellEnabled: boolean;
  upsellDiscountPercent: number;
  deliveryRescueEnabled: boolean;
  templates: {
    MA: WhatsAppTemplate;
    SN: WhatsAppTemplate;
  };
}

export interface WhatsAppMessageLog {
  id: string;
  orderId: string;
  orderNumber: string;
  storeId?: string;
  customerName: string;
  customerPhone: string;
  country: string;
  messageText: string;
  status: 'SENT' | 'DELIVERED' | 'CONFIRMED' | 'CANCELLED' | 'MODIFICATION_REQUESTED' | 'FAILED';
  sentAt: string;
  respondedAt?: string | null;
  responseAction?: string | null;
  upsellOffered?: boolean;
  upsellAccepted?: boolean;
}

const CONFIG_FILE_PATH = runtimeDataPath('whatsapp-bot-config.json');
const LOGS_FILE_PATH = runtimeDataPath('whatsapp-bot-logs.json');

const DEFAULT_CONFIG: WhatsAppBotConfig = {
  enabled: true,
  provider: 'SIMULATOR_TEST',
  apiToken: '',
  phoneNumberId: '',
  instanceId: '',
  webhookSecret: 'cod_wa_secret_2026',
  senderPhone: '+212600000000',
  delaySeconds: 10,
  upsellEnabled: true,
  upsellDiscountPercent: 50,
  deliveryRescueEnabled: true,
  templates: {
    MA: {
      messageText: `السلام عليكم أ سيدي/لالة {customerName} 👋
شكراً على طلبيتك فـ متجرنا!
📦 المنتج: {productName}
💰 المبلغ الإجمالي: {totalAmount} {currency} (الدفع عند الاستلام والتوصيل مجاني).
📍 العنوان: {customerAddress} - {customerCity}.

باش نخرجو الكولية ديالك مع الموزع اليوم، عافاك أكد لينا بالضغط على الزر أسفله:`,
      btnConfirm: '✅ نعم، أؤكد الطلبية',
      btnCancel: '❌ إلغاء الطلبية',
      btnModify: '✏️ تعديل العنوان / المقاس',
      confirmedReply: `شكراً ليك أ سيدي {customerName}! 🎉
طلبيتك رقم #{orderNumber} تأكدات بنجاح وخرجات لقسم التغليف والشحن. غادي يتصل بيك الموزع قريباً فـ {customerCity}.`,
      cancelledReply: `تم إلغاء طلبيتك #{orderNumber} بنجاح. شكراً على وقتك، وكنتمناو نشوفوك قريب! 🙏`,
      upsellOffer: `🎁 عرض خاص وحصري ليك أ سيدي {customerName}!
بمناسبة تأكيد الطلبية ديالك، واش نزيدو ليك الحبة الثانية بتخفيض 50% ونجمعوهم فـ نفس الكولية بالمجان؟`,
      upsellBtnYes: '✅ نعم، زيدني الحبة الثانية بتخفيض',
      upsellBtnNo: '❌ لا، بغيت غير حبة وحدة فقط',
      rescueText: `السلام عليكم أ سيدي {customerName}، الموزع ديالنا حاول يتصل بيك بخصوص كوليتك #{orderNumber} وما جاوبتيهش. واش نبروغراميو ليك التوصيل غدا فـ نفس الوقت؟`,
    },
    SN: {
      messageText: `Bonjour M/Mme {customerName} 👋
Merci pour votre commande sur notre boutique !
📦 Produit: {productName}
💰 Montant total: {totalAmount} {currency} (Paiement à la livraison).
📍 Adresse: {customerAddress} - {customerCity}.

Pour expédier votre colis dès aujourd'hui avec notre livreur, veuillez confirmer en cliquant ci-dessous :`,
      btnConfirm: '✅ Oui, je confirme ma commande',
      btnCancel: '❌ Annuler la commande',
      btnModify: '✏️ Modifier l\'adresse',
      confirmedReply: `Merci beaucoup {customerName} ! 🎉
Votre commande #{orderNumber} est bien confirmée et programmée pour la livraison à {customerCity}. Notre livreur vous contactera très vite.`,
      cancelledReply: `Votre commande #{orderNumber} a été annulée avec succès. Merci et à très bientôt ! 🙏`,
      upsellOffer: `🎁 Offre VIP exclusive pour vous {customerName} !
Profitez d'un 2ème article à -50% de réduction immédiate livré ensemble sans frais supplémentaires !`,
      upsellBtnYes: '✅ Oui, ajouter le 2ème avec remise',
      upsellBtnNo: '❌ Non, garder 1 seul article',
      rescueText: `Bonjour {customerName}, notre livreur a essayé de vous joindre pour votre colis #{orderNumber} sans succès. Souhaitez-vous reprogrammer la livraison demain ?`,
    },
  },
};

export function loadWhatsAppConfig(): WhatsAppBotConfig {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const content = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        templates: {
          MA: { ...DEFAULT_CONFIG.templates.MA, ...(parsed.templates?.MA || {}) },
          SN: { ...DEFAULT_CONFIG.templates.SN, ...(parsed.templates?.SN || {}) },
        },
      };
    }
  } catch (e) {
    console.error('Error loading WhatsApp config:', e);
  }
  return DEFAULT_CONFIG;
}

export function saveWhatsAppConfig(config: WhatsAppBotConfig): void {
  try {
    const dir = path.dirname(CONFIG_FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving WhatsApp config:', e);
  }
}

export function loadWhatsAppLogs(): WhatsAppMessageLog[] {
  try {
    if (fs.existsSync(LOGS_FILE_PATH)) {
      const content = fs.readFileSync(LOGS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading WhatsApp logs:', e);
  }
  return [];
}

export function saveWhatsAppLogs(logs: WhatsAppMessageLog[]): void {
  try {
    const dir = path.dirname(LOGS_FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOGS_FILE_PATH, JSON.stringify(logs.slice(0, 300), null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving WhatsApp logs:', e);
  }
}

export function formatWhatsAppMessage(
  template: string,
  data: {
    customerName: string;
    productName: string;
    totalAmount: number;
    currency: string;
    customerAddress: string;
    customerCity: string;
    orderNumber: string;
  }
): string {
  return template
    .replace(/{customerName}/g, data.customerName || 'Client')
    .replace(/{productName}/g, data.productName || 'Article')
    .replace(/{totalAmount}/g, String(data.totalAmount || 0))
    .replace(/{currency}/g, data.currency || 'MAD')
    .replace(/{customerAddress}/g, data.customerAddress || '')
    .replace(/{customerCity}/g, data.customerCity || '')
    .replace(/{orderNumber}/g, data.orderNumber || '');
}

export async function sendActualWhatsAppMessage(
  recipientPhone: string,
  messageText: string,
  cfg?: WhatsAppBotConfig
): Promise<{ success: boolean; error?: string; providerResponse?: any }> {
  const config = cfg || loadWhatsAppConfig();

  if (!config.enabled) {
    return { success: false, error: 'WhatsApp Bot is disabled in settings' };
  }

  // Format phone number: clean out spaces, dashes, +, etc.
  let cleanPhone = recipientPhone.replace(/[^0-9]/g, '');
  // If Moroccan local 06 / 07, convert to 212...
  if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
    cleanPhone = '212' + cleanPhone.substring(1);
  }
  // If Senegalese local 7X, convert to 221...
  if (
    (cleanPhone.startsWith('77') ||
      cleanPhone.startsWith('78') ||
      cleanPhone.startsWith('76') ||
      cleanPhone.startsWith('70')) &&
    cleanPhone.length === 9
  ) {
    cleanPhone = '221' + cleanPhone;
  }

  // 1. SIMULATOR_TEST
  if (config.provider === 'SIMULATOR_TEST') {
    return {
      success: true,
      providerResponse: { mode: 'SIMULATOR', message: 'Message logged in simulator' },
    };
  }

  // 2. GREEN_API (Scan QR Code via green-api.com)
  if (config.provider === 'GREEN_API') {
    const instanceId = config.instanceId || config.phoneNumberId;
    const apiToken = config.apiToken;
    if (!instanceId || !apiToken) {
      return {
        success: false,
        error:
          'GreenAPI nécessite Instance ID et API Token. Veuillez créer un compte gratuit sur green-api.com et scanner le QR Code.',
      };
    }

    const host = 'https://api.green-api.com';
    const chatId = `${cleanPhone}@c.us`;
    try {
      const res = await fetch(`${host}/waInstance${instanceId}/sendMessage/${apiToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          message: messageText,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.idMessage) {
        return { success: true, providerResponse: data };
      } else {
        return {
          success: false,
          error: data?.message || data?.error || 'Erreur GreenAPI lors de l\'envoi',
          providerResponse: data,
        };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Erreur réseau GreenAPI' };
    }
  }

  // 3. ULTRAMSG
  if (config.provider === 'ULTRAMSG') {
    const instanceId = config.instanceId || config.phoneNumberId;
    const apiToken = config.apiToken;
    if (!instanceId || !apiToken) {
      return { success: false, error: 'UltraMsg nécessite Instance ID et API Token.' };
    }
    try {
      const res = await fetch(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: apiToken,
          to: cleanPhone,
          body: messageText,
        }),
      });
      const data = await res.json();
      if (data?.sent === 'true' || data?.id) {
        return { success: true, providerResponse: data };
      } else {
        return { success: false, error: data?.message || 'Erreur UltraMsg', providerResponse: data };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Erreur réseau UltraMsg' };
    }
  }

  // 4. META_CLOUD_API (Official Facebook WhatsApp Cloud API)
  if (config.provider === 'META_CLOUD_API') {
    const phoneNumberId = config.phoneNumberId;
    const apiToken = config.apiToken;
    if (!phoneNumberId || !apiToken) {
      return {
        success: false,
        error: 'Meta Cloud API nécessite Phone Number ID et Access Token (Bearer).',
      };
    }
    try {
      const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: { preview_url: false, body: messageText },
        }),
      });
      const data = await res.json();
      if (res.ok && data?.messages?.length > 0) {
        return { success: true, providerResponse: data };
      } else {
        return {
          success: false,
          error: data?.error?.message || 'Erreur Meta Cloud API',
          providerResponse: data,
        };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Erreur réseau Meta' };
    }
  }

  return { success: false, error: `Fournisseur inconnu: ${config.provider}` };
}

