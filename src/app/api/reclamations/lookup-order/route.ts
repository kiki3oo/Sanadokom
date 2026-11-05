import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, orders: [] });
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { orderNumber: { contains: query } },
          { customerPhone: { contains: query } },
          { customerName: { contains: query } },
        ],
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        store: { select: { id: true, name: true, currency: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, imageUrl: true } },
          },
        },
        assignedAgent: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        storeId: o.storeId,
        storeName: o.store?.name || '',
        currency: o.store?.currency || 'MAD',
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        customerCity: o.customerCity,
        customerAddress: o.customerAddress,
        status: o.status,
        subStatus: o.subStatus,
        totalAmount: o.totalAmount,
        courierProvider: o.courierProvider,
        trackingNumber: o.trackingNumber,
        assignedAgentId: o.assignedAgentId,
        assignedAgentName: o.assignedAgent?.name || null,
        createdAt: o.createdAt,
        items: o.items.map((it) => ({
          id: it.id,
          productId: it.productId,
          productName: it.product?.name || 'Produit',
          sku: it.product?.sku || '',
          variant: it.variant,
          color: it.color,
          size: it.size,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
      })),
    });
  } catch (error: any) {
    console.error('Error looking up order:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de la recherche de commande' },
      { status: 500 }
    );
  }
}
