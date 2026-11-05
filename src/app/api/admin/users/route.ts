import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      include: {
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
    const body = await req.json();
    const { name, email, password, role, phone, commissionFee, active, permissions } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Le nom, l email et le mot de passe sont obligatoires' },
        { status: 400 }
      );
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
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash: password.trim(), // plain/hash for SaaS
        role: role || 'CALL_AGENT',
        phone: phone || null,
        commissionFee: commissionFee ? parseFloat(commissionFee) : 10.0,
        active: active !== undefined ? active : true,
        permissions: permissions ? (typeof permissions === 'string' ? permissions : JSON.stringify(permissions)) : null,
      },
    });

    await logActivity({
      userName: body.adminName || 'Admin',
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
