import { NextRequest, NextResponse } from 'next/server';
import { updateReclamation, deleteReclamation, loadReclamations } from '@/lib/reclamations';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = updateReclamation(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Ticket de réclamation introuvable' },
        { status: 404 }
      );
    }

    // Log activity
    await logActivity({
      userId: body.authorId || null,
      userName: body.authorName || 'Agent SAV',
      userRole: body.authorRole || 'CALL_AGENT',
      action: 'STATUS_CHANGE',
      entity: 'ORDER',
      entityId: updated.orderId || updated.id,
      orderId: updated.orderId || null,
      storeId: updated.storeId || null,
      details: `Mise à jour Réclamation ${updated.ticketNumber}: Statut -> ${updated.status}${
        body.resolutionNotes ? ` (${body.resolutionNotes})` : ''
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
