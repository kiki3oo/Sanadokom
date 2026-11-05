import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { name, email, password, role, phone, commissionFee, active, permissions } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (password !== undefined && password.trim()) updateData.passwordHash = password.trim();
    if (role !== undefined) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone;
    if (commissionFee !== undefined) updateData.commissionFee = parseFloat(commissionFee);
    if (active !== undefined) updateData.active = Boolean(active);
    if (permissions !== undefined) {
      updateData.permissions = typeof permissions === 'string' ? permissions : JSON.stringify(permissions);
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    });

    // Transfer orders if requested (e.g. agent leave or departure)
    let transferredCount = 0;
    if (body.transferOrdersTo && body.transferOrdersTo !== params.id) {
      const transferRes = await prisma.order.updateMany({
        where: {
          assignedAgentId: params.id,
          status: { in: ['PENDING', 'CONFIRMED', 'SHIPPED', 'IN_TRANSIT'] },
        },
        data: {
          assignedAgentId: body.transferOrdersTo,
        },
      });
      transferredCount = transferRes.count;

      const targetAgent = await prisma.user.findUnique({
        where: { id: body.transferOrdersTo },
        select: { name: true },
      });

      await logActivity({
        userName: body.adminName || 'Admin',
        userRole: 'ADMIN',
        action: 'STATUS_CHANGE',
        entity: 'ORDER',
        details: `A transféré ${transferredCount} commandes actives de "${updatedUser.name}" vers le remplaçant "${targetAgent?.name || body.transferOrdersTo}"`,
      });
    }

    await logActivity({
      userName: body.adminName || 'Admin',
      userRole: 'ADMIN',
      action: 'USER_EDIT',
      entity: 'USER',
      entityId: params.id,
      details: `A modifié le compte de "${updatedUser.name}" (Statut: ${updatedUser.active ? 'Actif' : 'Suspendu'}${transferredCount > 0 ? `, ${transferredCount} commandes transférées` : ''})`,
    });

    return NextResponse.json({ success: true, user: updatedUser, transferredCount });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const adminName = searchParams.get('adminName') || 'Admin';

    const userToDelete = await prisma.user.findUnique({ where: { id: params.id } });

    // Unassign orders before deleting
    await prisma.order.updateMany({
      where: { assignedAgentId: params.id },
      data: { assignedAgentId: null },
    });

    await prisma.callLog.deleteMany({
      where: { agentId: params.id },
    });

    await prisma.user.delete({
      where: { id: params.id },
    });

    if (userToDelete) {
      await logActivity({
        userName: adminName,
        userRole: 'ADMIN',
        action: 'USER_EDIT',
        entity: 'USER',
        entityId: params.id,
        details: `A supprimé le compte utilisateur "${userToDelete.name}" (${userToDelete.email})`,
      });
    }

    return NextResponse.json({ success: true, message: 'Utilisateur supprimé avec succès' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
