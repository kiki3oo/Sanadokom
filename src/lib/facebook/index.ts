import crypto from 'crypto';

export interface FacebookEventPayload {
  eventName: 'Lead' | 'Purchase' | 'OrderConfirmed';
  eventId: string;
  sourceUrl?: string;
  eventTime?: Date;
  actionSource?: 'website' | 'phone_call' | 'other';
  userData: {
    phone?: string;
    country?: string;
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
    const country = payload.userData.country;
    const dialCode = country === 'MA' ? '212' : country === 'SN' ? '221' : null;
    let phone = payload.userData.phone?.replace(/[^0-9]/g, '').replace(/^00/, '');
    if (phone && dialCode && phone.replace(/^0/, '').length === 9) phone = dialCode + phone.replace(/^0/, '');
    const hashedPhone = phone ? sha256(phone) : undefined;

    const eventData = {
      event_name: payload.eventName,
      event_time: Math.floor((payload.eventTime?.getTime() ?? Date.now()) / 1000),
      event_id: payload.eventId,
      event_source_url: payload.sourceUrl,
      action_source: payload.actionSource ?? (payload.sourceUrl ? 'website' : 'other'),
      user_data: {
        country: country ? [sha256(country)] : undefined,
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

    const url = `https://graph.facebook.com/v26.0/${encodeURIComponent(pixelId)}/events`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      redirect: 'error',
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({ data: [eventData] }),
    });

    const result = await response.json();
    if (response.ok && result.events_received === 1) return { success: true };
    const code = Number(result?.error?.code);
    return { success: false, error: Number.isInteger(code) ? `Meta a refusé l’événement (code ${code}).` : 'Meta n’a pas accepté l’événement.' };
  } catch {
    return { success: false, error: 'Impossible de joindre Meta.' };
  }
}
