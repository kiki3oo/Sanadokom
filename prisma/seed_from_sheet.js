const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SaaS database with OptiTrav Sheet structure...');

  // 1. Store: BoomBuy (from Sheet) + Moroccan Glow
  const storeBoomBuy = await prisma.store.upsert({
    where: { slug: 'boombuy' },
    update: {},
    create: {
      name: 'BoomBuy',
      slug: 'boombuy',
      currency: 'MAD',
      webhookSecret: 'whsec_boombuy_optitrav_77192',
    },
  });

  // 2. Agents / Confirmers (Meryem & Fatima from Sheet)
  const agentMeryem = await prisma.user.upsert({
    where: { email: 'meryem@boombuy.com' },
    update: {},
    create: {
      name: 'Meryem',
      email: 'meryem@boombuy.com',
      passwordHash: 'meryem123',
      role: 'CALL_AGENT',
      commissionFee: 10.0,
      active: true,
    },
  });

  const agentFatima = await prisma.user.upsert({
    where: { email: 'fatima@boombuy.com' },
    update: {},
    create: {
      name: 'Fatima',
      email: 'fatima@boombuy.com',
      passwordHash: 'fatima123',
      role: 'CALL_AGENT',
      commissionFee: 15.0,
      active: true,
    },
  });

  // 3. Products from Sheet
  const products = [
    {
      sku: 'LAMPE-MA-2',
      name: 'Lampe MA 2',
      costPrice: 65.0,
      packagingFee: 5.0,
      sellingPrice: 289.0,
      stockInitial: 50,
      stockQuantity: 44,
      reservedQuantity: 4,
      quantitySold: 2,
      alertThreshold: 10,
    },
    {
      sku: 'CAMILIA-KERATIN',
      name: 'Camilia Pack Keratin',
      costPrice: 48.0,
      packagingFee: 6.0,
      sellingPrice: 249.0,
      stockInitial: 46,
      stockQuantity: 46,
      reservedQuantity: 0,
      quantitySold: 0,
      alertThreshold: 10,
    },
    {
      sku: 'PACK-BIG-SIZE',
      name: 'Pack Big Size MA',
      costPrice: 22.0,
      packagingFee: 4.0,
      sellingPrice: 199.0,
      stockInitial: 300,
      stockQuantity: 295,
      reservedQuantity: 5,
      quantitySold: 0,
      alertThreshold: 20,
    },
    {
      sku: 'RADIO-AUTO-CAR',
      name: 'Radio Auto Car Bluetooth MP5',
      costPrice: 85.0,
      packagingFee: 8.0,
      sellingPrice: 349.0,
      stockInitial: 35,
      stockQuantity: 32,
      reservedQuantity: 3,
      quantitySold: 0,
      alertThreshold: 5,
    },
    {
      sku: 'ANTI-ACNE-MA',
      name: 'Anti-Acne MA Sérum Réparateur',
      costPrice: 35.0,
      packagingFee: 4.0,
      sellingPrice: 229.0,
      stockInitial: 60,
      stockQuantity: 58,
      reservedQuantity: 2,
      quantitySold: 0,
      alertThreshold: 15,
    },
  ];

  const createdProducts = {};
  for (const prod of products) {
    const p = await prisma.product.upsert({
      where: { sku: prod.sku },
      update: {},
      create: {
        storeId: storeBoomBuy.id,
        ...prod,
      },
    });
    createdProducts[prod.name] = p;
  }

  // 4. Real Orders from Sheet with Exact Confirmation Statuses and Couriers
  const sheetOrders = [
    {
      orderNumber: '1359',
      storeId: storeBoomBuy.id,
      customerName: 'Ismail',
      customerPhone: '0629764641',
      customerCity: 'Tanger',
      cityApi: 'Tanger',
      customerAddress: 'HAY AJDIR',
      customerNote: 'Appeler avant 14h',
      status: 'CONFIRMED',
      subStatus: 'Confirmé',
      assignedAgentId: agentMeryem.id,
      callAttempts: 1,
      totalAmount: 289.0,
      costAmount: 65.0,
      packagingFee: 5.0,
      shippingCost: 35.0,
      confirmerFee: 10.0,
      netProfit: 0,
      courierProvider: 'OzonExpress',
      trackingNumber: 'OZN-991823',
      courierStatus: 'IN_TRANSIT',
      source: 'Landing Page',
      utmCampaign: 'CAMP_LAMPE_MA',
      prodName: 'Lampe MA 2',
      quantity: 1,
    },
    {
      orderNumber: '1360',
      storeId: storeBoomBuy.id,
      customerName: 'Sohail',
      customerPhone: '0637999992',
      customerCity: 'Casablanca',
      cityApi: 'Casablanca',
      customerAddress: '3 rue chérif ameziane prince my Abdullah centre ville en face de hotel paris',
      status: 'CONFIRMED',
      subStatus: 'Confirmé',
      assignedAgentId: agentMeryem.id,
      callAttempts: 1,
      totalAmount: 399.0,
      costAmount: 130.0,
      packagingFee: 10.0,
      shippingCost: 35.0,
      confirmerFee: 10.0,
      netProfit: 0,
      courierProvider: 'Sendit',
      trackingNumber: 'SND-441209',
      courierStatus: 'IN_TRANSIT',
      source: 'Landing Page',
      utmCampaign: 'CAMP_LAMPE_MA',
      prodName: 'Lampe MA 2',
      quantity: 2,
    },
    {
      orderNumber: '1361',
      storeId: storeBoomBuy.id,
      customerName: 'Fadwa belcaid',
      customerPhone: '0761842144',
      customerCity: 'Casablanca',
      cityApi: 'Casablanca',
      customerAddress: 'LAYMON A COTE AIN DIAB',
      status: 'DELIVERED',
      subStatus: 'Confirmé',
      assignedAgentId: agentMeryem.id,
      callAttempts: 1,
      totalAmount: 289.0,
      costAmount: 65.0,
      packagingFee: 5.0,
      shippingCost: 35.0,
      confirmerFee: 10.0,
      // Net Profit = 289 - 65 (cogs) - 5 (packaging) - 35 (shipping) - 10 (confirmer commission) = 174 MAD
      netProfit: 174.0,
      courierProvider: 'OzonExpress',
      trackingNumber: 'OZN-991825',
      courierStatus: 'DELIVERED',
      deliveredAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
      confirmerPaid: false, // Awaiting payment
      source: 'Landing Page',
      utmCampaign: 'CAMP_LAMPE_MA',
      prodName: 'Lampe MA 2',
      quantity: 1,
    },
    {
      orderNumber: '1362',
      storeId: storeBoomBuy.id,
      customerName: 'Yassir Tazi',
      customerPhone: '0655443322',
      customerCity: 'Rabat',
      cityApi: 'Rabat',
      customerAddress: 'Agdal, Rue Oukaimeden',
      status: 'PENDING',
      subStatus: 'Appel 1',
      assignedAgentId: agentMeryem.id,
      callAttempts: 1,
      totalAmount: 249.0,
      costAmount: 48.0,
      packagingFee: 6.0,
      shippingCost: 35.0,
      confirmerFee: 10.0,
      netProfit: 0,
      source: 'Facebook Ad',
      utmCampaign: 'CAMP_KERATIN_MA',
      prodName: 'Camilia Pack Keratin',
      quantity: 1,
    },
    {
      orderNumber: '1363',
      storeId: storeBoomBuy.id,
      customerName: 'Khadija Mansour',
      customerPhone: '0611223344',
      customerCity: 'Marrakech',
      cityApi: 'Marrakech',
      customerAddress: 'Daoudiate, Rue 12',
      status: 'PENDING',
      subStatus: 'Appels + Message Whatssap',
      assignedAgentId: agentFatima.id,
      callAttempts: 2,
      totalAmount: 199.0,
      costAmount: 22.0,
      packagingFee: 4.0,
      shippingCost: 35.0,
      confirmerFee: 15.0,
      netProfit: 0,
      source: 'TikTok Ad',
      utmCampaign: 'TIKTOK_BIG_SIZE',
      prodName: 'Pack Big Size MA',
      quantity: 1,
    },
    {
      orderNumber: '1364',
      storeId: storeBoomBuy.id,
      customerName: 'Mohamed Bennani',
      customerPhone: '0677889900',
      customerCity: 'Fès',
      cityApi: 'Fès',
      customerAddress: 'Atlas, Rue 4',
      status: 'CANCELLED',
      subStatus: 'Annulé',
      assignedAgentId: agentFatima.id,
      callAttempts: 1,
      agentNotes: 'Client a annulé : Trop cher',
      totalAmount: 349.0,
      costAmount: 85.0,
      packagingFee: 8.0,
      shippingCost: 35.0,
      confirmerFee: 0,
      netProfit: 0,
      source: 'Facebook Ad',
      utmCampaign: 'FB_RADIO_AUTO',
      prodName: 'Radio Auto Car Bluetooth MP5',
      quantity: 1,
    },
  ];

  for (const o of sheetOrders) {
    const { prodName, quantity, ...orderData } = o;
    const prod = createdProducts[prodName] || createdProducts['Lampe MA 2'];

    const created = await prisma.order.upsert({
      where: { orderNumber: orderData.orderNumber },
      update: {},
      create: {
        ...orderData,
        items: {
          create: [
            {
              productId: prod.id,
              quantity: quantity || 1,
              unitPrice: prod.sellingPrice,
              unitCost: prod.costPrice,
            },
          ],
        },
      },
    });

    if (created.callAttempts > 0) {
      await prisma.callLog.create({
        data: {
          orderId: created.id,
          agentId: created.assignedAgentId,
          status: created.subStatus || 'Confirmé',
          notes: created.agentNotes || 'Appel de confirmation',
          durationSec: 75,
        },
      });
    }
  }

  // 5. Facebook Settings & Courier Config for OzonExpress & Sendit
  await prisma.courierConfig.upsert({
    where: {
      storeId_provider: {
        storeId: storeBoomBuy.id,
        provider: 'OzonExpress',
      },
    },
    update: {},
    create: {
      storeId: storeBoomBuy.id,
      provider: 'OzonExpress',
      apiKey: 'ozon_live_key_sample_8819',
      accountNumber: 'ACC-BOOMBUY-OZON',
      isActive: true,
    },
  });

  await prisma.courierConfig.upsert({
    where: {
      storeId_provider: {
        storeId: storeBoomBuy.id,
        provider: 'Sendit',
      },
    },
    update: {},
    create: {
      storeId: storeBoomBuy.id,
      provider: 'Sendit',
      apiKey: 'sendit_live_key_sample_4412',
      accountNumber: 'ACC-BOOMBUY-SND',
      isActive: true,
    },
  });

  console.log('✅ Sheet Data Seeded Successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
