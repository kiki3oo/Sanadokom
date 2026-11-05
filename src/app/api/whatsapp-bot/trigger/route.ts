import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  loadWhatsAppConfig,
  loadWhatsAppLogs,
  saveWhatsAppLogs,
  formatWhatsAppMessage,
  sendActualWhatsAppMessage,
  WhatsAppMessageLog,
} from '@/lib/whatsappBot';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId requis' }, { status: 400 });
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

    const firstProduct = order.items?.[0]?.product?.name || order.items?.[0]?.variant || 'Produit';

    const formattedMessage = formatWhatsAppMessage(template.messageText, {
      customerName: order.customerName,
      productName: firstProduct,
      totalAmount: order.totalAmount,
      currency: order.store?.currency || (isSenegal ? 'XOF' : 'MAD'),
      customerAddress: order.customerAddress,
      customerCity: order.customerCity,
      orderNumber: order.orderNumber,
    });

    // Send real message if live provider is configured
    const sendResult = await sendActualWhatsAppMessage(order.customerPhone, formattedMessage, config);

    // Create log entry
    const newLog: WhatsAppMessageLog = {
      id: `wamsg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      storeId: order.storeId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      country: isSenegal ? 'Sénégal' : 'Maroc',
      messageText: formattedMessage,
      status: sendResult.success ? 'SENT' : 'FAILED',
      sentAt: new Date().toISOString(),
      respondedAt: null,
      responseAction: null,
      upsellOffered: false,
      upsellAccepted: false,
    };

    const logs = loadWhatsAppLogs();
    // Remove previous pending log for this order if any
    const updatedLogs = [newLog, ...logs.filter((l) => l.orderId !== order.id)];
    saveWhatsAppLogs(updatedLogs);

    // Audit log
    await logActivity({
      userName: 'WhatsApp Bot 🤖',
      userRole: 'SYSTEM_BOT',
      action: 'STATUS_CHANGE',
      entity: 'ORDER',
      entityId: order.id,
      orderId: order.id,
      storeId: order.storeId,
      details: `Envoi automatique du message WhatsApp de confirmation à ${order.customerPhone} (${order.customerName})`,
    });

    return NextResponse.json({
      success: true,
      message: 'Message WhatsApp envoyé avec succès',
      log: newLog,
      buttons: [
        { id: 'CONFIRM', label: template.btnConfirm },
        { id: 'CANCEL', label: template.btnCancel },
        { id: 'MODIFY', label: template.btnModify },
      ],
    });
  } catch (error: any) {
    console.error('Error triggering WhatsApp confirmation:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
