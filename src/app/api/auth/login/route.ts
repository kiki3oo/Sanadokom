import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';
import { createSessionToken, SESSION_COOKIE_NAME, sessionSigningConfigured } from '@/lib/session';

import { hashPassword, isLegacyPassword, verifyPassword } from '@/lib/passwords';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' ||
        !password.trim() || Buffer.byteLength(password.trim(), 'utf8') > 1024) {
      return NextResponse.json(
        { error: 'Email et mot de passe obligatoires' },
        { status: 400 }
      );
    }

    if (!sessionSigningConfigured()) {
      return NextResponse.json({ error: 'Authentification temporairement indisponible.' }, { status: 503 });
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

    const suppliedPassword = password.trim();
    if (!await verifyPassword(suppliedPassword, user.passwordHash)) {
      return NextResponse.json(
        { error: 'Adresse email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    if (isLegacyPassword(user.passwordHash)) {
      const updated = await prisma.user.updateMany({
        where: { id: user.id, passwordHash: user.passwordHash, active: true },
        data: { passwordHash: await hashPassword(suppliedPassword) },
      });
      if (!updated.count) {
        return NextResponse.json({ error: 'Veuillez réessayer de vous connecter.' }, { status: 409 });
      }
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

    // Create secure session token
    const token = await createSessionToken(user.id, user.role, user.email);

    // Log login action
    await logActivity({
      userName: user.name,
      userRole: user.role,
      action: 'USER_LOGIN',
      entity: 'USER',
      entityId: user.id,
      details: `Connexion réussie de l'utilisateur "${user.name}" (${user.role})`,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Connexion réussie',
      user: safeUser,
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
