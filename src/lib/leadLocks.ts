// In-memory real-time lead locking mechanism
// Ensures zero-collision when multiple call center agents work simultaneously
import { EventEmitter } from 'events';

interface LeadLock {
  orderId: string;
  agentId: string;
  agentName: string;
  lockedAt: number; // timestamp in ms
}

// Global in-memory locks map (persists across API requests in Node runtime)
const LOCK_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes auto-release timeout
const activeLocks = new Map<string, LeadLock>();

// Global Event Emitter for Real-Time Lock Broadcasts
class LockEventEmitter extends EventEmitter {}
export const lockEvents: LockEventEmitter = (global as any)._lockEvents || new LockEventEmitter();
(global as any)._lockEvents = lockEvents;
lockEvents.setMaxListeners(200);

function broadcastLocks() {
  try {
    lockEvents.emit('locks_changed', getAllLocks());
  } catch (e) {
    console.error('Error broadcasting locks:', e);
  }
}

export function lockLead(orderId: string, agentId: string, agentName: string): {
  success: boolean;
  lockedBy?: { agentId: string; agentName: string; lockedAt: number };
} {
  cleanExpiredLocks();

  const existing = activeLocks.get(orderId);
  if (existing) {
    // If locked by someone else and still valid
    if (existing.agentId !== agentId) {
      return {
        success: false,
        lockedBy: {
          agentId: existing.agentId,
          agentName: existing.agentName,
          lockedAt: existing.lockedAt,
        },
      };
    }
    // If locked by the SAME agent, renew lock
    existing.lockedAt = Date.now();
    return { success: true };
  }

  // Create new lock
  activeLocks.set(orderId, {
    orderId,
    agentId,
    agentName,
    lockedAt: Date.now(),
  });

  // Broadcast lock instantly to all connected clients
  broadcastLocks();

  return { success: true };
}

export function unlockLead(orderId: string, agentId?: string): boolean {
  if (!orderId) return false;
  const existing = activeLocks.get(orderId);
  if (existing) {
    // If agentId provided, only unlock if owned by this agent (or admin override)
    if (agentId && existing.agentId !== agentId) {
      return false;
    }
    activeLocks.delete(orderId);

    // Broadcast unlock instantly to all connected clients
    broadcastLocks();
    return true;
  }
  return false;
}

export function getLeadLock(orderId: string): LeadLock | null {
  cleanExpiredLocks();
  return activeLocks.get(orderId) || null;
}

export function getAllLocks(): Record<string, { agentId: string; agentName: string; lockedAt: number }> {
  cleanExpiredLocks();
  const result: Record<string, { agentId: string; agentName: string; lockedAt: number }> = {};
  activeLocks.forEach((lock, orderId) => {
    result[orderId] = {
      agentId: lock.agentId,
      agentName: lock.agentName,
      lockedAt: lock.lockedAt,
    };
  });
  return result;
}

function cleanExpiredLocks() {
  const now = Date.now();
  let changed = false;
  activeLocks.forEach((lock, orderId) => {
    if (now - lock.lockedAt > LOCK_TIMEOUT_MS) {
      activeLocks.delete(orderId);
      changed = true;
    }
  });
  if (changed) {
    broadcastLocks();
  }
}
