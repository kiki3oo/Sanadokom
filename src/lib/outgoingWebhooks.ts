import { runtimeDataPath } from './runtimeData';
import fs from 'fs';

export interface OutgoingWebhookConfig {
  enabled: boolean;
  url: string; // Target n8n / automation webhook URL
  secret: string; // Optional secret token (sent in x-webhook-secret header)
  events: {
    orderCreated: boolean;
    orderConfirmed: boolean;
    orderDelivered: boolean;
    orderCancelled: boolean;
  };
  storeUrls: Record<string, string>; // Optional per-store URL overrides
}

export interface WebhookDeliveryLog {
  id: string;
  event: string;
  orderNumber: string;
  customerName: string;
  targetUrl: string;
  statusCode: number | null;
  status: 'SUCCESS' | 'FAILED';
  responseTimeMs: number;
  errorMessage?: string;
  payloadSample: any;
  timestamp: string;
}

const CONFIG_FILE = runtimeDataPath('outgoing-webhooks.json');
const LOGS_FILE = runtimeDataPath('outgoing-webhooks-logs.json');

const DEFAULT_CONFIG: OutgoingWebhookConfig = {
  enabled: false,
  url: '',
  secret: '',
  events: {
    orderCreated: true,
    orderConfirmed: true,
    orderDelivered: false,
    orderCancelled: false,
  },
  storeUrls: {},
};

export function loadWebhookConfig(): OutgoingWebhookConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        events: { ...DEFAULT_CONFIG.events, ...(parsed.events || {}) },
        storeUrls: parsed.storeUrls || {},
      };
    }
  } catch (err) {
    console.error('Error reading outgoing webhooks config:', err);
  }
  return DEFAULT_CONFIG;
}

export function saveWebhookConfig(cfg: Partial<OutgoingWebhookConfig>): OutgoingWebhookConfig {
  try {
    const current = loadWebhookConfig();
    const updated: OutgoingWebhookConfig = {
      ...current,
      ...cfg,
      events: { ...current.events, ...(cfg.events || {}) },
      storeUrls: cfg.storeUrls !== undefined ? cfg.storeUrls : current.storeUrls,
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  } catch (err) {
    console.error('Error saving outgoing webhooks config:', err);
    throw err;
  }
}

export function loadWebhookLogs(): WebhookDeliveryLog[] {
  try {
    if (fs.existsSync(LOGS_FILE)) {
      const data = fs.readFileSync(LOGS_FILE, 'utf-8');
      const list = JSON.parse(data);
      if (Array.isArray(list)) return list.slice(0, 50); // Keep last 50
    }
  } catch (err) {
    console.error('Error reading outgoing webhook logs:', err);
  }
  return [];
}

export function saveWebhookLogs(logs: WebhookDeliveryLog[]) {
  try {
    const trimmed = logs.slice(0, 50);
    fs.writeFileSync(LOGS_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving outgoing webhook logs:', err);
  }
}

export function formatOrderPayload(event: string, order: any, store?: any) {
  const storeObj = store || order.store || {};
  const isSenegal = storeObj.currency === 'XOF' || (storeObj.name || '').toLowerCase().includes('sénégal') || (storeObj.name || '').toLowerCase().includes('senegal');

  const items = (order.items || []).map((it: any) => ({
    productId: it.productId || it.product?.id || null,
    name: it.product?.name || it.productName || it.name || 'Produit',
    sku: it.product?.sku || it.sku || null,
    variant: it.variant || it.product?.variant || null,
    quantity: Number(it.quantity) || 1,
    unitPrice: Number(it.unitPrice) || 0,
    totalItemPrice: (Number(it.unitPrice) || 0) * (Number(it.quantity) || 1),
  }));

  return {
    event,
    timestamp: new Date().toISOString(),
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subStatus: order.subStatus || null,
      source: order.source || 'Website / Webhook',
      totalAmount: Number(order.totalAmount) || 0,
      costAmount: Number(order.costAmount) || 0,
      shippingCost: Number(order.shippingCost) || 0,
      currency: storeObj.currency || (isSenegal ? 'XOF' : 'MAD'),
      upsell: order.upsell || null,
      notes: order.customerNote || null,
      agentNotes: order.agentNotes || null,
      createdAt: order.createdAt || new Date().toISOString(),
      customer: {
        name: order.customerName,
        phone: order.customerPhone,
        city: order.customerCity || '',
        address: order.customerAddress || '',
        note: order.customerNote || null,
      },
      items,
      traffic: {
        source: order.source,
        utmSource: order.utmSource || null,
        utmCampaign: order.utmCampaign || null,
        adSet: order.adSet || null,
      },
      store: {
        id: storeObj.id || order.storeId,
        name: storeObj.name || 'Boutique',
        currency: storeObj.currency || (isSenegal ? 'XOF' : 'MAD'),
        country: isSenegal ? 'Sénégal' : 'Maroc',
      },
      assignedAgent: order.assignedAgent
        ? {
            id: order.assignedAgent.id,
            name: order.assignedAgent.name,
            email: order.assignedAgent.email,
          }
        : null,
    },
  };
}

/**
 * Dispatch an outgoing webhook asynchronously (never blocks caller)
 */
export async function dispatchOutgoingWebhook(
  event: 'order.created' | 'order.confirmed' | 'order.delivered' | 'order.cancelled',
  order: any,
  store?: any
) {
  try {
    const config = loadWebhookConfig();
    if (!config.enabled) return;

    // Check event enabled
    if (event === 'order.created' && !config.events.orderCreated) return;
    if (event === 'order.confirmed' && !config.events.orderConfirmed) return;
    if (event === 'order.delivered' && !config.events.orderDelivered) return;
    if (event === 'order.cancelled' && !config.events.orderCancelled) return;

    // Determine target URL (Store override or default)
    const storeId = store?.id || order.storeId;
    const targetUrl = (storeId && config.storeUrls?.[storeId]) ? config.storeUrls[storeId] : config.url;

    if (!targetUrl || !targetUrl.startsWith('http')) {
      return;
    }

    const payload = formatOrderPayload(event, order, store);
    const startTime = Date.now();

    // Fire HTTP POST with 8s timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Sanadokom-Webhook-Dispatcher/1.0',
        'x-webhook-event': event,
        'x-sanadokom-delivery': `dlv_${Date.now()}`,
        ...(config.secret ? { 'x-webhook-secret': config.secret, Authorization: `Bearer ${config.secret}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
      .then(async (res) => {
        clearTimeout(timeout);
        const elapsed = Date.now() - startTime;
        const success = res.ok;

        const logEntry: WebhookDeliveryLog = {
          id: `whlog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          event,
          orderNumber: order.orderNumber || 'N/A',
          customerName: order.customerName || 'Client',
          targetUrl,
          statusCode: res.status,
          status: success ? 'SUCCESS' : 'FAILED',
          responseTimeMs: elapsed,
          errorMessage: success ? undefined : `HTTP ${res.status}: ${res.statusText}`,
          payloadSample: payload,
          timestamp: new Date().toISOString(),
        };

        const logs = loadWebhookLogs();
        saveWebhookLogs([logEntry, ...logs]);
      })
      .catch((err: any) => {
        clearTimeout(timeout);
        const elapsed = Date.now() - startTime;

        const logEntry: WebhookDeliveryLog = {
          id: `whlog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          event,
          orderNumber: order.orderNumber || 'N/A',
          customerName: order.customerName || 'Client',
          targetUrl,
          statusCode: null,
          status: 'FAILED',
          responseTimeMs: elapsed,
          errorMessage: err.name === 'AbortError' ? 'Timeout dépassé (8s)' : (err.message || 'Erreur réseau'),
          payloadSample: payload,
          timestamp: new Date().toISOString(),
        };

        const logs = loadWebhookLogs();
        saveWebhookLogs([logEntry, ...logs]);
      });
  } catch (e) {
    console.error('Error dispatching outgoing webhook:', e);
  }
}

/**
 * Test an outgoing webhook immediately from the UI
 */
export async function testOutgoingWebhook(
  targetUrl: string,
  secret?: string,
  store?: any
): Promise<{
  success: boolean;
  statusCode: number | null;
  responseTimeMs: number;
  responseBody?: string;
  error?: string;
  payloadSent: any;
}> {
  const sampleOrder = {
    id: `test_${Date.now()}`,
    orderNumber: `ORD-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'PENDING',
    source: 'Website / Test n8n',
    totalAmount: 299.0,
    costAmount: 70.0,
    shippingCost: 35.0,
    customerName: 'Younes Ouakrim (Test n8n)',
    customerPhone: '+212661000000',
    customerCity: 'Casablanca',
    customerAddress: '25 Boulevard d Anfa, Étage 4',
    customerNote: 'Livraison express demandée via n8n test node',
    utmSource: 'facebook_ads',
    utmCampaign: 'test_n8n_integration',
    adSet: 'broad_audience',
    items: [
      {
        productId: 'prod-sample-1',
        name: 'Pack Éclat & Anti-Chute Cheveux',
        sku: 'ROV-SAMPLE-01',
        variant: 'Pack Duo 2x',
        quantity: 1,
        unitPrice: 299.0,
      },
    ],
    store: store || {
      id: 'store-sample',
      name: 'Rovanx Boutique Test',
      currency: 'MAD',
    },
  };

  const payload = formatOrderPayload('order.created', sampleOrder, sampleOrder.store);
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Sanadokom-n8n-Tester/1.0',
        'x-webhook-event': 'order.created',
        'x-sanadokom-test': 'true',
        ...(secret ? { 'x-webhook-secret': secret, Authorization: `Bearer ${secret}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const elapsed = Date.now() - startTime;
    const text = await res.text();

    return {
      success: res.ok,
      statusCode: res.status,
      responseTimeMs: elapsed,
      responseBody: text.slice(0, 500),
      error: res.ok ? undefined : `Erreur HTTP ${res.status}: ${res.statusText}`,
      payloadSent: payload,
    };
  } catch (err: any) {
    const elapsed = Date.now() - startTime;
    return {
      success: false,
      statusCode: null,
      responseTimeMs: elapsed,
      error: err.name === 'AbortError' ? 'Timeout dépassé (8s) - Le serveur n8n n a pas répondu à temps' : (err.message || 'Impossible de joindre l URL'),
      payloadSent: payload,
    };
  }
}
