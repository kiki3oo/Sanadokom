import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  loadSuppliersData,
  saveSuppliersData,
  recordPurchaseOrder,
  recordSupplierPayment,
  Supplier,
} from '@/lib/suppliers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country') || 'MA'; // 'MA' | 'SN'
    const storeId = searchParams.get('storeId');

    const data = loadSuppliersData();

    // Filter by country
    const suppliers = data.suppliers.filter((s) => s.country === country);
    const purchaseOrders = data.purchaseOrders.filter((p) => p.country === country);
    const payments = data.payments.filter((pay) => pay.country === country);

    // Fetch products for purchase order selection
    const productWhere: any = {};
    if (storeId && storeId !== 'ALL') {
      productWhere.storeId = storeId.includes(',') ? { in: storeId.split(',') } : storeId;
    }
    const products = await prisma.product.findMany({
      where: productWhere,
      select: {
        id: true,
        sku: true,
        name: true,
        stockQuantity: true,
        costPrice: true,
        store: { select: { name: true, currency: true } },
      },
      orderBy: { name: 'asc' },
    });

    // Summary Metrics
    const totalSuppliers = suppliers.length;
    const totalPurchased = suppliers.reduce((sum, s) => sum + s.totalPurchased, 0);
    const totalPaid = suppliers.reduce((sum, s) => sum + s.totalPaid, 0);
    const totalBalanceDue = suppliers.reduce((sum, s) => sum + s.balanceDue, 0);

    return NextResponse.json({
      success: true,
      suppliers,
      purchaseOrders,
      payments,
      products,
      metrics: {
        totalSuppliers,
        totalPurchased,
        totalPaid,
        totalBalanceDue,
        currency: country === 'SN' ? 'XOF' : 'MAD',
      },
    });
  } catch (error: any) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    const data = loadSuppliersData();

    // 1. CREATE OR UPDATE SUPPLIER
    if (action === 'SAVE_SUPPLIER') {
      const { id, name, contactPerson, phone, address, city, country, notes } = body;
      if (!name || !phone) {
        return NextResponse.json({ success: false, error: 'Nom et téléphone requis' }, { status: 400 });
      }

      if (id) {
        // Update existing
        const idx = data.suppliers.findIndex((s) => s.id === id);
        if (idx !== -1) {
          data.suppliers[idx] = {
            ...data.suppliers[idx],
            name,
            contactPerson: contactPerson || '',
            phone,
            address: address || '',
            city: city || '',
            country: country || data.suppliers[idx].country,
            notes: notes || '',
          };
          saveSuppliersData(data);
          return NextResponse.json({ success: true, supplier: data.suppliers[idx] });
        }
      }

      // Create new
      const newSupplier: Supplier = {
        id: `sup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name,
        contactPerson: contactPerson || '',
        phone,
        address: address || '',
        city: city || '',
        country: country || 'MA',
        notes: notes || '',
        totalPurchased: 0,
        totalPaid: 0,
        balanceDue: 0,
        createdAt: new Date().toISOString(),
      };

      data.suppliers = [newSupplier, ...data.suppliers];
      saveSuppliersData(data);
      return NextResponse.json({ success: true, supplier: newSupplier });
    }

    // 2. RECORD PURCHASE ORDER
    if (action === 'RECORD_PURCHASE') {
      const { supplierId, productId, quantity, unitCostPrice, date, reference, notes, userName } = body;
      if (!supplierId || !productId || !quantity || !unitCostPrice) {
        return NextResponse.json(
          { success: false, error: 'Fournisseur, produit, quantité et prix d\'achat sont requis' },
          { status: 400 }
        );
      }

      const res = await recordPurchaseOrder({
        supplierId,
        productId,
        quantity: Number(quantity),
        unitCostPrice: Number(unitCostPrice),
        date,
        reference,
        notes,
        userName,
      });

      return NextResponse.json(res);
    }

    // 3. RECORD SUPPLIER PAYMENT
    if (action === 'RECORD_PAYMENT') {
      const { supplierId, amount, paymentMethod, reference, date, notes, userName } = body;
      if (!supplierId || !amount) {
        return NextResponse.json({ success: false, error: 'Fournisseur et montant requis' }, { status: 400 });
      }

      const res = await recordSupplierPayment({
        supplierId,
        amount: Number(amount),
        paymentMethod,
        reference,
        date,
        notes,
        userName,
      });

      return NextResponse.json(res);
    }

    return NextResponse.json({ success: false, error: `Action inconnue: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('Error handling supplier POST:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
