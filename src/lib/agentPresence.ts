import { getAllLocks } from './leadLocks';

export interface AgentPresenceRecord {
  agentId: string;
  agentName: string;
  role: string;
  status: 'ONLINE' | 'BUSY' | 'PAUSED' | 'IDLE' | 'OFFLINE';
  statusIntent?: 'AVAILABLE' | 'PAUSED';
  currentActivity?: string;
  currentOrderId?: string;
  currentOrderNumber?: string;
  currentPage?: string;
  lastHeartbeat: number; // ms
  lastActionAt: number; // ms
}

// Global in-memory presence map (persists across Next.js API chunks)
const globalForPresence = globalThis as unknown as {
  __sanadokom_presenceMap?: Map<string, AgentPresenceRecord>;
};

export const presenceMap: Map<string, AgentPresenceRecord> =
  globalForPresence.__sanadokom_presenceMap || new Map<string, AgentPresenceRecord>();

if (!globalForPresence.__sanadokom_presenceMap) {
  globalForPresence.__sanadokom_presenceMap = presenceMap;
}

// Presence timeouts (in milliseconds)
const ONLINE_TIMEOUT_MS = 90 * 1000;   // 90 seconds = actively online
const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes = idle / inactive
const PURGE_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours purge

export function recordHeartbeat(data: {
  agentId: string;
  agentName: string;
  role?: string;
  currentPage?: string;
  statusIntent?: 'AVAILABLE' | 'PAUSED';
  currentActivity?: string;
  currentOrderId?: string;
  currentOrderNumber?: string;
}): AgentPresenceRecord {
  const now = Date.now();
  const existing = presenceMap.get(data.agentId);

  const statusIntent = data.statusIntent || existing?.statusIntent || 'AVAILABLE';

  const record: AgentPresenceRecord = {
    agentId: data.agentId,
    agentName: data.agentName || existing?.agentName || 'Agent',
    role: data.role || existing?.role || 'CALL_AGENT',
    status: statusIntent === 'PAUSED' ? 'PAUSED' : 'ONLINE',
    statusIntent,
    currentPage: data.currentPage || existing?.currentPage || '',
    currentActivity: data.currentActivity || existing?.currentActivity || 'Navigue sur la plateforme',
    currentOrderId: data.currentOrderId || existing?.currentOrderId,
    currentOrderNumber: data.currentOrderNumber || existing?.currentOrderNumber,
    lastHeartbeat: now,
    lastActionAt: now,
  };

  presenceMap.set(data.agentId, record);
  return record;
}

export function updateAgentStatusIntent(agentId: string, statusIntent: 'AVAILABLE' | 'PAUSED') {
  const existing = presenceMap.get(agentId);
  if (existing) {
    existing.statusIntent = statusIntent;
    existing.lastHeartbeat = Date.now();
    if (statusIntent === 'PAUSED') {
      existing.status = 'PAUSED';
      existing.currentActivity = 'En pause';
    } else {
      existing.status = 'ONLINE';
      existing.currentActivity = 'Disponible pour appels';
    }
    presenceMap.set(agentId, existing);
  }
}

export function getAllAgentPresences(): AgentPresenceRecord[] {
  const now = Date.now();
  const locks = getAllLocks(); // orderId -> { agentId, agentName, lockedAt }

  // Build a reverse map of agentId -> locked orderId
  const agentLockMap = new Map<string, { orderId: string; lockedAt: number }>();
  Object.entries(locks).forEach(([orderId, lock]) => {
    agentLockMap.set(lock.agentId, { orderId, lockedAt: lock.lockedAt });
  });

  const list: AgentPresenceRecord[] = [];

  presenceMap.forEach((record, agentId) => {
    // Purge records older than 24h
    if (now - record.lastHeartbeat > PURGE_TIMEOUT_MS) {
      presenceMap.delete(agentId);
      return;
    }

    const elapsed = now - record.lastHeartbeat;
    const lockInfo = agentLockMap.get(agentId);

    let calculatedStatus: AgentPresenceRecord['status'] = 'OFFLINE';
    let activity = record.currentActivity || 'Hors ligne';

    if (record.statusIntent === 'PAUSED') {
      calculatedStatus = elapsed > IDLE_TIMEOUT_MS ? 'OFFLINE' : 'PAUSED';
      activity = 'En pause';
    } else if (lockInfo) {
      // Agent is currently locked on an order in call center
      calculatedStatus = 'BUSY';
      activity = `En cours d'appel (${record.currentOrderNumber ? '#' + record.currentOrderNumber : 'Lead'})`;
    } else if (elapsed <= ONLINE_TIMEOUT_MS) {
      calculatedStatus = 'ONLINE';
    } else if (elapsed <= IDLE_TIMEOUT_MS) {
      calculatedStatus = 'IDLE';
      activity = 'Inactif depuis quelques minutes';
    } else {
      calculatedStatus = 'OFFLINE';
      activity = 'Hors ligne';
    }

    list.push({
      ...record,
      status: calculatedStatus,
      currentActivity: activity,
      currentOrderId: lockInfo ? lockInfo.orderId : record.currentOrderId,
    });
  });

  return list;
}
