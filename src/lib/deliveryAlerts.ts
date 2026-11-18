import { runtimeDataPath } from './runtimeData';
import fs from 'fs';
import path from 'path';

export interface DeliveryAlert {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  customerAddress?: string;
  totalAmount: number;
  currency: string;
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  courierProvider: string | null;
  courierPhone?: string | null;
  trackingNumber: string | null;
  subStatus: string;
  status: string;
  reason: string;
  createdAt: string;
  dismissedBy: string[];
  resolved: boolean;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  resolvedAction?: string | null;
  // Rescue attributes (20-min countdown & 5 DH commission)
  isBotRescue?: boolean;
  rescueCommission?: number;
  rescueAssignedAt?: string | null;
  rescueExpiresAt?: string | null;
  rescueCallLoggedAt?: string | null;
  rotationCount?: number;
}

const ALERTS_FILE_PATH = runtimeDataPath('delivery-alerts.json');

let memoryAlerts: DeliveryAlert[] | null = null;

function loadAlertsFromFile(): DeliveryAlert[] {
  try {
    if (fs.existsSync(ALERTS_FILE_PATH)) {
      const content = fs.readFileSync(ALERTS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        memoryAlerts = parsed;
        return memoryAlerts;
      }
    }
  } catch (e) {
    console.error('Error loading delivery alerts:', e);
  }
  memoryAlerts = [];
  return memoryAlerts;
}

function saveAlertsToFile(alerts: DeliveryAlert[]): void {
  try {
    const dir = path.dirname(ALERTS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // Keep at most 150 recent alerts
    const trimmed = alerts.slice(0, 150);
    fs.writeFileSync(ALERTS_FILE_PATH, JSON.stringify(trimmed, null, 2), 'utf-8');
    memoryAlerts = trimmed;
  } catch (e) {
    console.error('Error saving delivery alerts:', e);
  }
}

export function getDeliveryAlerts(params?: {
  agentId?: string | null;
  allowedAgentIds?: string[] | null;
  role?: string | null;
  unresolvedOnly?: boolean;
}): DeliveryAlert[] {
  if (!memoryAlerts) {
    loadAlertsFromFile();
  }

  let list = memoryAlerts || [];

  if (params?.unresolvedOnly) {
    list = list.filter((a) => !a.resolved);
  }

  if (params?.role === 'CALL_AGENT') {
    const allowed = params.allowedAgentIds || (params.agentId ? [params.agentId] : null);
    if (allowed && allowed.length > 0) {
      list = list.filter(
        (a) => !a.assignedAgentId || allowed.includes(a.assignedAgentId)
      );
    }
  }

  // Sort by latest createdAt descending
  return [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function addDeliveryAlert(data: {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  customerAddress?: string;
  totalAmount?: number;
  currency?: string;
  assignedAgentId?: string | null;
  assignedAgentName?: string | null;
  courierProvider?: string | null;
  courierPhone?: string | null;
  trackingNumber?: string | null;
  subStatus: string;
  status: string;
  reason?: string;
  isBotRescue?: boolean;
  rescueCommission?: number;
  rescueAssignedAt?: string | null;
  rescueExpiresAt?: string | null;
  rotationCount?: number;
}): DeliveryAlert {
  if (!memoryAlerts) {
    loadAlertsFromFile();
  }

  const existing = (memoryAlerts || []).find(
    (a) => a.orderId === data.orderId && !a.resolved
  );

  const reason =
    data.reason ||
    (data.subStatus.includes('NE_REPOND_PAS') || data.subStatus.includes('INJOIGNABLE')
      ? 'Le livreur a signalé que le client ne répond pas au téléphone'
      : data.subStatus.includes('REPORTE')
      ? 'Le livreur a signalé un report de livraison demandé'
      : data.subStatus.includes('REFUS') || data.subStatus.includes('ANNUL')
      ? 'Refus ou annulation signalée par le livreur'
      : 'Incident de livraison signalé par le transporteur');

  if (existing) {
    existing.subStatus = data.subStatus;
    existing.status = data.status;
    existing.reason = reason;
    existing.createdAt = new Date().toISOString();
    existing.dismissedBy = [];
    if (data.courierProvider) existing.courierProvider = data.courierProvider;
    if (data.trackingNumber) existing.trackingNumber = data.trackingNumber;
    if (data.assignedAgentId) existing.assignedAgentId = data.assignedAgentId;
    if (data.assignedAgentName) existing.assignedAgentName = data.assignedAgentName;
    if (data.isBotRescue !== undefined) existing.isBotRescue = data.isBotRescue;
    if (data.rescueCommission !== undefined) existing.rescueCommission = data.rescueCommission;
    if (data.rescueAssignedAt) existing.rescueAssignedAt = data.rescueAssignedAt;
    if (data.rescueExpiresAt) existing.rescueExpiresAt = data.rescueExpiresAt;
    saveAlertsToFile(memoryAlerts || []);
    return existing;
  }

  const now = new Date();
  const rescueExpiresAt = data.rescueExpiresAt || (data.isBotRescue ? new Date(now.getTime() + 20 * 60 * 1000).toISOString() : null);

  const newAlert: DeliveryAlert = {
    id: `alert-${data.orderId}-${Date.now()}`,
    orderId: data.orderId,
    orderNumber: data.orderNumber,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerCity: data.customerCity,
    customerAddress: data.customerAddress || '',
    totalAmount: data.totalAmount || 0,
    currency: data.currency || 'MAD',
    assignedAgentId: data.assignedAgentId || null,
    assignedAgentName: data.assignedAgentName || null,
    courierProvider: data.courierProvider || 'Transporteur',
    courierPhone: data.courierPhone || null,
    trackingNumber: data.trackingNumber || null,
    subStatus: data.subStatus,
    status: data.status,
    reason,
    createdAt: now.toISOString(),
    dismissedBy: [],
    resolved: false,
    isBotRescue: data.isBotRescue ?? false,
    rescueCommission: data.rescueCommission ?? (data.isBotRescue ? 5.0 : undefined),
    rescueAssignedAt: data.rescueAssignedAt || (data.isBotRescue ? now.toISOString() : null),
    rescueExpiresAt,
    rotationCount: data.rotationCount ?? 0,
  };

  const updated = [newAlert, ...(memoryAlerts || [])];
  saveAlertsToFile(updated);
  return newAlert;
}

export function markAlertCallLogged(orderId: string): void {
  if (!memoryAlerts) {
    loadAlertsFromFile();
  }
  const alert = (memoryAlerts || []).find((a) => a.orderId === orderId && !a.resolved);
  if (alert) {
    alert.rescueCallLoggedAt = new Date().toISOString();
    saveAlertsToFile(memoryAlerts || []);
  }
}

export function reassignRescueAlert(
  orderId: string,
  newAgentId: string,
  newAgentName: string
): DeliveryAlert | null {
  if (!memoryAlerts) {
    loadAlertsFromFile();
  }
  const alert = (memoryAlerts || []).find((a) => a.orderId === orderId && !a.resolved);
  if (alert) {
    const now = new Date();
    alert.assignedAgentId = newAgentId;
    alert.assignedAgentName = newAgentName;
    alert.rescueAssignedAt = now.toISOString();
    alert.rescueExpiresAt = new Date(now.getTime() + 20 * 60 * 1000).toISOString();
    alert.rescueCallLoggedAt = null;
    alert.rotationCount = (alert.rotationCount || 0) + 1;
    alert.dismissedBy = [];
    saveAlertsToFile(memoryAlerts || []);
    return alert;
  }
  return null;
}

export function resolveDeliveryAlert(
  orderId: string,
  userId?: string | null,
  action?: string | null
): boolean {
  if (!memoryAlerts) {
    loadAlertsFromFile();
  }

  let found = false;
  (memoryAlerts || []).forEach((a) => {
    if (a.orderId === orderId && !a.resolved) {
      a.resolved = true;
      a.resolvedAt = new Date().toISOString();
      a.resolvedBy = userId || 'Utilisateur';
      a.resolvedAction = action || 'SAUVE_PAR_AGENT';
      found = true;
    }
  });

  if (found) {
    saveAlertsToFile(memoryAlerts || []);
  }
  return found;
}

export function dismissDeliveryAlert(alertId: string, userId: string): boolean {
  if (!memoryAlerts) {
    loadAlertsFromFile();
  }

  const alert = (memoryAlerts || []).find((a) => a.id === alertId);
  if (alert) {
    if (!alert.dismissedBy.includes(userId)) {
      alert.dismissedBy.push(userId);
      saveAlertsToFile(memoryAlerts || []);
      return true;
    }
  }
  return false;
}
