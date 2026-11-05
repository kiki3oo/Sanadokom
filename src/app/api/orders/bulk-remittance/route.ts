import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderIds, remittanceStatus = 'VERSE', userName = 'Responsable Financier' } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'orderIds array obligatoire' }, { status: 400 });
    }

    const updateResult = await prisma.order.updateMany({
      where: {
        id: { in: orderIds },
      },
      data: {
        courierStatus: remittanceStatus,
      },
    });

    const isVerse = remittanceStatus === 'VERSE' || remittanceStatus === 'PAYE';
    await logActivity({
      userName,
      userRole: 'LOGISTICS_MANAGER',
      action: 'STATUS_CHANGE',
      entity: 'ORDER',
      details: isVerse
        ? `A marqué un lot de ${updateResult.count} commande(s) comme Encaissées / Versées par la société de livraison.`
        : `A réinitialisé le statut de versement de ${updateResult.count} commande(s) en Attente de Versement.`,
    });

    return NextResponse.json({
      success: true,
      count: updateResult.count,
      message: `${updateResult.count} commande(s) mise(s) à jour avec succès : ${isVerse ? 'Encaissées / Versées' : 'En attente de versement'}`,
    });
  } catch (error: any) {
    console.error('Error in bulk remittance update:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
