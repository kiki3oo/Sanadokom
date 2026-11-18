import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCourierProvider } from '@/lib/couriers';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

function normalizeCity(city: string | null | undefined): string {
  if (!city) return '';
  return city
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');
    const targetOrderId = searchParams.get('targetOrderId');

    const whereTarget: any = {
      status: 'CONFIRMED',
      trackingNumber: null,
    };
    if (storeId && storeId !== 'ALL') {
      whereTarget.storeId = storeId.includes(',') ? { in: storeId.split(',') } : storeId;
    }
    if (targetOrderId) {
      whereTarget.id = targetOrderId;
    }

    const confirmedOrders = await prisma.order.findMany({
      where: whereTarget,
      include: {
        store: { select: { id: true, name: true, currency: true } },
        items: {
          include: { product: { select: { id: true, name: true, sku: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const whereSource: any = {
      trackingNumber: { not: null },
      subStatus: { not: 'REASSIGNE_SUR_PLACE' },
      OR: [
        { status: { in: ['CANCELLED', 'REFUSED', 'NO_ANSWER', 'RETURNED'] } },
        { subStatus: { contains: 'ANNUL' } },
        { subStatus: { contains: 'REFUS' } },
        { subStatus: { contains: 'RETOUR' } },
      ],
    };
    if (storeId && storeId !== 'ALL') {
      whereSource.storeId = storeId.includes(',') ? { in: storeId.split(',') } : storeId;
    }

    const canceledInFieldOrders = await prisma.order.findMany({
      where: whereSource,
      include: {
        store: { select: { id: true, name: true, currency: true } },
        items: {
          include: { product: { select: { id: true, name: true, sku: true } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 150,
    });

    // Match by Normalized City and at least one matching Product SKU
    const matches: Array<{
      targetOrder: any;
      candidateSources: Array<{
        sourceOrder: any;
        estimatedSavings: number;
        cityMatch: string;
      }>;
    }> = [];

    for (const target of confirmedOrders) {
      const targetCityNorm = normalizeCity(target.customerCity);
      const targetProductIds = target.items.map((it) => it.productId);

      const matchingSources = canceledInFieldOrders.filter((source) => {
        if (source.id === target.id) return false;
        if (source.storeId !== target.storeId) return false;

        const sourceCityNorm = normalizeCity(source.customerCity);
        const cityMatches =
          targetCityNorm &&
          sourceCityNorm &&
          (targetCityNorm.includes(sourceCityNorm) || sourceCityNorm.includes(targetCityNorm));

        if (!cityMatches) return false;

        // Check product match
        const sourceProductIds = source.items.map((it) => it.productId);
        const hasMatchingProduct = targetProductIds.some((id) => sourceProductIds.includes(id));
        return hasMatchingProduct;
      });

      if (matchingSources.length > 0) {
        matches.push({
          targetOrder: target,
          candidateSources: matchingSources.map((source) => ({
            sourceOrder: source,
            estimatedSavings: (source.shippingCost || 35.0) + 25.0, // shipping saved + return penalty avoided
            cityMatch: target.customerCity,
          })),
        });
      }
    }

    const totalMatchesCount = matches.length;
    const totalPotentialSavings = matches.reduce((acc, m) => {
      const topSavings = m.candidateSources[0]?.estimatedSavings || 60;
      return acc + topSavings;
    }, 0);

    return NextResponse.json({
      success: true,
      matches,
      totalMatchesCount,
      totalPotentialSavings,
      availableCanceledInFieldCount: canceledInFieldOrders.length,
    });
  } catch (error: any) {
    console.error('Error fetching on-site swap matches:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetOrderId, sourceOrderId, courierDriverPhone, customNotes, userId, userName } = body;

    if (!targetOrderId || !sourceOrderId) {
      return NextResponse.json(
        { success: false, error: 'targetOrderId et sourceOrderId sont obligatoires' },
        { status: 400 }
      );
    }

    const [targetOrder, sourceOrder] = await Promise.all([
      prisma.order.findUnique({
        where: { id: targetOrderId },
        include: {
          store: true,
          items: { include: { product: true } },
        },
      }),
      prisma.order.findUnique({
        where: { id: sourceOrderId },
        include: {
          store: true,
          items: { include: { product: true } },
        },
      }),
    ]);

    if (!targetOrder || !sourceOrder) {
      return NextResponse.json(
        { success: false, error: 'Une ou plusieurs commandes introuvables' },
        { status: 404 }
      );
    }

    if (!sourceOrder.trackingNumber) {
      return NextResponse.json(
        { success: false, error: 'La commande source ne possède aucun numéro de suivi transporteur' },
        { status: 400 }
      );
    }

    // Courier API dispatch if available
    let apiHandled = false;
    let apiMessage = '';
    const courierProviderName = sourceOrder.courierProvider || 'MANUAL';
    const provider = getCourierProvider(courierProviderName);

    // Look up courier config
    let courierConfig: any = null;
    try {
      courierConfig = await prisma.courierConfig.findFirst({
        where: {
          storeId: targetOrder.storeId,
          provider: courierProviderName,
        },
      });
    } catch (e) {}

    if (provider.changeRecipient) {
      try {
        const changeRes = await provider.changeRecipient(
          {
            trackingNumber: sourceOrder.trackingNumber,
            orderNumber: targetOrder.orderNumber,
            customerName: targetOrder.customerName,
            customerPhone: targetOrder.customerPhone,
            customerCity: targetOrder.customerCity,
            customerAddress: targetOrder.customerAddress,
            totalCOD: targetOrder.totalAmount,
            notes: customNotes || `Changement de destinataire sur place (Sanadokom #${targetOrder.orderNumber})`,
          },
          courierConfig
        );
        apiHandled = changeRes.apiHandled;
        apiMessage = changeRes.message || '';
      } catch (err: any) {
        console.error('Error calling courier changeRecipient API:', err);
      }
    }

    const now = new Date();
    const savedShippingAmount = (sourceOrder.shippingCost || 35.0) + 25.0; // 60-70 DH saved

    // Update target and source order in transaction
    const [updatedTarget, updatedSource] = await prisma.$transaction([
      // 1. Target Order gets the tracking, IN_TRANSIT status, and shippingCost: 0
      prisma.order.update({
        where: { id: targetOrder.id },
        data: {
          trackingNumber: sourceOrder.trackingNumber,
          courierProvider: sourceOrder.courierProvider,
          status: 'IN_TRANSIT',
          courierStatus: 'IN_TRANSIT',
          shippingCost: 0.0, // Saved shipping fee!
          agentNotes: targetOrder.agentNotes
            ? `${targetOrder.agentNotes}\n[🔄 تغيير المستلم على المكان]: تم استخدام الكولي #${sourceOrder.orderNumber} (Tracking: ${sourceOrder.trackingNumber}) المتواجد مسبقاً فـ ${sourceOrder.customerCity} - توفير ${savedShippingAmount} درهم (${now.toLocaleTimeString('fr-FR')})`
            : `[🔄 تغيير المستلم على المكان]: تم استخدام الكولي #${sourceOrder.orderNumber} (Tracking: ${sourceOrder.trackingNumber}) المتواجد مسبقاً فـ ${sourceOrder.customerCity} - توفير ${savedShippingAmount} درهم (${now.toLocaleTimeString('fr-FR')})`,
        },
      }),

      // 2. Source Order is closed as REASSIGNE_SUR_PLACE
      prisma.order.update({
        where: { id: sourceOrder.id },
        data: {
          status: 'CANCELLED',
          subStatus: 'REASSIGNE_SUR_PLACE',
          agentNotes: sourceOrder.agentNotes
            ? `${sourceOrder.agentNotes}\n[🔄 تم تحويل الكولية على المكان للطلب الجديد #${targetOrder.orderNumber} (${targetOrder.customerName} - ${targetOrder.customerCity})]: تجنبنا الروتور بنجاح!`
            : `[🔄 تم تحويل الكولية على المكان للطلب الجديد #${targetOrder.orderNumber} (${targetOrder.customerName} - ${targetOrder.customerCity})]: تجنبنا الروتور بنجاح!`,
        },
      }),
    ]);

    // Build pre-filled WhatsApp Message for Agency / Driver
    const cleanPhone = (courierDriverPhone || '').replace(/[^0-9]/g, '');
    const tracking = sourceOrder.trackingNumber;
    const oldClient = sourceOrder.customerName;
    const newClient = targetOrder.customerName;
    const newPhone = targetOrder.customerPhone;
    const newCity = targetOrder.customerCity;
    const newAddress = targetOrder.customerAddress;
    const newAmount = targetOrder.totalAmount;
    const curr = targetOrder.store?.currency || 'DH';
    const prodName = targetOrder.items?.[0]?.product?.name || 'المنتج';

    const whatsappMessage = `السلام عليكم خويا الموزع / شاف داجونس (${courierProviderName}) 🛵،
بخصوص الكولي رقم: *#${tracking}* اللي كان ملغي عند الزبون السابق (${oldClient}):
بغيت نديرو ليه *تغيير المستلم (Changement de Destinataire)* لزبون جديد متواجد فـ *${newCity}* باش يتسلم اليوم:

👤 *الزبون الجديد:* ${newClient}
📞 *الهاتف:* ${newPhone}
📍 *العنوان:* ${newAddress}
📦 *المنتج:* ${prodName}
💵 *المبلغ المطلوب تحصيله:* ${newAmount} ${curr}

المرجو تأكيد التحويل عندكم فالسيستيم وتسليم الكولي اليوم. شكراً بزاف على تعاونكم! 🙏`;

    const whatsappUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

    await logActivity({
      userId: userId || null,
      userName: userName || 'Agent Logistique',
      action: 'ORDER_EDIT',
      entity: 'ORDER',
      orderId: targetOrder.id,
      storeId: targetOrder.storeId,
      details: `[Changement de Destinataire sur Place]: الكولية #${sourceOrder.trackingNumber} تحولت من الطلب #${sourceOrder.orderNumber} للطلب #${targetOrder.orderNumber} فـ ${targetOrder.customerCity} (توفير ${savedShippingAmount} DH)`,
    });

    return NextResponse.json({
      success: true,
      apiHandled,
      apiMessage: apiMessage || (apiHandled ? 'Validé automatiquement par API' : 'Prêt pour confirmation WhatsApp'),
      whatsappMessage,
      whatsappUrl,
      savedShippingAmount,
      targetOrder: updatedTarget,
      sourceOrder: updatedSource,
    });
  } catch (error: any) {
    console.error('Error reassigning order on site:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
