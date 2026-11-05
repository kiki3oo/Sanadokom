import { prisma } from '@/lib/prisma';

export interface LogActivityParams {
  userId?: string | null;
  userName: string;
  userRole?: string | null;
  action:
    | 'STATUS_CHANGE'
    | 'ORDER_EDIT'
    | 'LEAD_LOCKED'
    | 'ORDER_ASSIGN'
    | 'BULK_ASSIGN'
    | 'ORDER_DELETE'
    | 'STOCK_UPDATE'
    | 'EXPENSE_ADD'
    | 'EXPENSE_DELETE'
    | 'USER_CREATE'
    | 'USER_EDIT'
    | 'USER_LOGIN'
    | 'SETTING_CHANGE'
    | 'CALL_LOG';
  entity: 'ORDER' | 'PRODUCT' | 'EXPENSE' | 'USER' | 'SETTING' | 'STORE';
  entityId?: string | null;
  details: string;
  oldValue?: string | null;
  newValue?: string | null;
  orderId?: string | null;
  storeId?: string | null;
}

export async function logActivity(params: LogActivityParams) {
  try {
    return await prisma.activityLog.create({
      data: {
        userId: params.userId || null,
        userName: params.userName || 'Utilisateur',
        userRole: params.userRole || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        details: params.details,
        oldValue: params.oldValue || null,
        newValue: params.newValue || null,
        orderId: params.orderId || null,
        storeId: params.storeId || null,
      },
    });
  } catch (err) {
    console.error('Failed to log activity audit:', err);
    return null;
  }
}
