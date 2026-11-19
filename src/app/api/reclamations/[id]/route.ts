import { NextRequest, NextResponse } from 'next/server';
import { updateReclamation, deleteReclamation, loadReclamations } from '@/lib/reclamations';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const tickets = loadReclamations();
    const existing = tickets.find((t) => t.id === id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Ticket de réclamation introuvable' },
        { status: 404 }
      );
    }

    const isManagerOrAdmin = body.authorRole === 'ADMIN' || body.authorRole === 'LOGISTICS_MANAGER';
    const updates: any = { ...body };

    // 1. APPROVAL ACTION
    if (body.action === 'APPROVE' || body.status === 'APPROUVE') {
      if (!isManagerOrAdmin) {
        return NextResponse.json(
          { success: false, error: 'Seul un Administrateur ou un Manager peut valider cette réclamation.' },
          { status: 403 }
        );
      }
      updates.status = 'APPROUVE';
      updates.approvedById = body.authorId || null;
      updates.approvedByName = body.authorName || 'Manager';
      updates.approvedAt = new Date().toISOString();
      if (body.managerNotes) updates.managerNotes = body.managerNotes;
    }

    // 2. REJECTION ACTION
    if (body.action === 'REJECT' || body.status === 'REJETE') {
      if (!isManagerOrAdmin) {
        return NextResponse.json(
          { success: false, error: 'Seul un Administrateur ou un Manager peut rejeter cette réclamation.' },
          { status: 403 }
        );
      }
      updates.status = 'REJETE';
      updates.rejectedById = body.authorId || null;
      updates.rejectedByName = body.authorName || 'Manager';
      updates.rejectedAt = new Date().toISOString();
      updates.rejectionReason = body.rejectionReason || body.resolutionNotes || 'Demande non approuvée par la direction';
    }

    // 3. EXECUTE REFUND (Création Dépense & Clôture Résolue)
    if (body.action === 'EXECUTE_REFUND' || body.executeRefund === true) {
      const netAmount = Number(body.netRefundAmount !== undefined ? body.netRefundAmount : (existing.netRefundAmount || existing.refundAmount || 0));
      const refundMethod = body.refundMethod || 'VIREMENT_BANCAIRE';

      let targetStoreId = existing.storeId;
      if (!targetStoreId) {
        const anyStore = await prisma.store.findFirst();
        targetStoreId = anyStore?.id || '';
      }

      let expenseId: string | null = null;
      if (netAmount > 0 && targetStoreId) {
        let desc = '';
        if (refundMethod === 'PAR_LIVREUR') {
          desc = `[SAV Remboursement Livreur] Ticket ${existing.ticketNumber} (#${existing.orderNumber}) - Client: ${existing.customerName} - Repris et remboursé en espèces par le livreur (${existing.courierProvider || 'Transporteur'}) - Déduit du versement`;
        } else {
          const ribInfo = body.customerRib || existing.customerRib || 'N/A';
          const bankInfo = body.customerBankName || existing.customerBankName || '';
          desc = `[SAV Remboursement] Ticket ${existing.ticketNumber} (#${existing.orderNumber}) - Client: ${existing.customerName} - RIB: ${ribInfo} (${bankInfo})`;
        }

        const exp = await prisma.expense.create({
          data: {
            storeId: targetStoreId,
            category: 'OTHER',
            amount: netAmount,
            description: desc,
          },
        });
        expenseId = exp.id;
      }

      // If refunded directly by courier on-site, update order status and courier remittance
      if (refundMethod === 'PAR_LIVREUR' && existing.orderId) {
        try {
          await prisma.order.update({
            where: { id: existing.orderId },
            data: {
              status: 'RETURNED',
              subStatus: 'REMBOURSE_PAR_LIVREUR',
              courierStatus: 'REMBOURSE_PAR_LIVREUR',
            },
          });
        } catch (e) {
          console.error('Error updating order on courier refund:', e);
        }
      }

      updates.status = 'RESOLU';
      updates.refundAmount = netAmount;
      updates.netRefundAmount = netAmount;
      updates.refundPaidAt = new Date().toISOString();
      updates.refundExpenseId = expenseId;
      updates.refundMethod = refundMethod;
      if (body.customerRib) updates.customerRib = body.customerRib;
      if (body.customerBankName) updates.customerBankName = body.customerBankName;
      updates.resolutionNotes = refundMethod === 'PAR_LIVREUR'
        ? `Colis repris et remboursé en espèces (${netAmount} DH) directement par le livreur (${existing.courierProvider || 'Transporteur'}). Versement déduit.`
        : `Remboursement de ${netAmount} DH effectué avec succès via ${refundMethod}.${expenseId ? ` Dépense enregistrée #${expenseId}.` : ''}`;
    }

    const updated = updateReclamation(id, updates);

    // Log activity
    await logActivity({
      userId: body.authorId || null,
      userName: body.authorName || 'Agent SAV',
      userRole: body.authorRole || 'CALL_AGENT',
      action: 'STATUS_CHANGE',
      entity: 'ORDER',
      entityId: updated?.orderId || updated?.id,
      orderId: updated?.orderId || null,
      storeId: updated?.storeId || null,
      details: `SAV Réclamation ${updated?.ticketNumber}: Statut -> ${updated?.status}${
        body.resolutionNotes || updates.managerNotes || updates.rejectionReason ? ` (${body.resolutionNotes || updates.managerNotes || updates.rejectionReason})` : ''
      }`,
    });

    return NextResponse.json({
      success: true,
      ticket: updated,
    });
  } catch (error: any) {
    console.error('Error updating reclamation:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur mise à jour ticket' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ok = deleteReclamation(id);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: 'Ticket introuvable' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting reclamation:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur suppression ticket' },
      { status: 500 }
    );
  }
}
