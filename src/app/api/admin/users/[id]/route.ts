import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';
import { hashPassword, validNewPassword } from '@/lib/passwords';
import { getActiveAdmin, userFields } from '../access';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getActiveAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Accès réservé aux administrateurs.' }, { status: 403 });
    const body = await req.json();
    const { name, email, password, role, phone, commissionFee, active, permissions } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (password !== undefined && password !== '') {
      if (!validNewPassword(password)) {
        return NextResponse.json({ error: 'Utilisez un mot de passe de 12 caractères minimum.' }, { status: 400 });
      }
      updateData.passwordHash = await hashPassword(password.trim());
    }
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
      select: userFields,
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
        userName: admin.name,
        userRole: 'ADMIN',
        action: 'STATUS_CHANGE',
        entity: 'ORDER',
        details: `A transféré ${transferredCount} commandes actives de "${updatedUser.name}" vers le remplaçant "${targetAgent?.name || body.transferOrdersTo}"`,
      });
    }

    await logActivity({
      userName: admin.name,
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
    const admin = await getActiveAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Accès réservé aux administrateurs.' }, { status: 403 });
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
        userName: admin.name,
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
