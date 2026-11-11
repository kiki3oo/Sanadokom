export interface CodInputs {
  wholesalePrice: number;
  retailPrice: number;
  shippingFee?: number;
  estConfirmationRate?: number;
  estDeliveryRate?: number;
  packagingFee?: number;
  failedDeliveryFee?: number;
  paymentFee?: number;
  leadHandlingFee?: number;
  adCostPerLead?: number;
}

export const codFees = [
  'packagingFee', 'failedDeliveryFee', 'paymentFee', 'leadHandlingFee', 'adCostPerLead',
] as const;

export function validCodInputs(input: CodInputs) {
  return typeof input.retailPrice === 'number' && input.retailPrice > 0 &&
    typeof input.wholesalePrice === 'number' &&
    ['wholesalePrice', 'retailPrice', 'shippingFee', 'estConfirmationRate', 'estDeliveryRate', ...codFees].every((key) => {
      const value = input[key as keyof CodInputs];
      return value === undefined || (typeof value === 'number' && Number.isFinite(value) && value >= 0 &&
        value <= (key.endsWith('Rate') ? 100 : 1e9));
    });
}

export function calculateCod(input: CodInputs) {
  const { wholesalePrice, retailPrice } = input;
  const confirmationRate = input.estConfirmationRate ?? 0;
  const deliveryRate = input.estDeliveryRate ?? 0;
  const shipping = input.shippingFee ?? 0;
  const confirmed = confirmationRate / 100;
  const delivered = confirmed * deliveryRate / 100;
  const failed = confirmed - delivered;
  const revenue = delivered * retailPrice;
  const costs = delivered * (wholesalePrice + (input.paymentFee ?? 0)) +
    confirmed * (shipping + (input.packagingFee ?? 0)) +
    failed * (input.failedDeliveryFee ?? 0) + (input.leadHandlingFee ?? 0);
  const contribution = revenue - costs;
  const floorCents = (value: number) => {
    const cents = Math.max(0, value) * 100;
    return Math.floor(cents + Number.EPSILON * cents * 8) / 100;
  };
  const targetCpaMin = floorCents(contribution * 0.42);
  const targetCpaMax = floorCents(contribution * 0.65);
  const assumedCpa = input.adCostPerLead ?? targetCpaMax;
  const profit = contribution - assumedCpa;
  const round = (value: number) => Number(value.toFixed(2));

  return {
    wholesalePrice,
    retailPrice,
    grossMargin: round(retailPrice - wholesalePrice),
    estShippingFee: shipping,
    estConfirmationRate: confirmationRate,
    estDeliveryRate: deliveryRate,
    breakEvenCpa: floorCents(contribution),
    targetCpaMin,
    targetCpaMax,
    assumedCpa,
    deliveredPer100: round(delivered * 100),
    failedPer100: round(failed * 100),
    revenuePer100: round(revenue * 100),
    nonAdCostPer100: round(costs * 100),
    adSpendPer100: round(assumedCpa * 100),
    netProfitPerDelivered: delivered > 0 ? round(profit / delivered) : null,
    expectedNetProfitPer100Leads: round(profit * 100),
    roasTarget: assumedCpa > 0 ? round(revenue / assumedCpa) : null,
  };
}
