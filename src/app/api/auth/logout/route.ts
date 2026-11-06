import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Déconnexion réussie',
  });

  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
