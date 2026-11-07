'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useStore } from './StoreContext';

export interface AgentPresenceInfo {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  status: 'ONLINE' | 'BUSY' | 'PAUSED' | 'IDLE' | 'OFFLINE';
  statusIntent: 'AVAILABLE' | 'PAUSED';
  currentActivity: string;
  currentPage?: string;
  currentOrderId?: string | null;
  currentOrderNumber?: string | null;
  lastHeartbeat?: number | null;
  lastActionAt?: number | null;
  todayCalls: number;
  todayConfirmed: number;
}

export interface PresenceSummary {
  totalAgents: number;
  online: number;
  busy: number;
  paused: number;
  idle: number;
  offline: number;
}

interface PresenceContextType {
  agents: AgentPresenceInfo[];
  summary: PresenceSummary;
  loading: boolean;
  myStatusIntent: 'AVAILABLE' | 'PAUSED';
  setMyStatusIntent: (intent: 'AVAILABLE' | 'PAUSED') => Promise<void>;
  reportActivity: (activity: string, orderId?: string, orderNumber?: string) => Promise<void>;
  refreshPresence: () => Promise<void>;
}

const defaultSummary: PresenceSummary = {
  totalAgents: 0,
  online: 0,
  busy: 0,
  paused: 0,
  idle: 0,
  offline: 0,
};

const PresenceContext = createContext<PresenceContextType>({
  agents: [],
  summary: defaultSummary,
  loading: true,
  myStatusIntent: 'AVAILABLE',
  setMyStatusIntent: async () => {},
  reportActivity: async () => {},
  refreshPresence: async () => {},
});

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const { selectedStoreId } = useStore();
  const [agents, setAgents] = useState<AgentPresenceInfo[]>([]);
  const [summary, setSummary] = useState<PresenceSummary>(defaultSummary);
  const [loading, setLoading] = useState(true);
  const [myStatusIntent, setLocalStatusIntent] = useState<'AVAILABLE' | 'PAUSED'>('AVAILABLE');
  const myStatusIntentRef = useRef<'AVAILABLE' | 'PAUSED'>('AVAILABLE');

  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const selectedStoreIdRef = useRef(selectedStoreId);
  useEffect(() => {
    selectedStoreIdRef.current = selectedStoreId;
  }, [selectedStoreId]);

  // Keep ref synced
  useEffect(() => {
    myStatusIntentRef.current = myStatusIntent;
  }, [myStatusIntent]);

  // Fetch all agents presence
  const refreshPresence = useCallback(async () => {
    try {
      const storeId = selectedStoreIdRef.current;
      const url =
        storeId && storeId !== 'ALL'
          ? `/api/agents/presence?storeId=${encodeURIComponent(storeId)}`
          : '/api/agents/presence';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents || []);
        setSummary(data.summary || defaultSummary);
      }
    } catch (err) {
      console.error('Error fetching agent presences:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Send Heartbeat
  const sendHeartbeat = useCallback(
    async (extra?: { activity?: string; orderId?: string; orderNumber?: string }) => {
      const user = currentUserRef.current;
      if (!user?.id) return;
      try {
        await fetch('/api/agents/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: user.id,
            agentName: user.name,
            role: user.role,
            currentPage: typeof window !== 'undefined' ? window.location.pathname : '',
            statusIntent: myStatusIntentRef.current,
            currentActivity: extra?.activity,
            currentOrderId: extra?.orderId,
            currentOrderNumber: extra?.orderNumber,
          }),
        });
      } catch (err) {
        console.error('Error sending presence heartbeat:', err);
      }
    },
    []
  );

  // Set Agent Status Intent (Available or Paused)
  const setMyStatusIntent = async (intent: 'AVAILABLE' | 'PAUSED') => {
    setLocalStatusIntent(intent);
    myStatusIntentRef.current = intent;
    const user = currentUserRef.current;
    if (user?.id) {
      try {
        await fetch('/api/agents/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: user.id,
            action: 'SET_STATUS_INTENT',
            statusIntent: intent,
          }),
        });
        refreshPresence();
      } catch (e) {
        console.error('Error updating status intent:', e);
      }
    }
  };

  // Explicit activity reporting
  const reportActivity = async (activity: string, orderId?: string, orderNumber?: string) => {
    await sendHeartbeat({ activity, orderId, orderNumber });
    refreshPresence();
  };

  // Immediate sync when currentUser or selectedStoreId changes
  useEffect(() => {
    if (currentUser?.id) {
      sendHeartbeat();
    }
    refreshPresence();
  }, [currentUser?.id, selectedStoreId, sendHeartbeat, refreshPresence]);

  // Periodic heartbeats and polling
  useEffect(() => {
    // Heartbeat every 20s
    const heartbeatInterval = setInterval(() => {
      sendHeartbeat();
    }, 20000);

    // Poll presences every 8s
    const pollInterval = setInterval(() => {
      refreshPresence();
    }, 8000);

    // On visibility change or window focus
    const handleSync = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
        refreshPresence();
      }
    };
    document.addEventListener('visibilitychange', handleSync);
    window.addEventListener('focus', handleSync);

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [sendHeartbeat, refreshPresence]);

  return (
    <PresenceContext.Provider
      value={{
        agents,
        summary,
        loading,
        myStatusIntent,
        setMyStatusIntent,
        reportActivity,
        refreshPresence,
      }}
    >
      {children}
    </PresenceContext.Provider>
  );
}

export const usePresence = () => useContext(PresenceContext);
