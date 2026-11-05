import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      storeId,
      defaultStatus = 'PENDING',
      source = 'Import Excel / CSV',
      assignMode = 'AUTO_ROUND_ROBIN', // 'AUTO_ROUND_ROBIN' | 'SPECIFIC_AGENT' | 'UNASSIGNED'
      specificAgentId = null,
      orders = [],
      userName = 'Admin',
      userRole = 'ADMIN',
      userId = null,
    } = body;

    if (!storeId) {
      return NextResponse.json({ success: false, error: 'Boutique (storeId) obligatoire' }, { status: 400 });
    }

    if (!Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json({ success: false, error: 'Aucune commande à importer' }, { status: 400 });
    }

    // 1. Resolve Store
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { products: true },
    });

    if (!store) {
      return NextResponse.json({ success: false, error: 'Boutique introuvable' }, { status: 404 });
    }

    // 2. Prepare Products Map for fast matching
    const storeProducts = store.products;
    let fallbackProduct = storeProducts[0] || null;

    if (!fallbackProduct) {
      // Create a default product for this store if none exists
      fallbackProduct = await prisma.product.create({
        data: {
          storeId: store.id,
          sku: `IMPORT-PROD-${Date.now()}`,
          name: 'Produit Importé Standard',
          sellingPrice: store.currency === 'XOF' ? 15000 : 299,
          costPrice: store.currency === 'XOF' ? 5000 : 80,
          stockQuantity: 1000,
        },
      });
    }

    // 3. Resolve Eligible Call Center Agents for Round-Robin
    let eligibleAgents: any[] = [];
    if (defaultStatus === 'PENDING' && assignMode === 'AUTO_ROUND_ROBIN') {
      const allActiveAgents = await prisma.user.findMany({
        where: { role: 'CALL_AGENT', active: true },
        include: {
          _count: {
            select: {
              assignedOrders: {
                where: { status: 'PENDING' },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      eligibleAgents = allActiveAgents.filter((agent) => {
        if (!agent.permissions) return true;
        try {
          const p = JSON.parse(agent.permissions);
          if (Array.isArray(p.assignedStoreIds) && p.assignedStoreIds.length > 0) {
            return p.assignedStoreIds.includes(store.id);
          }
        } catch (e) {}
        return true;
      });
    }

    let agentIndex = 0;

    // 4. Determine initial order sequence
    const currentCount = await prisma.order.count();
    let nextOrderNum = 1000 + currentCount + 1;

    const importedOrders: any[] = [];
    const errors: { row: number; error: string; data: any }[] = [];

    // Default shipping cost per country currency
    const defaultShippingCost = store.currency === 'XOF' ? 2000.0 : 35.0;

    for (let i = 0; i < orders.length; i++) {
      const row = orders[i];
      const rawName = String(row.customerName || row.name || row.nom || '').trim();
      const rawPhone = String(row.customerPhone || row.phone || row.telephone || row.tel || '').trim();
      const cleanPhone = rawPhone.replace(/[^0-9+]/g, '');

      if (!cleanPhone || cleanPhone.length < 8) {
        errors.push({ row: i + 1, error: 'Numéro de téléphone invalide ou manquant', data: row });
        continue;
      }

      const customerName = rawName || `Client ${cleanPhone.slice(-4)}`;
      const customerCity = String(row.customerCity || row.city || row.ville || 'Casablanca').trim();
      const customerAddress = String(row.customerAddress || row.address || row.adresse || '').trim();
      const customerNote = String(row.customerNote || row.note || '').trim() || null;
      const agentNotes = String(row.agentNotes || row.remarque || '').trim() || null;

      // Product matching
      const requestedProdName = String(row.productName || row.produit || row.sku || '').trim().toLowerCase();
      let matchedProduct = fallbackProduct;

      if (requestedProdName && storeProducts.length > 0) {
        const found = storeProducts.find(
          (p) =>
            p.sku.toLowerCase() === requestedProdName ||
            p.name.toLowerCase().includes(requestedProdName) ||
            requestedProdName.includes(p.name.toLowerCase())
        );
        if (found) matchedProduct = found;
      }

      const qty = Math.max(1, parseInt(row.quantity || row.qty || row.qte || 1) || 1);
      const parsedPrice = parseFloat(row.totalAmount || row.price || row.prix || 0);
      const totalAmount = !isNaN(parsedPrice) && parsedPrice > 0 ? parsedPrice : (matchedProduct?.sellingPrice || 0) * qty;
      const costAmount = (matchedProduct?.costPrice || 0) * qty;

      // Resolve Agent Assignment
      let assignedAgentId: string | null = null;
      let confirmerFee = 10.0;

      if (assignMode === 'SPECIFIC_AGENT' && specificAgentId) {
        assignedAgentId = specificAgentId;
      } else if (defaultStatus === 'PENDING' && assignMode === 'AUTO_ROUND_ROBIN' && eligibleAgents.length > 0) {
        const assignedAgent = eligibleAgents[agentIndex % eligibleAgents.length];
        assignedAgentId = assignedAgent.id;
        confirmerFee = assignedAgent.commissionFee || 10.0;
        agentIndex++;
      }

      const orderNumber = `ORD-${nextOrderNum++}`;

      try {
        const created = await prisma.order.create({
          data: {
            orderNumber,
            storeId: store.id,
            customerName,
            customerPhone: cleanPhone,
            customerCity,
            customerAddress,
            customerNote,
            agentNotes,
            status: defaultStatus === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING',
            assignedAgentId,
            confirmerFee,
            totalAmount,
            costAmount,
            shippingCost: defaultShippingCost,
            source: row.source || row.sourceName || source,
            utmSource: row.utmSource || row.utm_source || null,
            utmCampaign: row.utmCampaign || row.utm_campaign || null,
            adSet: row.adSet || row.adset || row.ad_set || null,
            items: {
              create: [
                {
                  productId: matchedProduct.id,
                  quantity: qty,
                  unitPrice: totalAmount / qty,
                  unitCost: matchedProduct.costPrice || 0,
                  variant: row.variant || null,
                  color: row.color || null,
                  size: row.size || null,
                },
              ],
            },
          },
          include: {
            store: { select: { id: true, name: true, currency: true } },
            items: { include: { product: true } },
            assignedAgent: { select: { id: true, name: true } },
          },
        });

        importedOrders.push(created);
      } catch (err: any) {
        console.error(`Error inserting row ${i + 1}:`, err);
        errors.push({ row: i + 1, error: err.message || 'Erreur insertion base de données', data: row });
      }
    }

    // Log Activity Audit
    if (importedOrders.length > 0) {
      await logActivity({
        userId,
        userName,
        userRole,
        action: 'ORDER_EDIT',
        entity: 'ORDER',
        details: `Importation en masse réussie de ${importedOrders.length} commandes pour la boutique ${store.name} (${defaultStatus})`,
        storeId: store.id,
      });
    }

    return NextResponse.json({
      success: true,
      importedCount: importedOrders.length,
      failedCount: errors.length,
      errors,
      orders: importedOrders.slice(0, 10), // return sample of created orders
    });
  } catch (error: any) {
    console.error('Error in bulk import API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
