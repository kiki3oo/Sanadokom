import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      include: {
        _count: {
          select: { orders: true, products: true },
        },
        fbSettings: true,
        courierConfig: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, stores });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, currency } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'name and slug are required' }, { status: 400 });
    }

    const webhookSecret = `whsec_${slug.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${crypto.randomBytes(4).toString('hex')}`;

    const store = await prisma.store.create({
      data: {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        currency: currency || 'MAD',
        webhookSecret,
      },
    });

    return NextResponse.json({ success: true, store });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
