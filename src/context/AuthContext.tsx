'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserPermissions {
  viewDashboard?: boolean;
  viewCallCenter?: boolean;
  viewConfirmers?: boolean;
  viewOrders?: boolean;
  viewStock?: boolean;
  viewExpenses?: boolean;
  viewIntegrations?: boolean;
  viewSimulator?: boolean;
  viewAdmin?: boolean;
  onlyOwnOrders?: boolean;
  hideCostPrices?: boolean;
  canManageRemittance?: boolean; // Permettre de marquer versé / gérer l'encaissement transporteur
  canChangeDeliveryStatus?: boolean; // Permettre de modifier les statuts de livraison (Livré, Refusé, Reporté...)
  assignedStoreIds?: string[]; // IDs of assigned boutiques/niches
  upsellCommissionFee?: number; // Prime UpSell par commande livrée
  bankName?: string; // Banque de l'agent (CIH, Attijari, etc.)
  bankRib?: string; // RIB Bancaire (24 chiffres)
  workStatus?: 'ACTIVE' | 'ON_LEAVE' | 'QUITTED'; // Statut de présence / travail
  leaveReason?: string; // Maladie, Congé, Départ, etc.
  leaveStartDate?: string;
  leaveEndDate?: string;
  replacementAgentId?: string; // ID de l'agent remplaçant qui assure le suivi
  replacementCommissionMode?: 'SPLIT_50_50' | 'FULL_TO_RESCUER' | 'FIXED_BONUS'; // Règle de partage de commission
  rescueBonusAmount?: number; // Prime de sauvetage fixe (ex: 10 DH)
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'CALL_AGENT' | 'LOGISTICS_MANAGER';
  phone?: string | null;
  commissionFee: number;
  permissions?: string | null;
  active: boolean;
}

interface AuthContextType {
  currentUser: AppUser | null;
  allUsers: AppUser[];
  isLoading: boolean;
  setCurrentUser: (user: AppUser | null) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: AppUser }>;
  logout: () => void;
  hasPermission: (perm: keyof UserPermissions) => boolean;
  canViewPage: (path: string) => boolean;
  refreshUsers: () => void;
  isAdmin: boolean;
  isCallAgent: boolean;
  isManager: boolean;
  assignedStoreIds: string[];
  isStoreAllowed: (storeId: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  allUsers: [],
  isLoading: true,
  setCurrentUser: () => {},
  login: async () => ({ success: false }),
  logout: () => {},
  hasPermission: () => false,
  canViewPage: () => false,
  refreshUsers: () => {},
  isAdmin: false,
  isCallAgent: false,
  isManager: false,
  assignedStoreIds: [],
  isStoreAllowed: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setLocalCurrentUser] = useState<AppUser | null>(null);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper to update current user and persist in localStorage
  const setCurrentUser = (user: AppUser | null) => {
    setLocalCurrentUser(user);
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('cod_current_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('cod_current_user');
      }
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success && data.users.length > 0) {
        setAllUsers(data.users);
      }
    } catch (e) {
      console.error('Failed to load users for auth', e);
    }
  };

  // Check authentication session on mount via /api/auth/me
  useEffect(() => {
    let isMounted = true;
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            if (isMounted) {
              setLocalCurrentUser(data.user);
              if (typeof window !== 'undefined') {
                localStorage.setItem('cod_current_user', JSON.stringify(data.user));
              }
              if (data.user.role === 'ADMIN') {
                fetchUsers();
              }
            }
            return;
          }
        }
        // If not authenticated or error
        if (isMounted) {
          setLocalCurrentUser(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('cod_current_user');
          }
        }
      } catch (err) {
        if (isMounted) {
          setLocalCurrentUser(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('cod_current_user');
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        if (data.user.role === 'ADMIN') {
          fetchUsers();
        }
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error || 'Identifiants invalides' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erreur lors de la connexion' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cod_current_user');
      window.location.href = '/login';
    }
  };

  const isAdmin = currentUser?.role === 'ADMIN';
  const isCallAgent = currentUser?.role === 'CALL_AGENT';
  const isManager = currentUser?.role === 'ADMIN' || currentUser?.role === 'LOGISTICS_MANAGER';

  // Parse permissions
  const parsedPermissions = React.useMemo<UserPermissions>(() => {
    try {
      if (currentUser?.permissions) {
        return typeof currentUser.permissions === 'string'
          ? JSON.parse(currentUser.permissions)
          : (currentUser.permissions as any);
      }
    } catch (e) {
      console.error(e);
    }
    return {};
  }, [currentUser?.permissions]);

  const hasPermission = (perm: keyof UserPermissions): boolean => {
    if (isAdmin) {
      // Restrictions must NEVER apply to Admin
      if (perm === 'onlyOwnOrders') return false;
      if (perm === 'hideCostPrices') return false;
      return true;
    }

    // Check custom permissions first if set
    if (parsedPermissions[perm] !== undefined) {
      return Boolean(parsedPermissions[perm]);
    }

    // Default Role Fallbacks:
    if (currentUser?.role === 'CALL_AGENT') {
      if (perm === 'viewCallCenter') return true;
      if (perm === 'viewOrders') return true;
      if (perm === 'onlyOwnOrders') return true;
      if (perm === 'viewStock') return true;
      if (perm === 'hideCostPrices') return true;
      // All other modules are strictly forbidden for call agents!
      return false;
    }

    if (currentUser?.role === 'LOGISTICS_MANAGER') {
      if (perm === 'viewOrders') return true;
      if (perm === 'viewStock') return true;
      if (perm === 'canManageRemittance') return true;
      if (perm === 'canChangeDeliveryStatus') return true;
      if (perm === 'hideCostPrices') return true;
      return false;
    }

    return false;
  };

  const canViewPage = (path: string): boolean => {
    if (isAdmin) return true;

    if (path === '/') return hasPermission('viewDashboard');
    if (path === '/call-center') return hasPermission('viewCallCenter');
    if (path === '/confirmers') return hasPermission('viewConfirmers');
    if (path === '/orders') return hasPermission('viewOrders');
    if (path === '/reclamations') return hasPermission('viewOrders') || hasPermission('viewCallCenter') || isAdmin;
    if (path === '/stock') return hasPermission('viewStock');
    if (path === '/suppliers') return false; // Strictly restricted to ADMIN only
    if (path === '/reports') return isManager || isAdmin;
    if (path === '/expenses') return hasPermission('viewExpenses');
    if (path === '/integrations') return hasPermission('viewIntegrations');
    if (path === '/whatsapp-bot') return hasPermission('viewIntegrations') || isManager || isAdmin;
    if (path === '/simulator') return hasPermission('viewSimulator');
    if (path === '/admin') return hasPermission('viewAdmin');
    if (path === '/audit-logs') return hasPermission('viewAdmin');
    if (path === '/productivity') return hasPermission('viewConfirmers') || isAdmin;
    if (path === '/confirmation') return hasPermission('viewConfirmers') || currentUser?.role === 'CALL_AGENT' || isAdmin;

    return true;
  };

  const assignedStoreIds = React.useMemo<string[]>(() => {
    if (isManager) return [];
    return Array.isArray(parsedPermissions.assignedStoreIds)
      ? parsedPermissions.assignedStoreIds
      : [];
  }, [isManager, parsedPermissions.assignedStoreIds]);

  const isStoreAllowed = (storeId: string): boolean => {
    if (isManager) return true;
    if (!storeId || storeId === 'ALL') return assignedStoreIds.length === 0;
    if (assignedStoreIds.length === 0) return true;
    return assignedStoreIds.includes(storeId);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        isLoading,
        setCurrentUser,
        login,
        logout,
        hasPermission,
        canViewPage,
        refreshUsers: fetchUsers,
        isAdmin,
        isCallAgent,
        isManager,
        assignedStoreIds,
        isStoreAllowed,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
