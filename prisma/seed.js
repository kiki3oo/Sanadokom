const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding COD SaaS Database...');

  // 1. Create Default Users (Admin & Call Agents)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@codsaas.com' },
    update: {},
    create: {
      name: 'Yassine El Amrani',
      email: 'admin@codsaas.com',
      passwordHash: 'admin123',
      role: 'ADMIN',
      active: true,
    },
  });

  const agent1 = await prisma.user.upsert({
    where: { email: 'agent.salma@codsaas.com' },
    update: {},
    create: {
      name: 'Salma Benali',
      email: 'agent.salma@codsaas.com',
      passwordHash: 'agent123',
      role: 'CALL_AGENT',
      active: true,
    },
  });

  const agent2 = await prisma.user.upsert({
    where: { email: 'agent.omar@codsaas.com' },
    update: {},
    create: {
      name: 'Omar Tazi',
      email: 'agent.omar@codsaas.com',
      passwordHash: 'agent123',
      role: 'CALL_AGENT',
      active: true,
    },
  });

  // 2. Create Stores
  const storeCosmetics = await prisma.store.upsert({
    where: { slug: 'moroccan-glow' },
    update: {},
    create: {
      name: 'Moroccan Glow Beauty',
      slug: 'moroccan-glow',
      currency: 'MAD',
      webhookSecret: 'whsec_moroccan_glow_991823',
    },
  });

  const storeTech = await prisma.store.upsert({
    where: { slug: 'gadget-zone-ma' },
    update: {},
    create: {
      name: 'GadgetZone Maroc',
      slug: 'gadget-zone-ma',
      currency: 'MAD',
      webhookSecret: 'whsec_gadgetzone_554812',
    },
  });

  // 3. Create Products for Moroccan Glow
  const serum = await prisma.product.upsert({
    where: { sku: 'GLOW-SERUM-01' },
    update: {},
    create: {
      storeId: storeCosmetics.id,
      sku: 'GLOW-SERUM-01',
      name: 'Sérum Anti-Âge Huile de Figue de Barbarie',
      description: 'Sérum 30ml 100% bio formule réparatrice',
      costPrice: 45.0, // COGS (Achat + Packaging)
      sellingPrice: 249.0, // Prix de vente au client
      stockQuantity: 120,
      alertThreshold: 20,
    },
  });

  const cream = await prisma.product.upsert({
    where: { sku: 'GLOW-CREAM-02' },
    update: {},
    create: {
      storeId: storeCosmetics.id,
      sku: 'GLOW-CREAM-02',
      name: 'Crème Éclaircissante Visage & Cou',
      description: 'Crème hydratante 50g éclat immédiat',
      costPrice: 38.0,
      sellingPrice: 199.0,
      stockQuantity: 15, // Low stock alert!
      alertThreshold: 25,
    },
  });

  // 4. Products for GadgetZone
  const earbuds = await prisma.product.upsert({
    where: { sku: 'GZ-EARBUDS-PRO' },
    update: {},
    create: {
      storeId: storeTech.id,
      sku: 'GZ-EARBUDS-PRO',
      name: 'Écouteurs Sans Fil Pro ANC Bluetooth 5.3',
      description: 'Réduction active de bruit, autonomie 36h',
      costPrice: 65.0,
      sellingPrice: 299.0,
      stockQuantity: 85,
      alertThreshold: 15,
    },
  });

  // 5. Stock Movements
  await prisma.stockMovement.createMany({
    data: [
      {
        productId: serum.id,
        type: 'PURCHASE',
        quantity: 150,
        previousStock: 0,
        newStock: 150,
        reference: 'FACT-FOURNISSEUR-2024-01',
        notes: 'Arrivage conteneur usine Agadir',
      },
      {
        productId: serum.id,
        type: 'SALE',
        quantity: -30,
        previousStock: 150,
        newStock: 120,
        reference: 'VENTES-SEMAINE-1',
        notes: 'Expéditions commandes confirmées',
      },
    ],
  });

  // 6. Realistic Orders with different statuses (Pending, Confirmed, Shipped, Delivered, Returned, Cancelled)
  const ordersData = [
    {
      orderNumber: 'ORD-1001',
      storeId: storeCosmetics.id,
      customerName: 'Fatima Zahra Mansouri',
      customerPhone: '0661234567',
      customerCity: 'Casablanca',
      customerAddress: 'Boulevard Ghandi, Imm 42, Appt 5',
      customerNote: 'Appeler avant 14h svp',
      status: 'PENDING',
      assignedAgentId: agent1.id,
      callAttempts: 1,
      totalAmount: 249.0,
      costAmount: 45.0,
      shippingCost: 35.0,
      netProfit: 0,
      source: 'Landing Page Glow',
      utmCampaign: 'CAMP_SERUM_TOFU_MA',
      utmSource: 'facebook',
      items: [{ productId: serum.id, quantity: 1, unitPrice: 249.0, unitCost: 45.0 }],
    },
    {
      orderNumber: 'ORD-1002',
      storeId: storeCosmetics.id,
      customerName: 'Rachid El Alami',
      customerPhone: '0678901234',
      customerCity: 'Rabat',
      customerAddress: 'Avenue Hassan II, Agdal',
      status: 'CONFIRMED',
      assignedAgentId: agent1.id,
      callAttempts: 1,
      totalAmount: 448.0,
      costAmount: 83.0,
      shippingCost: 35.0,
      netProfit: 0,
      agentNotes: 'Client a confirmé 1 sérum + 1 crème',
      source: 'Landing Page Glow',
      utmCampaign: 'CAMP_SERUM_RETARGETING',
      utmSource: 'facebook',
      items: [
        { productId: serum.id, quantity: 1, unitPrice: 249.0, unitCost: 45.0 },
        { productId: cream.id, quantity: 1, unitPrice: 199.0, unitCost: 38.0 },
      ],
    },
    {
      orderNumber: 'ORD-1003',
      storeId: storeCosmetics.id,
      customerName: 'Meriem Bennis',
      customerPhone: '0654321987',
      customerCity: 'Marrakech',
      customerAddress: 'Guéliz, Rue de la Liberté',
      status: 'DELIVERED',
      assignedAgentId: agent2.id,
      callAttempts: 1,
      totalAmount: 249.0,
      costAmount: 45.0,
      shippingCost: 35.0,
      netProfit: 169.0, // 249 - 45 (cogs) - 35 (shipping)
      courierProvider: 'CATHEDIS',
      trackingNumber: 'CTH-9821443',
      courierStatus: 'DELIVERED',
      shippedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      deliveredAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
      source: 'Landing Page Glow',
      utmCampaign: 'CAMP_SERUM_TOFU_MA',
      utmSource: 'facebook',
      items: [{ productId: serum.id, quantity: 1, unitPrice: 249.0, unitCost: 45.0 }],
    },
    {
      orderNumber: 'ORD-1004',
      storeId: storeCosmetics.id,
      customerName: 'Hamza Chraibi',
      customerPhone: '0612457896',
      customerCity: 'Tanger',
      customerAddress: 'Malabata, Résidence Bahr',
      status: 'SHIPPED',
      assignedAgentId: agent1.id,
      callAttempts: 1,
      totalAmount: 249.0,
      costAmount: 45.0,
      shippingCost: 35.0,
      netProfit: 0,
      courierProvider: 'AMEEX',
      trackingNumber: 'AMX-554109',
      courierStatus: 'IN_TRANSIT',
      shippedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
      source: 'Landing Page Glow',
      utmCampaign: 'CAMP_SERUM_TOFU_MA',
      utmSource: 'facebook',
      items: [{ productId: serum.id, quantity: 1, unitPrice: 249.0, unitCost: 45.0 }],
    },
    {
      orderNumber: 'ORD-1005',
      storeId: storeCosmetics.id,
      customerName: 'Soukaina Kadiri',
      customerPhone: '0699887766',
      customerCity: 'Fès',
      customerAddress: 'Narjiss Hay Chabab N 12',
      status: 'RETURNED',
      assignedAgentId: agent2.id,
      callAttempts: 2,
      totalAmount: 249.0,
      costAmount: 45.0,
      shippingCost: 20.0, // Return fee charged by courier
      netProfit: -20.0, // Loss = return fee
      courierProvider: 'CATHEDIS',
      trackingNumber: 'CTH-9812002',
      courierStatus: 'RETURNED',
      shippedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      returnedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
      source: 'Landing Page Glow',
      utmCampaign: 'CAMP_SERUM_TOFU_MA',
      utmSource: 'facebook',
      items: [{ productId: serum.id, quantity: 1, unitPrice: 249.0, unitCost: 45.0 }],
    },
    {
      orderNumber: 'ORD-1006',
      storeId: storeTech.id,
      customerName: 'Youssef Berada',
      customerPhone: '0663112233',
      customerCity: 'Agadir',
      customerAddress: 'Dakhla, Av Hassan II',
      status: 'PENDING',
      assignedAgentId: null, // Unassigned lead
      callAttempts: 0,
      totalAmount: 299.0,
      costAmount: 65.0,
      shippingCost: 35.0,
      netProfit: 0,
      source: 'TikTok Landing',
      utmCampaign: 'TIKTOK_EARBUDS_CONV',
      utmSource: 'tiktok',
      items: [{ productId: earbuds.id, quantity: 1, unitPrice: 299.0, unitCost: 65.0 }],
    },
    {
      orderNumber: 'ORD-1007',
      storeId: storeTech.id,
      customerName: 'Amine Naciri',
      customerPhone: '0667788990',
      customerCity: 'Casablanca',
      customerAddress: 'Maarif, Rue Jura',
      status: 'DELIVERED',
      assignedAgentId: agent1.id,
      callAttempts: 1,
      totalAmount: 299.0,
      costAmount: 65.0,
      shippingCost: 35.0,
      netProfit: 199.0, // 299 - 65 - 35
      courierProvider: 'OZONE',
      trackingNumber: 'OZN-112299',
      courierStatus: 'DELIVERED',
      shippedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000),
      deliveredAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      source: 'Facebook Ad',
      utmCampaign: 'FB_TECH_MAROC',
      utmSource: 'facebook',
      items: [{ productId: earbuds.id, quantity: 1, unitPrice: 299.0, unitCost: 65.0 }],
    },
  ];

  for (const orderData of ordersData) {
    const { items, ...orderFields } = orderData;
    const existing = await prisma.order.findUnique({ where: { orderNumber: orderFields.orderNumber } });
    if (!existing) {
      const createdOrder = await prisma.order.create({
        data: {
          ...orderFields,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              unitCost: item.unitCost,
            })),
          },
        },
      });

      // Add call log if agent attempted
      if (createdOrder.callAttempts > 0) {
        await prisma.callLog.create({
          data: {
            orderId: createdOrder.id,
            agentId: createdOrder.assignedAgentId,
            status: createdOrder.status === 'CONFIRMED' ? 'CONFIRMED' : 'ANSWERED',
            notes: createdOrder.agentNotes || 'Appel de vérification des coordonnées',
            durationSec: 85,
          },
        });
      }
    }
  }

  // 7. Expenses (Facebook Ads, Salaries, Packaging)
  await prisma.expense.createMany({
    data: [
      {
        storeId: storeCosmetics.id,
        category: 'FACEBOOK_ADS',
        amount: 850.0,
        description: 'Facebook Ads Spend (Campagnes Sérum 3 jours)',
        date: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      },
      {
        storeId: storeCosmetics.id,
        category: 'PACKAGING',
        amount: 320.0,
        description: 'Cartons personnalisés + scotch sécurité',
        date: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      },
      {
        storeId: storeTech.id,
        category: 'FACEBOOK_ADS',
        amount: 620.0,
        description: 'Facebook Ads Spend (Gadgets)',
        date: new Date(Date.now() - 1 * 24 * 3600 * 1000),
      },
      {
        storeId: storeCosmetics.id,
        category: 'SALARIES',
        amount: 500.0,
        description: 'Commission Call Center Agents',
        date: new Date(),
      },
    ],
  });

  // 8. Courier Configurations
  await prisma.courierConfig.upsert({
    where: {
      storeId_provider: {
        storeId: storeCosmetics.id,
        provider: 'CATHEDIS',
      },
    },
    update: {},
    create: {
      storeId: storeCosmetics.id,
      provider: 'CATHEDIS',
      apiKey: 'cathedis_live_key_sample_8829',
      accountNumber: 'ACC-MOROCCAN-GLOW',
      apiUrl: 'https://api.cathedis.ma/v1',
      isActive: true,
    },
  });

  await prisma.courierConfig.upsert({
    where: {
      storeId_provider: {
        storeId: storeCosmetics.id,
        provider: 'AMEEX',
      },
    },
    update: {},
    create: {
      storeId: storeCosmetics.id,
      provider: 'AMEEX',
      apiKey: 'ameex_live_key_sample_7731',
      accountNumber: 'ACC-AMEEX-GLOW',
      apiUrl: 'https://api.ameex.ma/v2',
      isActive: true,
    },
  });

  // 9. Facebook Settings
  await prisma.facebookSetting.upsert({
    where: { storeId: storeCosmetics.id },
    update: {},
    create: {
      storeId: storeCosmetics.id,
      adAccountId: 'act_18294019284',
      pixelId: '982736451029384',
      accessToken: 'EAAB...sample_token_encrypted',
      autoSyncSpend: true,
      lastSyncAt: new Date(),
    },
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
