import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const entity = searchParams.get('entity');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const storeId = searchParams.get('storeId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (storeId === 'NONE') {
      where.storeId = '__NONE__';
    } else if (storeId && storeId !== 'ALL') {
      if (storeId.includes(',')) {
        where.storeId = { in: storeId.split(',') };
      } else {
        where.storeId = storeId;
      }
    }

    if (orderId) {
      where.orderId = orderId;
    }

    if (userId && userId !== 'ALL') {
      where.userId = userId;
    }

    if (action && action !== 'ALL') {
      where.action = action;
    }

    if (entity && entity !== 'ALL') {
      where.entity = entity;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (search) {
      where.OR = [
        { details: { contains: search } },
        { userName: { contains: search } },
        { entityId: { contains: search } },
        { orderId: { contains: search } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    // Fast breakdown stats for top cards
    const userActionsMap: Record<string, { name: string; count: number; role?: string }> = {};
    const actionCounts: Record<string, number> = {};

    logs.forEach((log) => {
      // By user
      const uName = log.userName || 'Inconnu';
      if (!userActionsMap[uName]) {
        userActionsMap[uName] = { name: uName, count: 0, role: log.userRole || undefined };
      }
      userActionsMap[uName].count += 1;

      // By action
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    const topUsers = Object.values(userActionsMap).sort((a, b) => b.count - a.count);

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalActions: total,
        topUsers,
        actionCounts,
      },
    });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await logActivity(body);
    if (!result) {
      return NextResponse.json({ success: false, error: 'Failed to record audit log' }, { status: 500 });
    }
    return NextResponse.json({ success: true, log: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
