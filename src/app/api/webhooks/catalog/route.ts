import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authorization = req.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ') || !authorization.slice(7).trim()) {
    return NextResponse.json({ error: 'Store authentication required' }, { status: 401 });
  }
  const store = await prisma.store.findUnique({
    where: { webhookSecret: authorization.slice(7) },
    select: {
      currency: true,
      products: {
        where: { sellingPrice: { gt: 0 } },
        select: { sku: true, name: true, sellingPrice: true, stockQuantity: true, reservedQuantity: true, size: true, color: true },
        orderBy: { name: 'asc' },
      },
    },
  });
  if (!store || store.currency !== 'MAD') {
    return NextResponse.json({ error: 'Store authentication required' }, { status: 401 });
  }
  return NextResponse.json({ products: store.products.map(({ stockQuantity, reservedQuantity, ...product }) => ({
    ...product, available: Math.max(0, stockQuantity - reservedQuantity),
  })) }, { headers: { 'Cache-Control': 'private, no-store' } });
}
