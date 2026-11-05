import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCourierProvider, AVAILABLE_COURIERS } from '@/lib/couriers';
import {
  loadShippingWorkflowConfig,
  saveShippingWorkflowConfig,
  resolveCourierForOrder,
  getAllCouriers,
  CustomCourier,
} from '@/lib/shippingWorkflow';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');

    const config = loadShippingWorkflowConfig();
    const allCouriers = getAllCouriers(config);

    // Find all confirmed orders ready for dispatch
    const where: any = {
      status: 'CONFIRMED',
    };

    if (storeId && storeId !== 'ALL') {
      where.storeId = storeId.includes(',') ? { in: storeId.split(',') } : storeId;
    }

    const pendingOrders = await prisma.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerCity: true,
        customerPhone: true,
        totalAmount: true,
        store: { select: { id: true, name: true, currency: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute breakdown by resolved courier
    const courierBreakdown: Record<string, { count: number; totalCOD: number; cities: string[]; courierName: string }> = {};

    pendingOrders.forEach((o) => {
      const resolution = resolveCourierForOrder(o.customerCity, o.store?.currency || 'MAD', config);
      const courierKey = resolution.courier;

      if (!courierBreakdown[courierKey]) {
        const found = allCouriers.find((c) => c.id === courierKey);
        courierBreakdown[courierKey] = {
          count: 0,
          totalCOD: 0,
          cities: [],
          courierName: found?.name || courierKey,
        };
      }

      courierBreakdown[courierKey].count += 1;
      courierBreakdown[courierKey].totalCOD += o.totalAmount || 0;
      if (!courierBreakdown[courierKey].cities.includes(o.customerCity)) {
        courierBreakdown[courierKey].cities.push(o.customerCity);
      }
    });

    return NextResponse.json({
      success: true,
      config,
      availableCouriers: allCouriers,
      pendingCount: pendingOrders.length,
      pendingOrders: pendingOrders.slice(0, 50),
      courierBreakdown,
    });
  } catch (error: any) {
    console.error('Error fetching dispatch info:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, config: newConfig, orderIds, storeId, forceCourier, courierProvider, userName, courierData, courierId } = body;
    const currentConfig = loadShippingWorkflowConfig();

    // Sub-Action 1: Add Custom Courier
    if (action === 'ADD_CUSTOM_COURIER') {
      const { name, country, phone, deliveryFee } = courierData || {};
      if (!name || !name.trim()) {
        return NextResponse.json({ success: false, error: 'Nom du transporteur requis' }, { status: 400 });
      }

      const id = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
      const newCustomCourier: CustomCourier = {
        id,
        name: name.trim(),
        country: country || 'MA',
        phone: phone || undefined,
        deliveryFee: deliveryFee ? parseFloat(deliveryFee) : 35.0,
      };

      const existingCouriers = currentConfig.customCouriers || [];
      const updatedCouriers = [...existingCouriers.filter((c) => c.id !== id), newCustomCourier];

      const saved = saveShippingWorkflowConfig({ customCouriers: updatedCouriers });
      return NextResponse.json({
        success: true,
        message: `Société de livraison "${name.trim()}" ajoutée avec succès !`,
        config: saved,
        availableCouriers: getAllCouriers(saved),
      });
    }

    // Sub-Action 2: Delete Custom Courier
    if (action === 'DELETE_CUSTOM_COURIER') {
      const existingCouriers = currentConfig.customCouriers || [];
      const updatedCouriers = existingCouriers.filter((c) => c.id !== courierId);
      const saved = saveShippingWorkflowConfig({ customCouriers: updatedCouriers });
      return NextResponse.json({
        success: true,
        message: 'Transporteur supprimé avec succès.',
        config: saved,
        availableCouriers: getAllCouriers(saved),
      });
    }

    // Sub-Action 3: Save Workflow Config
    if (action === 'SAVE_CONFIG') {
      if (!newConfig) {
        return NextResponse.json({ success: false, error: 'Config object required' }, { status: 400 });
      }
      const saved = saveShippingWorkflowConfig(newConfig);
      return NextResponse.json({
        success: true,
        message: 'Configuration du workflow d expédition enregistrée avec succès.',
        config: saved,
      });
    }

    // Main Action: Dispatch Orders (Auto or Selection)
    let ordersToDispatch: any[] = [];

    if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
      // Manual selection of orders
      ordersToDispatch = await prisma.order.findMany({
        where: { id: { in: orderIds } },
        include: {
          store: {
            include: {
              courierConfig: true,
            },
          },
          items: { include: { product: true } },
        },
      });
    } else {
      // Auto-dispatch all confirmed orders
      const where: any = {
        status: 'CONFIRMED',
      };
      if (storeId && storeId !== 'ALL') {
        where.storeId = storeId.includes(',') ? { in: storeId.split(',') } : storeId;
      }

      ordersToDispatch = await prisma.order.findMany({
        where,
        include: {
          store: {
            include: {
              courierConfig: true,
            },
          },
          items: { include: { product: true } },
        },
      });
    }

    if (ordersToDispatch.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Aucune commande confirmée trouvée prête pour l expédition.',
      });
    }

    const dispatchedResults: any[] = [];
    const manifestItems: any[] = [];

    for (const order of ordersToDispatch) {
      // Resolve courier: Force courier override, or single courier, or city routing rule
      let providerKey = forceCourier || courierProvider;
      if (!providerKey) {
        const resolution = resolveCourierForOrder(order.customerCity, order.store?.currency || 'MAD', currentConfig);
        providerKey = resolution.courier;
      }

      const provider = getCourierProvider(providerKey);
      const courierConfig = order.store.courierConfig.find((c: any) => c.provider === providerKey) || null;
      const productNames = order.items.map((i: any) => `${i.product.name} (x${i.quantity})`).join(', ');

      const shipment = await provider.createShipment(
        {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerCity: order.customerCity,
          customerAddress: order.customerAddress,
          totalCOD: order.totalAmount,
          productName: productNames,
          notes: order.customerNote || undefined,
        },
        courierConfig
      );

      if (shipment.success) {
        const trackingNumber = shipment.trackingNumber;
        const updated = await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'SHIPPED',
            courierProvider: providerKey,
            trackingNumber,
            courierStatus: 'IN_TRANSIT',
            shippedAt: new Date(),
          },
        });

        dispatchedResults.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerCity: order.customerCity,
          courier: providerKey,
          trackingNumber,
        });

        manifestItems.push({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerCity: order.customerCity,
          customerAddress: order.customerAddress,
          trackingNumber,
          courier: providerKey,
          totalAmount: order.totalAmount,
          currency: order.store?.currency || 'MAD',
          items: productNames,
        });
      }
    }

    // Update config with last dispatch stats
    saveShippingWorkflowConfig({
      lastAutoDispatchAt: new Date().toISOString(),
      lastDispatchedCount: dispatchedResults.length,
    });

    // Write audit log
    await logActivity({
      userName: userName || 'Système Auto-Dispatch',
      userRole: 'ADMIN',
      action: 'STATUS_CHANGE',
      entity: 'ORDER',
      details: `Expédition automatique en masse : ${dispatchedResults.length} colis transmis aux transporteurs (Mode: ${currentConfig.mode}).`,
    });

    return NextResponse.json({
      success: true,
      message: `${dispatchedResults.length} commande(s) expédiée(s) et transmise(s) avec succès !`,
      count: dispatchedResults.length,
      mode: currentConfig.mode,
      results: dispatchedResults,
      manifest: manifestItems,
    });
  } catch (error: any) {
    console.error('Shipping Dispatch Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
