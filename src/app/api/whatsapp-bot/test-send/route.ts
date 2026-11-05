import { NextRequest, NextResponse } from 'next/server';
import {
  loadWhatsAppConfig,
  sendActualWhatsAppMessage,
} from '@/lib/whatsappBot';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { phone, message } = await req.json();

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Numéro de téléphone requis' }, { status: 400 });
    }

    const config = loadWhatsAppConfig();

    if (config.provider === 'SIMULATOR_TEST') {
      return NextResponse.json({
        success: false,
        isSimulatorNotice: true,
        error:
          "Vous êtes actuellement en mode 'Simulateur Interne'. Les messages sont uniquement affichés dans le téléphone virtuel à l'écran (onglet Simulateur). Pour envoyer des vrais messages vers votre téléphone WhatsApp physique, choisissez un fournisseur comme GreenAPI (Scan QR Code) ou Meta Cloud API.",
      });
    }

    const testMessage =
      message ||
      `👋 Test WhatsApp réussi depuis votre plateforme COD SaaS !\nDate: ${new Date().toLocaleString('fr-FR')}\nVotre bot est prêt et opérationnel.`;

    const res = await sendActualWhatsAppMessage(phone, testMessage, config);

    if (res.success) {
      return NextResponse.json({
        success: true,
        message: `Message de test envoyé avec succès à ${phone} via ${config.provider} !`,
        providerResponse: res.providerResponse,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: res.error || "Échec de l'envoi via l'API",
          providerResponse: res.providerResponse,
        },
        { status: 400 }
      );
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
