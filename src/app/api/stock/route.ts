import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');
    const agentId = searchParams.get('agentId');

    const where: any = {};
    if (storeId && storeId !== 'ALL') {
      where.storeId = storeId.includes(',') ? { in: storeId.split(',') } : storeId;
    }

    if (agentId) {
      const agentUser = await prisma.user.findUnique({
        where: { id: agentId },
        select: { role: true, permissions: true },
      });
      if (agentUser?.role === 'CALL_AGENT' && agentUser.permissions) {
        try {
          const p = JSON.parse(agentUser.permissions);
          if (Array.isArray(p.assignedStoreIds) && p.assignedStoreIds.length > 0) {
            if (storeId && storeId !== 'ALL' && p.assignedStoreIds.includes(storeId)) {
              where.storeId = storeId;
            } else {
              where.storeId = { in: p.assignedStoreIds };
            }
          }
        } catch (e) {}
      }
    }

    // 1. Fetch Products with Movements
    const products = await prisma.product.findMany({
      where,
      include: {
        store: { select: { id: true, name: true, currency: true } },
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { stockQuantity: 'asc' }, // shows low stock first
    });

    const productIds = products.map((p) => p.id);

    // 2. Fetch In-Transit Orders (Stock sur le terrain: SHIPPED ou IN_TRANSIT)
    const inTransitItems = await prisma.orderItem.findMany({
      where: {
        order: { status: { in: ['SHIPPED', 'IN_TRANSIT'] } },
        productId: { in: productIds },
      },
      select: {
        productId: true,
        quantity: true,
      },
    });

    const inTransitMap = new Map<string, number>();
    inTransitItems.forEach((item) => {
      inTransitMap.set(item.productId, (inTransitMap.get(item.productId) || 0) + (item.quantity || 1));
    });

    // 3. Fetch Damage / Defective Movements (Stock Endommagé)
    const damageMovements = await prisma.stockMovement.findMany({
      where: {
        type: 'DAMAGE',
        productId: { in: productIds },
      },
      select: {
        productId: true,
        quantity: true,
      },
    });

    const damageMap = new Map<string, number>();
    damageMovements.forEach((m) => {
      damageMap.set(m.productId, (damageMap.get(m.productId) || 0) + Math.abs(m.quantity));
    });

    // 4. Fetch Purchase / Arrivage Movements (Total Stock Entré)
    const purchaseMovements = await prisma.stockMovement.findMany({
      where: {
        type: 'PURCHASE',
        productId: { in: productIds },
      },
      select: {
        productId: true,
        quantity: true,
      },
    });

    const purchaseMap = new Map<string, number>();
    purchaseMovements.forEach((m) => {
      purchaseMap.set(m.productId, (purchaseMap.get(m.productId) || 0) + Math.abs(m.quantity));
    });

    // 5. Enrich each Product with the 4 Stock States
    const enrichedProducts = products.map((p) => {
      const stockWarehouse = p.stockQuantity; // Stock actuel disponible en entrepôt
      const stockTotalEntered = (p.stockInitial || 0) + (purchaseMap.get(p.id) || 0); // Stock total entré
      const stockInTransit = inTransitMap.get(p.id) || 0; // Stock en cours de livraison (sur le terrain)
      const stockDamaged = damageMap.get(p.id) || 0; // Stock cassé / défectueux (isolé)

      return {
        ...p,
        stockWarehouse,
        stockTotalEntered,
        stockInTransit,
        stockDamaged,
      };
    });

    // 6. Global Stock Summary
    const summary = {
      totalProducts: enrichedProducts.length,
      totalWarehouseStock: enrichedProducts.reduce((acc, p) => acc + p.stockWarehouse, 0),
      totalEnteredStock: enrichedProducts.reduce((acc, p) => acc + p.stockTotalEntered, 0),
      totalInTransitStock: enrichedProducts.reduce((acc, p) => acc + p.stockInTransit, 0),
      totalDamagedStock: enrichedProducts.reduce((acc, p) => acc + p.stockDamaged, 0),
      lowStockCount: enrichedProducts.filter((p) => p.stockWarehouse <= p.alertThreshold).length,
    };

    return NextResponse.json({
      success: true,
      products: enrichedProducts,
      summary,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // Action 1: Adjust stock for an existing product
    if (action === 'ADJUST') {
      const { productId, type, quantity, notes, reference } = body;

      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      const inputQty = parseInt(quantity);
      const isDeduction = ['SALE', 'DAMAGE'].includes(type) || inputQty < 0;
      const actualQty = isDeduction ? -Math.abs(inputQty) : Math.abs(inputQty);
      const prev = product.stockQuantity;
      const next = prev + actualQty;

      if (next < 0) {
        return NextResponse.json({ error: 'Le stock disponible ne peut pas être inférieur à 0' }, { status: 400 });
      }

      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: { stockQuantity: next },
      });

      const movement = await prisma.stockMovement.create({
        data: {
          productId,
          type: type || 'ADJUSTMENT', // PURCHASE, SALE, RETURN, DAMAGE, ADJUSTMENT
          quantity: actualQty,
          previousStock: prev,
          newStock: next,
          reference: reference || (type === 'DAMAGE' ? 'QUARANTAINE-CASSE' : 'MANUAL-ADJUSTMENT'),
          notes: notes || (type === 'DAMAGE' ? 'Déclaration marchandise endommagée / défectueuse (Isolée du stock disponible)' : null),
        },
      });

      await logActivity({
        userName: body.userName || 'Magasinier / Admin',
        userRole: body.userRole || 'LOGISTICS_MANAGER',
        action: 'STOCK_UPDATE',
        entity: 'PRODUCT',
        entityId: productId,
        storeId: product.storeId,
        oldValue: `${prev} unités`,
        newValue: `${next} unités`,
        details: `A modifié le stock de "${product.name}" (${product.sku}) : ${prev} -> ${next} (${actualQty > 0 ? `+${actualQty}` : actualQty}) [${type}] - Motif: ${notes || type || 'Ajustement manuel'}`,
      });

      return NextResponse.json({ success: true, product: updatedProduct, movement });
    }

    // Action 2: Create a new product
    if (action === 'CREATE') {
      const { storeId, sku, name, description, costPrice, sellingPrice, stockQuantity, alertThreshold, userName, userRole } = body;

      if (!storeId || !sku || !name) {
        return NextResponse.json({ error: 'Store, SKU, and Name are required' }, { status: 400 });
      }

      const initialQty = parseInt(stockQuantity || 0);

      const product = await prisma.product.create({
        data: {
          storeId,
          sku: sku.trim().toUpperCase(),
          name: name.trim(),
          description: description || null,
          costPrice: parseFloat(costPrice || 0),
          sellingPrice: parseFloat(sellingPrice || 0),
          stockInitial: initialQty,
          stockQuantity: initialQty,
          alertThreshold: parseInt(alertThreshold || 10),
        },
      });

      if (initialQty > 0) {
        await prisma.stockMovement.create({
          data: {
            productId: product.id,
            type: 'PURCHASE',
            quantity: initialQty,
            previousStock: 0,
            newStock: initialQty,
            reference: 'INITIAL_STOCK',
            notes: 'Stock initial à la création du produit',
          },
        });
      }

      await logActivity({
        userName: userName || 'Admin',
        userRole: userRole || 'ADMIN',
        action: 'STOCK_UPDATE',
        entity: 'PRODUCT',
        entityId: product.id,
        storeId: product.storeId,
        oldValue: '0 unités',
        newValue: `${initialQty} unités`,
        details: `A créé le nouveau produit "${product.name}" (SKU: ${product.sku}) - Prix Vente: ${product.sellingPrice} MAD, Stock initial: ${product.stockQuantity}`,
      });

      return NextResponse.json({ success: true, product });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in POST /api/stock:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
