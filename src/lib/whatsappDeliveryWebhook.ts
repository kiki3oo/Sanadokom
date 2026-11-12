const followedIncidents = new Set([
  'LIVREUR_NE_REPOND_PAS',
  'NE_REPOND_PAS',
  'LIVREUR_INJOIGNABLE',
  'INJOIGNABLE',
  'CLIENT_INJOIGNABLE',
  'PAS_DE_REPONSE',
  'LIVREUR_REPORTE',
  'REPORTE',
]);

type DeliveryOrder = {
  id: string;
  storeId: string;
  status: string;
  subStatus: string | null;
};

export async function notifyWhatsAppDelivery(current: DeliveryOrder, previous: DeliveryOrder) {
  const url = process.env.WHATSAPP_DELIVERY_WEBHOOK_URL;
  const secret = process.env.WHATSAPP_DELIVERY_WEBHOOK_SECRET;
  if (!url || !secret || current.storeId !== process.env.WHATSAPP_DELIVERY_STORE_ID) return;

  const terminalStatusChanged = current.status !== previous.status &&
    (current.status === 'DELIVERED' || current.status === 'CANCELLED');
  const incidentChanged = Boolean(current.subStatus && followedIncidents.has(current.subStatus) &&
    current.subStatus !== previous.subStatus &&
    ['SHIPPED', 'IN_TRANSIT'].includes(current.status));

  if (!terminalStatusChanged && !incidentChanged) return;

  const response = await fetch(url, {
    method: 'POST',
    redirect: 'error',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
    signal: AbortSignal.timeout(8000),
    body: JSON.stringify({
      event: 'order.delivery_status_changed',
      order: { id: current.id, status: current.status, subStatus: current.subStatus },
    }),
  });
  if (!response.ok) throw new Error(`WhatsApp delivery webhook returned HTTP ${response.status}`);
}
