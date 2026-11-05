import { NextRequest, NextResponse } from 'next/server';
import { loadWhatsAppConfig, saveWhatsAppConfig, loadWhatsAppLogs, WhatsAppBotConfig } from '@/lib/whatsappBot';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');
    const country = searchParams.get('country');

    const config = loadWhatsAppConfig();
    let logs = loadWhatsAppLogs();

    if (storeId && storeId !== 'ALL') {
      const allowedStores = storeId.split(',').map((s) => s.trim()).filter(Boolean);
      logs = logs.filter((l) => !l.storeId || allowedStores.includes(l.storeId));
    } else if (country) {
      const countryTarget = country === 'SN' ? 'Sénégal' : 'Maroc';
      logs = logs.filter((l) => l.country === countryTarget);
    }

    const totalSent = logs.length;
    const confirmed = logs.filter((l) => l.status === 'CONFIRMED').length;
    const cancelled = logs.filter((l) => l.status === 'CANCELLED').length;
    const modificationReq = logs.filter((l) => l.status === 'MODIFICATION_REQUESTED').length;
    const upsellCount = logs.filter((l) => l.upsellAccepted).length;

    const confirmationRate = totalSent > 0 ? Math.round((confirmed / totalSent) * 100) : 0;
    const cancellationRate = totalSent > 0 ? Math.round((cancelled / totalSent) * 100) : 0;

    return NextResponse.json({
      success: true,
      config,
      stats: {
        totalSent,
        confirmed,
        cancelled,
        modificationReq,
        upsellCount,
        confirmationRate,
        cancellationRate,
      },
      logs: logs.slice(0, 50),
    });
  } catch (error: any) {
    console.error('Error fetching WhatsApp bot config:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: WhatsAppBotConfig = await req.json();
    saveWhatsAppConfig(body);
    return NextResponse.json({ success: true, message: 'Configuration WhatsApp enregistrée avec succès' });
  } catch (error: any) {
    console.error('Error saving WhatsApp bot config:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
