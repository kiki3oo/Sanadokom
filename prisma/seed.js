const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding COD SaaS Database...');

  // 1. Create Default Users (Admin & Call Agents)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@codsaas.com' },
    update: {
      name: 'Younes OUAKRIM',
      passwordHash: 'admin123',
    },
    create: {
      name: 'Younes OUAKRIM',
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
  const storeRovanxMaroc = await prisma.store.upsert({
    where: { slug: 'rovanx-maroc' },
    update: {},
    create: {
      name: 'Rovanx Maroc 🇲🇦',
      slug: 'rovanx-maroc',
      currency: 'MAD',
      webhookSecret: 'whsec_rovanx_maroc_2026',
    },
  });

  const storeRovanxSenegal = await prisma.store.upsert({
    where: { slug: 'rovanx-senegal' },
    update: {},
    create: {
      name: 'Rovanx Sénégal 🇸🇳',
      slug: 'rovanx-senegal',
      currency: 'XOF',
      webhookSecret: 'whsec_rovanx_senegal_2026',
    },
  });

  const storeMagneSteps = await prisma.store.upsert({
    where: { slug: 'magnesteps-maroc' },
    update: {
      webhookSecret: 'whsec_magnesteps_maroc_2026',
    },
    create: {
      name: 'MagneSteps Maroc 🇲🇦',
      slug: 'magnesteps-maroc',
      currency: 'MAD',
      webhookSecret: 'whsec_magnesteps_maroc_2026',
    },
  });

  // 3. Create 7 Official ROVANX Products with 100 units each
  const rovanxProductsList = [
    {
      sku: 'ROV-VIT-60',
      name: 'Vitality Ultra',
      description: 'Formule avancée 60 gélules pour la vitalité masculine, l endurance et l énergie quotidienne',
      sellingPrice: 299.0,
      costPrice: 45.0,
      packagingFee: 5.0,
      stockInitial: 100,
      stockQuantity: 100,
      alertThreshold: 15,
    },
    {
      sku: 'ROV-VIT-30',
      name: 'Vitality Boost',
      description: 'Format mensuel 30 gélules - Boost d énergie et tonus masculin rapide',
      sellingPrice: 249.0,
      costPrice: 35.0,
      packagingFee: 5.0,
      stockInitial: 100,
      stockQuantity: 100,
      alertThreshold: 15,
    },
    {
      sku: 'ROV-PRO-01',
      name: 'Prosta Guard',
      description: 'Soutien naturel et protection de la prostate, confort urinaire masculin',
      sellingPrice: 299.0,
      costPrice: 45.0,
      packagingFee: 5.0,
      stockInitial: 100,
      stockQuantity: 100,
      alertThreshold: 15,
    },
    {
      sku: 'ROV-MAC-01',
      name: 'Royal Force',
      description: 'Complexe Maca noire et stimulants naturels pour une puissance et vigueur décuplées',
      sellingPrice: 299.0,
      costPrice: 45.0,
      packagingFee: 5.0,
      stockInitial: 100,
      stockQuantity: 100,
      alertThreshold: 15,
    },
    {
      sku: 'ROV-GIN-01',
      name: 'Testo Drive',
      description: 'Extrait pur de Ginseng rouge et zinc pour stimuler la testostérone et la performance',
      sellingPrice: 249.0,
      costPrice: 40.0,
      packagingFee: 5.0,
      stockInitial: 100,
      stockQuantity: 100,
      alertThreshold: 15,
    },
    {
      sku: 'ROV-OIL-01',
      name: 'Control Flow',
      description: 'Huile essentielle intime de massage - Contrôle, endurance et retardement 30-45 min',
      sellingPrice: 199.0,
      costPrice: 30.0,
      packagingFee: 5.0,
      stockInitial: 100,
      stockQuantity: 100,
      alertThreshold: 15,
    },
    {
      sku: 'ROV-PROT-01',
      name: 'Vital Protein',
      description: 'Poudre protéinée premium et acides aminés pour la récupération musculaire et la vitalité',
      sellingPrice: 299.0,
      costPrice: 60.0,
      packagingFee: 5.0,
      stockInitial: 100,
      stockQuantity: 100,
      alertThreshold: 15,
    },
  ];

  for (const item of rovanxProductsList) {
    const prod = await prisma.product.upsert({
      where: { sku: item.sku },
      update: {
        storeId: storeRovanxMaroc.id,
        name: item.name,
        description: item.description,
        sellingPrice: item.sellingPrice,
        costPrice: item.costPrice,
        stockQuantity: 100,
        stockInitial: 100,
      },
      create: {
        storeId: storeRovanxMaroc.id,
        sku: item.sku,
        name: item.name,
        description: item.description,
        sellingPrice: item.sellingPrice,
        costPrice: item.costPrice,
        packagingFee: item.packagingFee,
        stockInitial: 100,
        stockQuantity: 100,
        alertThreshold: item.alertThreshold,
      },
    });

    const existingMvt = await prisma.stockMovement.findFirst({
      where: { productId: prod.id, reference: 'INITIAL_STOCK' },
    });

    if (!existingMvt) {
      await prisma.stockMovement.create({
        data: {
          productId: prod.id,
          type: 'PURCHASE',
          quantity: 100,
          previousStock: 0,
          newStock: 100,
          reference: 'INITIAL_STOCK',
          notes: 'Stock initial - Arrivage 100 pièces par produit Rovanx',
        },
      });
    }
  }

  // 3.1 Create MagneSteps Official Product
  const magneProduct = await prisma.product.upsert({
    where: { sku: 'MAGNE-STEPS-01' },
    update: {
      storeId: storeMagneSteps.id,
      name: 'فرشات MagneSteps الطبية الأصلية',
      description: 'فرشات السيليكون المغناطيسية الأصلية للتدليك وتسكين آلام الظهر والمفاصل',
      sellingPrice: 199.0,
      costPrice: 35.0,
      stockQuantity: 500,
      stockInitial: 500,
    },
    create: {
      storeId: storeMagneSteps.id,
      sku: 'MAGNE-STEPS-01',
      name: 'فرشات MagneSteps الطبية الأصلية',
      description: 'فرشات السيليكون المغناطيسية الأصلية للتدليك وتسكين آلام الظهر والمفاصل',
      sellingPrice: 199.0,
      costPrice: 35.0,
      packagingFee: 5.0,
      stockInitial: 500,
      stockQuantity: 500,
      alertThreshold: 20,
    },
  });

  // 4. Courier Configurations for Rovanx Maroc
  await prisma.courierConfig.upsert({
    where: {
      storeId_provider: {
        storeId: storeRovanxMaroc.id,
        provider: 'CATHEDIS',
      },
    },
    update: {},
    create: {
      storeId: storeRovanxMaroc.id,
      provider: 'CATHEDIS',
      apiKey: 'cathedis_live_key_sample_8829',
      accountNumber: 'ACC-ROVANX-MAROC',
      apiUrl: 'https://api.cathedis.ma/v1',
      isActive: true,
    },
  });

  await prisma.courierConfig.upsert({
    where: {
      storeId_provider: {
        storeId: storeRovanxMaroc.id,
        provider: 'AMEEX',
      },
    },
    update: {},
    create: {
      storeId: storeRovanxMaroc.id,
      provider: 'AMEEX',
      apiKey: 'ameex_live_key_sample_7731',
      accountNumber: 'ACC-AMEEX-ROVANX',
      apiUrl: 'https://api.ameex.ma/v2',
      isActive: true,
    },
  });

  // 5. Facebook Settings for Rovanx Maroc
  await prisma.facebookSetting.upsert({
    where: { storeId: storeRovanxMaroc.id },
    update: {},
    create: {
      storeId: storeRovanxMaroc.id,
      adAccountId: 'act_rovanx_maroc',
      pixelId: '982736451029384',
      accessToken: 'EAAB...sample_token_encrypted',
      autoSyncSpend: true,
      lastSyncAt: new Date(),
    },
  });

  console.log('✅ Seeding completed successfully with 7 Rovanx products and 100 stock each!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
