import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session';

export async function getActiveAdmin(req: NextRequest) {
  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!session) return null;

  return prisma.user.findFirst({
    where: { id: session.userId, role: 'ADMIN', active: true },
    select: { name: true },
  });
}

export const userFields = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  commissionFee: true,
  permissions: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;
