import { queueDeliveryEvent, trySendDeliveryEvent } from '@/lib/facebook/deliveryEvents';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  loadWhatsAppConfig,
  loadWhatsAppLogs,
  saveWhatsAppLogs,
  formatWhatsAppMessage,
} from '@/lib/whatsappBot';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, action, newAddress, newCity } = body;

    if (!orderId || !action) {
      return NextResponse.json(
        { success: false, error: 'orderId et action requis' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: true,
        items: { include: { product: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Commande introuvable' }, { status: 404 });
    }

    const config = loadWhatsAppConfig();
    const isSenegal =
      order.store?.currency === 'XOF' ||
      (order.store?.name || '').toLowerCase().includes('senegal') ||
      (order.store?.slug || '').toLowerCase().includes('sn');
    const countryKey = isSenegal ? 'SN' : 'MA';
    const template = config.templates[countryKey] || config.templates.MA;

    const logs = loadWhatsAppLogs();
    const logIndex = logs.findIndex((l) => l.orderId === order.id);

    let replyMessage = '';
    let showUpsell = false;

    if (action === 'CONFIRM') {
      // 1. Stock deduction if not already confirmed
      if (order.status !== 'CONFIRMED') {
        for (const item of order.items) {
          if (item.product && item.product.stockQuantity >= item.quantity) {
            const prev = item.product.stockQuantity;
            const next = Math.max(0, prev - item.quantity);
            await prisma.product.update({
              where: { id: item.productId },
              data: { stockQuantity: next },
            });
            await prisma.stockMovement.create({
              data: {
                productId: item.productId,
                type: 'SALE',
                quantity: -item.quantity,
                previousStock: prev,
                newStock: next,
                reference: order.orderNumber,
                notes: 'Déduction stock automatique suite à confirmation WhatsApp Bot',
              },
            });
          }
        }
      }

      // 2. Confirm the order
      const { updatedOrder, queued } = await prisma.$transaction(async tx => {
        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'CONFIRMED',
            subStatus: 'CONFIRME_WHATSAPP_BOT',
            agentNotes: `[🤖 WhatsApp Bot] الطلبية تم تأكيدها تلقائياً عبر واتساب بنجاح (${new Date().toLocaleTimeString('fr-FR')})`,
          },
        });
        const queued = order.status !== 'CONFIRMED' && await queueDeliveryEvent(tx, updatedOrder, 'OrderConfirmed');
        return { updatedOrder, queued };
      });
      if (queued) await trySendDeliveryEvent(order.id, 'OrderConfirmed');

      replyMessage = formatWhatsAppMessage(template.confirmedReply, {
        customerName: order.customerName,
        productName: order.items?.[0]?.product?.name || 'Produit',
        totalAmount: order.totalAmount,
        currency: order.store?.currency || 'MAD',
        customerAddress: order.customerAddress,
        customerCity: order.customerCity,
        orderNumber: order.orderNumber,
      });

      if (config.upsellEnabled) {
        showUpsell = true;
      }

      // Update log
      if (logIndex !== -1) {
        logs[logIndex].status = 'CONFIRMED';
        logs[logIndex].respondedAt = new Date().toISOString();
        logs[logIndex].responseAction = 'CONFIRM';
        logs[logIndex].upsellOffered = config.upsellEnabled;
      }

      await logActivity({
        userName: 'WhatsApp Bot 🤖',
        userRole: 'SYSTEM_BOT',
        action: 'STATUS_CHANGE',
        entity: 'ORDER',
        entityId: order.id,
        orderId: order.id,
        storeId: order.storeId,
        details: `Confirmation automatique WhatsApp par le client pour la commande #${order.orderNumber} (Prêt pour expédition)`,
      });

      saveWhatsAppLogs(logs);

      return NextResponse.json({
        success: true,
        order: updatedOrder,
        replyMessage,
        showUpsell,
        upsellMessage: showUpsell
          ? formatWhatsAppMessage(template.upsellOffer, {
              customerName: order.customerName,
              productName: order.items?.[0]?.product?.name || 'Produit',
              totalAmount: order.totalAmount,
              currency: order.store?.currency || 'MAD',
              customerAddress: order.customerAddress,
              customerCity: order.customerCity,
              orderNumber: order.orderNumber,
            })
          : null,
      });
    }

    if (action === 'CANCEL') {
      // 1. If previously confirmed, restore warehouse stock
      if (order.status === 'CONFIRMED') {
        for (const item of order.items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { increment: item.quantity } },
          });

          const prod = await prisma.product.findUnique({ where: { id: item.productId } });
          await prisma.stockMovement.create({
            data: {
              productId: item.productId,
              type: 'RETURN',
              quantity: item.quantity,
              previousStock: (prod?.stockQuantity || 0) - item.quantity,
              newStock: prod?.stockQuantity || 0,
              reference: order.orderNumber,
              notes: 'Restock automatique : Annulation de commande via WhatsApp Bot',
            },
          });
        }
      }

      // 2. Cancel the order
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          subStatus: 'ANNULE_WHATSAPP_BOT',
          agentNotes: `[🤖 WhatsApp Bot] العميل قام بإلغاء الطلبية عبر واتساب.`,
        },
      });

      replyMessage = formatWhatsAppMessage(template.cancelledReply, {
        customerName: order.customerName,
        productName: order.items?.[0]?.product?.name || 'Produit',
        totalAmount: order.totalAmount,
        currency: order.store?.currency || 'MAD',
        customerAddress: order.customerAddress,
        customerCity: order.customerCity,
        orderNumber: order.orderNumber,
      });

      if (logIndex !== -1) {
        logs[logIndex].status = 'CANCELLED';
        logs[logIndex].respondedAt = new Date().toISOString();
        logs[logIndex].responseAction = 'CANCEL';
      }

      await logActivity({
        userName: 'WhatsApp Bot 🤖',
        userRole: 'SYSTEM_BOT',
        action: 'STATUS_CHANGE',
        entity: 'ORDER',
        entityId: order.id,
        orderId: order.id,
        storeId: order.storeId,
        details: `Annulation automatique WhatsApp par le client pour la commande #${order.orderNumber} (Économie frais transport)`,
      });

      saveWhatsAppLogs(logs);

      return NextResponse.json({
        success: true,
        order: updatedOrder,
        replyMessage,
      });
    }

    if (action === 'MODIFY') {
      // 3. Customer requests address / size modification
      const dataToUpdate: any = {
        subStatus: 'MODIFICATION_DEMANDEE',
        agentNotes: `[🤖 WhatsApp Bot] طلب تعديل: ${newAddress || ''} ${newCity || ''}`,
      };
      if (newAddress) dataToUpdate.customerAddress = newAddress;
      if (newCity) dataToUpdate.customerCity = newCity;

      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: dataToUpdate,
      });

      replyMessage = isSenegal
        ? `Parfait ! Votre adresse a été mise à jour : ${newAddress || order.customerAddress} (${newCity || order.customerCity}). Votre commande est transmise au service d'expédition.`
        : `واخا أ سيدي ${order.customerName}، تم تعديل العنوان ديالك بنجاح (${newAddress || order.customerAddress} - ${newCity || order.customerCity}) وغاتخرج الكولية ديالك فـ أقرب وقت!`;

      if (logIndex !== -1) {
        logs[logIndex].status = 'MODIFICATION_REQUESTED';
        logs[logIndex].respondedAt = new Date().toISOString();
        logs[logIndex].responseAction = 'MODIFY';
      }

      saveWhatsAppLogs(logs);

      return NextResponse.json({
        success: true,
        order: updatedOrder,
        replyMessage,
      });
    }

    if (action === 'UPSELL_YES') {
      // 4. Customer accepts UpSell
      const discount = config.upsellDiscountPercent || 50;
      const additionalAmount = Math.round(order.totalAmount * (1 - discount / 100));
      const newTotal = order.totalAmount + additionalAmount;

      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          totalAmount: newTotal,
          upsell: `Pack Double VIP (+1 Pièce à -${discount}%)`,
          agentNotes: `${order.agentNotes || ''}\n[🤖 UpSell WhatsApp Bot] العميل وافق على الحبة الثانية بـ -${discount}% (+${additionalAmount} ${order.store?.currency || 'MAD'})`,
        },
      });

      replyMessage = isSenegal
        ? `Magnifique ! Le 2ème article à -${discount}% a été ajouté à votre colis. Nouveau total : ${newTotal} ${order.store?.currency || 'XOF'}. Merci pour votre confiance !`
        : `رائع جداً أ سيدي ${order.customerName}! 🎉 تمت إضافة الحبة الثانية بـ -${discount}% للطلبية ديالك بنجاح. المجموع الجديد: ${newTotal} ${order.store?.currency || 'MAD'}. شكراً ليك بزاف!`;

      if (logIndex !== -1) {
        logs[logIndex].upsellAccepted = true;
      }

      await logActivity({
        userName: 'WhatsApp Bot 🤖',
        userRole: 'SYSTEM_BOT',
        action: 'ORDER_EDIT',
        entity: 'ORDER',
        entityId: order.id,
        orderId: order.id,
        storeId: order.storeId,
        details: `UpSell WhatsApp accepté par le client: 2ème pièce à -${discount}% (+${additionalAmount} ${order.store?.currency || 'MAD'})`,
      });

      saveWhatsAppLogs(logs);

      return NextResponse.json({
        success: true,
        order: updatedOrder,
        replyMessage,
      });
    }

    if (action === 'UPSELL_NO') {
      replyMessage = isSenegal
        ? `Bien noté ! Votre commande #{orderNumber} sera expédiée avec 1 seul article. À très bientôt !`
        : `واخا أ سيدي ${order.customerName}، غادي نصيفطو ليك الحبة الأولى كما طلبتي. شكراً ليك ونهار مبروك!`;

      return NextResponse.json({
        success: true,
        replyMessage: replyMessage.replace(/{orderNumber}/g, order.orderNumber),
      });
    }

    return NextResponse.json({ success: false, error: 'Action inconnue' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing WhatsApp webhook:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
