import crypto from 'crypto';

export interface FacebookEventPayload {
  eventName: 'Lead' | 'Purchase';
  eventId: string;
  sourceUrl?: string;
  userData: {
    phone?: string;
    clientIp?: string;
    userAgent?: string;
    fbp?: string;
    fbc?: string;
  };
  customData?: {
    currency?: string;
    value?: number;
    orderNumber?: string;
  };
}

function sha256(val: string): string {
  return crypto.createHash('sha256').update(val.trim().toLowerCase()).digest('hex');
}

export async function sendFacebookConversionEvent(
  pixelId: string,
  accessToken: string,
  payload: FacebookEventPayload
) {
  try {
    const hashedPhone = payload.userData.phone
      ? sha256(payload.userData.phone.replace(/[^0-9]/g, ''))
      : undefined;

    const eventData = {
      event_name: payload.eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: payload.eventId,
      event_source_url: payload.sourceUrl || 'https://codsaas.local',
      action_source: 'website',
      user_data: {
        ph: hashedPhone ? [hashedPhone] : undefined,
        client_ip_address: payload.userData.clientIp,
        client_user_agent: payload.userData.userAgent,
        fbp: payload.userData.fbp,
        fbc: payload.userData.fbc,
      },
      custom_data: payload.customData
        ? {
            currency: payload.customData.currency || 'MAD',
            value: payload.customData.value || 0,
            order_id: payload.customData.orderNumber,
          }
        : undefined,
    };

    const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [eventData] }),
    });

    const result = await response.json();
    return { success: response.ok, result };
  } catch (error: any) {
    console.error('FB CAPI Error:', error);
    return { success: false, error: error.message };
  }
}
