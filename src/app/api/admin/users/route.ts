import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';
import { hashPassword, validNewPassword } from '@/lib/passwords';
import { getActiveAdmin, userFields } from './access';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const admin = await getActiveAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Accès réservé aux administrateurs.' }, { status: 403 });
    const users = await prisma.user.findMany({
      select: {
        ...userFields,
        _count: {
          select: {
            assignedOrders: true,
            callLogs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getActiveAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Accès réservé aux administrateurs.' }, { status: 403 });
    const body = await req.json();
    const { name, email, password, role, phone, commissionFee, active, permissions } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Le nom, l email et le mot de passe sont obligatoires' },
        { status: 400 }
      );
    }

    if (!validNewPassword(password)) {
      return NextResponse.json({ error: 'Utilisez un mot de passe de 12 caractères minimum.' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà' },
        { status: 400 }
      );
    }

    const newUser = await prisma.user.create({
      select: userFields,
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash: await hashPassword(password.trim()),
        role: role || 'CALL_AGENT',
        phone: phone || null,
        commissionFee: commissionFee ? parseFloat(commissionFee) : 10.0,
        active: active !== undefined ? active : true,
        permissions: permissions ? (typeof permissions === 'string' ? permissions : JSON.stringify(permissions)) : null,
      },
    });

    await logActivity({
      userName: admin.name,
      userRole: 'ADMIN',
      action: 'USER_CREATE',
      entity: 'USER',
      entityId: newUser.id,
      details: `A créé un nouveau compte utilisateur : "${newUser.name}" (Rôle: ${newUser.role}, Email: ${newUser.email})`,
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
