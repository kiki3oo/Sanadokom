import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!cookie) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const session = await verifySessionToken(cookie);
    if (!session || !session.userId) {
      const res = NextResponse.json({ success: false, error: 'Session expirée' }, { status: 401 });
      res.cookies.delete(SESSION_COOKIE_NAME);
      return res;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user || !user.active) {
      const res = NextResponse.json(
        { success: false, error: 'Compte introuvable ou désactivé' },
        { status: 401 }
      );
      res.cookies.delete(SESSION_COOKIE_NAME);
      return res;
    }

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

    return NextResponse.json({
      success: true,
      user: safeUser,
    });
  } catch (error: any) {
    console.error('Auth verification error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
