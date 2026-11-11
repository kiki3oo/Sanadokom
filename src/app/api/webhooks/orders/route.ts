import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendFacebookConversionEvent } from '@/lib/facebook';
import {
  loadWhatsAppConfig,
  loadWhatsAppLogs,
  saveWhatsAppLogs,
  formatWhatsAppMessage,
  WhatsAppMessageLog,
} from '@/lib/whatsappBot';
import { dispatchOutgoingWebhook } from '@/lib/outgoingWebhooks';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      webhookSecret,
      customerName,
      customerPhone,
      customerCity,
      customerAddress,
      customerNote,
      items,
      totalAmount: rawTotal,
      utmSource,
      utm_source,
      utmCampaign,
      utm_campaign,
      campaign,
      campaign_name,
      campaign_id,
      campaignId,
      utm_campaign_id,
      adSet,
      adset,
      adset_name,
      utm_adset,
      ad_group,
      source,
      channel,
      traffic_source,
    } = body;

    // Resolve UTM & traffic parameters
    const resolvedUtmSource = utmSource || utm_source || null;
    const resolvedUtmCampaign = utmCampaign || utm_campaign || campaign || campaign_name || null;
    const rawCampaignId = campaign_id ?? campaignId ?? utm_campaign_id;
    const metaCampaignId = typeof rawCampaignId === 'string' && /^\d{1,32}$/.test(rawCampaignId.trim())
      ? rawCampaignId.trim()
      : null;
    const resolvedAdSet = adSet || adset || adset_name || utm_adset || ad_group || null;

    let resolvedSource = source || channel || traffic_source || null;

    // Auto-detect and label clean source if missing or from utm_source
    if (!resolvedSource && resolvedUtmSource) {
      const s = resolvedUtmSource.toLowerCase();
      if (s.includes('ig') || s.includes('insta')) resolvedSource = 'Instagram Ads';
      else if (s.includes('fb') || s.includes('face') || s.includes('meta')) resolvedSource = 'Facebook Ads';
      else if (s.includes('tik') || s.includes('tt')) resolvedSource = 'TikTok Ads';
      else if (s.includes('snap')) resolvedSource = 'Snapchat Ads';
      else if (s.includes('goog') || s.includes('gads')) resolvedSource = 'Google Ads';
      else if (s.includes('whats') || s.includes('wa')) resolvedSource = 'WhatsApp Direct';
      else resolvedSource = resolvedUtmSource;
    } else if (!resolvedSource) {
      resolvedSource = 'Landing Page';
    }

    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'webhookSecret is required to authenticate store' },
        { status: 401 }
      );
    }

    // 1. Identify Store
    const store = await prisma.store.findUnique({
      where: { webhookSecret },
      include: { fbSettings: true },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found or invalid webhook secret' }, { status: 404 });
    }

    if (!customerPhone || !customerName) {
      return NextResponse.json(
        { error: 'customerName and customerPhone are required' },
        { status: 400 }
      );
    }

    // Clean phone number (remove spaces, dashes)
    const cleanPhone = customerPhone.replace(/[^0-9+]/g, '');

    // 2. Anti-Duplicate & Upsell Check
    const isUpsellRequest = body.isUpsell === true || body.action === 'upsell';
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    if (isUpsellRequest) {
      const recentOrder = await prisma.order.findFirst({
        where: {
          storeId: store.id,
          customerPhone: cleanPhone,
          createdAt: { gte: twoHoursAgo },
        },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });

      if (recentOrder) {
        let addedAmount = 0;
        let addedCost = 0;
        let upsellProductName = '';

        if (items && Array.isArray(items)) {
          for (const item of items) {
            const qty = Number(item.quantity) || 1;
            const price = Number(item.unitPrice) || 0;
            let product = null;
            if (item.sku) product = await prisma.product.findUnique({ where: { sku: item.sku } });
            if (!product && item.productId) product = await prisma.product.findUnique({ where: { id: item.productId } });
            if (!product && (item.sku || item.productName || item.name)) {
              const skuToUse = item.sku || `SKU-${Date.now().toString(36).toUpperCase()}`;
              product = await prisma.product.findUnique({ where: { sku: skuToUse } });
              if (!product) {
                product = await prisma.product.create({
                  data: {
                    storeId: store.id,
                    sku: skuToUse,
                    name: item.productName || item.name || skuToUse,
                    sellingPrice: price > 0 ? price : 0,
                    costPrice: 0,
                    stockInitial: 500,
                    stockQuantity: 500,
                  },
                });
              }
            }
            if (product) {
              const finalPrice = price > 0 ? price : product.sellingPrice;
              addedAmount += finalPrice * qty;
              addedCost += product.costPrice * qty;
              upsellProductName = product.name;
              await prisma.orderItem.create({
                data: {
                  orderId: recentOrder.id,
                  productId: product.id,
                  quantity: qty,
                  unitPrice: finalPrice,
                  unitCost: product.costPrice,
                },
              });
            }
          }
        }

        const newTotal = rawTotal ? parseFloat(rawTotal) : recentOrder.totalAmount + addedAmount;
        const updated = await prisma.order.update({
          where: { id: recentOrder.id },
          data: {
            totalAmount: newTotal,
            costAmount: recentOrder.costAmount + addedCost,
            upsell: upsellProductName || recentOrder.upsell || 'Upsell en ligne',
            agentNotes: [
              recentOrder.agentNotes,
              `[Upsell accepté en ligne: +${addedAmount} ${store.currency}]`,
            ]
              .filter(Boolean)
              .join(' | '),
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Upsell added to existing order',
          order: updated,
        });
      }
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingRecentOrder = await prisma.order.findFirst({
      where: {
        storeId: store.id,
        customerPhone: cleanPhone,
        createdAt: { gte: twentyFourHoursAgo },
      },
    });

    const isDuplicate = !!existingRecentOrder;

    // 3. Round-Robin Lead Assignment to Active Call Center Agents
    const agents = await prisma.user.findMany({
      where: { role: 'CALL_AGENT', active: true },
      include: {
        _count: {
          select: {
            assignedOrders: {
              where: { status: 'PENDING' },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Filter agents allowed for this specific store (country/niche)
    const eligibleAgents = agents.filter((agent) => {
      if (!agent.permissions) return true;
      try {
        const p = JSON.parse(agent.permissions);
        if (p.assignedStoreIds && Array.isArray(p.assignedStoreIds) && p.assignedStoreIds.length > 0) {
          return p.assignedStoreIds.includes(store.id);
        }
      } catch (e) {}
      return true;
    });

    // Pick agent with least pending orders among eligible agents
    let assignedAgentId = null;
    if (eligibleAgents.length > 0) {
      const sorted = [...eligibleAgents].sort((a, b) => a._count.assignedOrders - b._count.assignedOrders);
      assignedAgentId = sorted[0].id;
    }

    // 4. Calculate Order Total and COGS
    let totalAmount = rawTotal ? parseFloat(rawTotal) : 0;
    let costAmount = 0;
    const orderItemsToCreate: {
      productId: string;
      quantity: number;
      unitPrice: number;
      unitCost: number;
    }[] = [];

    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.unitPrice) || 0;

        let product = null;
        if (item.sku) {
          product = await prisma.product.findUnique({ where: { sku: item.sku } });
        } else if (item.productId) {
          product = await prisma.product.findUnique({ where: { id: item.productId } });
        }

        if (!product && (item.sku || item.productName || item.name)) {
          const skuToUse = item.sku || `SKU-${Date.now().toString(36).toUpperCase()}`;
          const existingBySku = await prisma.product.findUnique({ where: { sku: skuToUse } });
          if (existingBySku) {
            product = existingBySku;
          } else {
            product = await prisma.product.create({
              data: {
                storeId: store.id,
                sku: skuToUse,
                name: item.productName || item.name || skuToUse,
                sellingPrice: price > 0 ? price : 0,
                costPrice: 0,
                stockInitial: 500,
                stockQuantity: 500,
              },
            });
          }
        }

        const finalPrice = price > 0 ? price : (product ? product.sellingPrice : 0);
        const cost = product ? product.costPrice : 0;

        if (product) {
          costAmount += cost * qty;
          if (!rawTotal) {
            totalAmount += finalPrice * qty;
          }

          orderItemsToCreate.push({
            productId: product.id,
            quantity: qty,
            unitPrice: finalPrice,
            unitCost: cost,
          });
        }
      }
    }

    // 5. Generate Order Number
    const count = await prisma.order.count();
    const orderNumber = `ORD-${1000 + count + 1}`;

    // 6. Create Order in Database
    const order = await prisma.order.create({
      data: {
        orderNumber,
        storeId: store.id,
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerCity: customerCity || 'Casablanca',
        customerAddress: customerAddress || '',
        customerNote: customerNote || null,
        status: isDuplicate ? 'DUPLICATE' : 'PENDING',
        assignedAgentId: isDuplicate ? null : assignedAgentId,
        totalAmount,
        costAmount,
        shippingCost: store.currency === 'XOF' ? 2000.0 : 35.0, // Default estimated delivery fee (XOF for Senegal, MAD for Morocco)
        source: resolvedSource,
        metaCampaignId,
        utmCampaign: resolvedUtmCampaign,
        utmSource: resolvedUtmSource,
        adSet: resolvedAdSet,
        agentNotes: isDuplicate ? `Doublon détecté: commande précédente #${existingRecentOrder?.orderNumber}` : null,
        items: {
          create: orderItemsToCreate,
        },
      },
      include: {
        items: {
          include: { product: true },
        },
        assignedAgent: true,
      },
    });

    // 7. Dispatch Facebook CAPI Lead Event if Facebook Pixel & Token configured
    if (store.fbSettings?.pixelId && store.fbSettings?.accessToken) {
      sendFacebookConversionEvent(store.fbSettings.pixelId, store.fbSettings.accessToken, {
        eventName: 'Lead',
        eventId: order.id,
        userData: {
          phone: cleanPhone,
          clientIp: req.headers.get('x-forwarded-for') || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
        },
        customData: {
          currency: store.currency,
          value: totalAmount,
          orderNumber: order.orderNumber,
        },
      }).catch((e) => console.error('Background FB event error:', e));
    }

    // 8. Auto-Queue WhatsApp Confirmation Bot if enabled
    try {
      const waConfig = loadWhatsAppConfig();
      if (waConfig.enabled && !isDuplicate) {
        const isSn = store.currency === 'XOF' || (store.name || '').toLowerCase().includes('senegal');
        const countryKey = isSn ? 'SN' : 'MA';
        const tmpl = waConfig.templates[countryKey] || waConfig.templates.MA;
        const firstProd = order.items?.[0]?.product?.name || order.items?.[0]?.variant || 'Produit';

        const text = formatWhatsAppMessage(tmpl.messageText, {
          customerName: order.customerName,
          productName: firstProd,
          totalAmount: order.totalAmount,
          currency: store.currency,
          customerAddress: order.customerAddress,
          customerCity: order.customerCity,
          orderNumber: order.orderNumber,
        });

        const newLog: WhatsAppMessageLog = {
          id: `wamsg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          orderId: order.id,
          orderNumber: order.orderNumber,
          storeId: order.storeId,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          country: isSn ? 'Sénégal' : 'Maroc',
          messageText: text,
          status: 'SENT',
          sentAt: new Date().toISOString(),
          respondedAt: null,
          responseAction: null,
          upsellOffered: false,
          upsellAccepted: false,
        };

        const logs = loadWhatsAppLogs();
        saveWhatsAppLogs([newLog, ...logs]);
      }
    } catch (waErr) {
      console.error('WhatsApp Bot Auto-queue error:', waErr);
    }

    // 9. Dispatch Outgoing Webhook (n8n node / automation workflows)
    dispatchOutgoingWebhook('order.created', order, store).catch((e) =>
      console.error('Outgoing webhook dispatch error:', e)
    );

    return NextResponse.json({
      success: true,
      message: isDuplicate ? 'Lead received (Flagged as Duplicate)' : 'Lead created successfully',
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        customerName: order.customerName,
        totalAmount: order.totalAmount,
        assignedAgent: order.assignedAgent?.name || 'Unassigned',
      },
    });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
