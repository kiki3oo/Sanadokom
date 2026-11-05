import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe obligatoires' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Adresse email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    if (!user.active) {
      return NextResponse.json(
        { error: 'Ce compte utilisateur est désactivé. Veuillez contacter l administrateur.' },
        { status: 403 }
      );
    }

    // Direct password match (or hashed comparison in SaaS)
    if (user.passwordHash !== password.trim()) {
      return NextResponse.json(
        { error: 'Adresse email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Safe user object (do not leak passwordHash)
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      commissionFee: user.commissionFee,
      permissions: user.permissions,
      active: user.active,
    };

    // Log login action
    await logActivity({
      userName: user.name,
      userRole: user.role,
      action: 'USER_LOGIN',
      entity: 'USER',
      entityId: user.id,
      details: `Connexion réussie de l utilisateur "${user.name}" (${user.role})`,
    });

    return NextResponse.json({
      success: true,
      message: 'Connexion réussie',
      user: safeUser,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
