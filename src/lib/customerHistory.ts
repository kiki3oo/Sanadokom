import { prisma } from './prisma';

export function normalizePhone(phone?: string | null): string {
  if (!phone) return '';
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('212')) clean = clean.slice(3);
  if (clean.startsWith('0')) clean = clean.slice(1);
  return clean;
}

export interface CustomerHistoryProfile {
  totalOrders: number;
  isRecurring: boolean;
  deliveredCount: number;
  confirmedCount: number;
  cancelledCount: number;
  pendingCount: number;
  isDuplicate: boolean;
  duplicateReason?: string | null;
  reliabilityBadge: 'VIP' | 'RECURRING' | 'RISKY' | 'DUPLICATE' | 'NEW';
  previousOrders: {
    id: string;
    orderNumber: string;
    status: string;
    createdAt: string;
    totalAmount: number;
    storeName?: string;
    agentNotes?: string | null;
    agentName?: string | null;
    items: {
      productName?: string;
      quantity: number;
    }[];
  }[];
}

export async function enrichOrdersWithCustomerProfiles(orders: any[]): Promise<any[]> {
  if (!orders || orders.length === 0) return [];

  // Extract raw and normalized phone numbers
  const phoneMap = new Map<string, string[]>();
  for (const o of orders) {
    const raw = o.customerPhone;
    const norm = normalizePhone(raw);
    if (norm) {
      if (!phoneMap.has(norm)) {
        phoneMap.set(norm, []);
      }
      if (!phoneMap.get(norm)!.includes(raw)) {
        phoneMap.get(norm)!.push(raw);
      }
    }
  }

  const normalizedPhones = Array.from(phoneMap.keys());
  if (normalizedPhones.length === 0) {
    return orders.map((o) => ({ ...o, customerProfile: getEmptyProfile() }));
  }

  // Search related orders that share these phone numbers
  const orConditions = normalizedPhones.map((norm) => ({
    customerPhone: { contains: norm },
  }));

  const allRelatedOrders = await prisma.order.findMany({
    where: {
      OR: orConditions,
    },
    select: {
      id: true,
      orderNumber: true,
      customerPhone: true,
      customerName: true,
      status: true,
      totalAmount: true,
      createdAt: true,
      agentNotes: true,
      store: { select: { id: true, name: true } },
      items: {
        select: {
          quantity: true,
          product: { select: { id: true, name: true, sku: true } },
        },
      },
      assignedAgent: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return orders.map((order) => {
    const normPhone = normalizePhone(order.customerPhone);
    if (!normPhone) {
      return { ...order, customerProfile: getEmptyProfile() };
    }

    // Find other orders matching the same normalized phone number
    const otherOrders = allRelatedOrders.filter(
      (r) => normalizePhone(r.customerPhone) === normPhone && r.id !== order.id
    );

    const totalOrdersCount = otherOrders.length + 1;
    const deliveredCount = otherOrders.filter((r) => r.status === 'DELIVERED').length;
    const confirmedCount = otherOrders.filter((r) =>
      ['CONFIRMED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'].includes(r.status)
    ).length;
    const cancelledCount = otherOrders.filter((r) =>
      ['CANCELLED', 'RETURNED'].includes(r.status)
    ).length;
    const pendingCount = otherOrders.filter((r) => r.status === 'PENDING').length;

    // Check duplicate conditions:
    // 1. Same product ordered before
    const currentProductNames = (order.items || [])
      .map((i: any) => i.product?.name)
      .filter(Boolean);

    const sameProductOrder = otherOrders.find((r) =>
      (r.items || []).some((i: any) => currentProductNames.includes(i.product?.name))
    );

    // 2. An order placed within 48h
    const orderTime = new Date(order.createdAt).getTime();
    const recentOrder = otherOrders.find((r) => {
      const diffHours = Math.abs(orderTime - new Date(r.createdAt).getTime()) / (1000 * 3600);
      return diffHours <= 48;
    });

    const isDuplicate = Boolean(sameProductOrder || (recentOrder && pendingCount > 0));
    let duplicateReason: string | null = null;
    if (sameProductOrder) {
      duplicateReason = `Même produit déjà commandé (#${sameProductOrder.orderNumber} - ${sameProductOrder.status})`;
    } else if (recentOrder) {
      duplicateReason = `Commande récente (#${recentOrder.orderNumber} - ${recentOrder.status})`;
    }

    let reliabilityBadge: 'VIP' | 'RECURRING' | 'RISKY' | 'DUPLICATE' | 'NEW' = 'NEW';
    if (isDuplicate) {
      reliabilityBadge = 'DUPLICATE';
    } else if (deliveredCount >= 1 && cancelledCount === 0) {
      reliabilityBadge = 'VIP';
    } else if (cancelledCount >= 1 && deliveredCount === 0) {
      reliabilityBadge = 'RISKY';
    } else if (totalOrdersCount > 1) {
      reliabilityBadge = 'RECURRING';
    } else {
      reliabilityBadge = 'NEW';
    }

    const customerProfile: CustomerHistoryProfile = {
      totalOrders: totalOrdersCount,
      isRecurring: totalOrdersCount > 1,
      deliveredCount,
      confirmedCount,
      cancelledCount,
      pendingCount,
      isDuplicate,
      duplicateReason,
      reliabilityBadge,
      previousOrders: otherOrders.map((r) => ({
        id: r.id,
        orderNumber: r.orderNumber,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        totalAmount: r.totalAmount,
        storeName: r.store?.name,
        agentNotes: r.agentNotes,
        agentName: r.assignedAgent?.name,
        items: (r.items || []).map((i) => ({
          productName: i.product?.name,
          quantity: i.quantity,
        })),
      })),
    };

    return {
      ...order,
      customerProfile,
    };
  });
}

function getEmptyProfile(): CustomerHistoryProfile {
  return {
    totalOrders: 1,
    isRecurring: false,
    deliveredCount: 0,
    confirmedCount: 0,
    cancelledCount: 0,
    pendingCount: 0,
    isDuplicate: false,
    duplicateReason: null,
    reliabilityBadge: 'NEW',
    previousOrders: [],
  };
}
