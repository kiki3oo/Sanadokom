import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderIds, agentId, assignedByName } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'orderIds array obligatoire' }, { status: 400 });
    }

    if (!agentId) {
      return NextResponse.json({ error: 'agentId obligatoire' }, { status: 400 });
    }

    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: { id: true, name: true, commissionFee: true },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent introuvable' }, { status: 404 });
    }

    // Bulk update orders
    const updateResult = await prisma.order.updateMany({
      where: {
        id: { in: orderIds },
      },
      data: {
        assignedAgentId: agent.id,
        confirmerFee: agent.commissionFee,
      },
    });

    await logActivity({
      userName: assignedByName || 'Responsable Dispatch',
      userRole: 'ADMIN',
      action: 'BULK_ASSIGN',
      entity: 'ORDER',
      details: `A assigné un lot de ${updateResult.count} commande(s) à l'agent "${agent.name}"`,
    });

    return NextResponse.json({
      success: true,
      count: updateResult.count,
      message: `${updateResult.count} commande(s) assignée(s) avec succès à ${agent.name}`,
    });
  } catch (error: any) {
    console.error('Error in bulk assign:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
