const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const rovanxProducts = [
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

async function main() {
  console.log('🔄 Checking Rovanx Maroc store...');
  let store = await prisma.store.findFirst({
    where: {
      OR: [
        { slug: 'rovanx-maroc' },
        { name: { contains: 'Rovanx' } },
        { currency: 'MAD' },
      ],
    },
  });

  if (!store) {
    store = await prisma.store.create({
      data: {
        name: 'Rovanx Maroc 🇲🇦',
        slug: 'rovanx-maroc',
        currency: 'MAD',
        webhookSecret: 'whsec_rovanx_maroc_2026',
      },
    });
    console.log('✅ Created store:', store.name);
  } else {
    console.log(`✅ Found store: ${store.name} (ID: ${store.id})`);
  }

  for (const item of rovanxProducts) {
    const existing = await prisma.product.findUnique({
      where: { sku: item.sku },
    });

    if (existing) {
      const updated = await prisma.product.update({
        where: { id: existing.id },
        data: {
          storeId: store.id,
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
      console.log(`🔄 Updated product: ${updated.name} (${updated.sku}) -> Stock: 100`);
    } else {
      const created = await prisma.product.create({
        data: {
          storeId: store.id,
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

      await prisma.stockMovement.create({
        data: {
          productId: created.id,
          type: 'PURCHASE',
          quantity: 100,
          previousStock: 0,
          newStock: 100,
          reference: 'INITIAL_STOCK',
          notes: 'Stock initial - Arrivage 100 pièces par produit Rovanx',
        },
      });

      console.log(`✨ Created product: ${created.name} (${created.sku}) -> Stock: 100`);
    }
  }

  const allCount = await prisma.product.count({ where: { storeId: store.id } });
  console.log(`\n🎉 Done! Total products in ${store.name}: ${allCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding products:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
