import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};

    if (storeId && storeId !== 'ALL') {
      where.storeId = storeId.includes(',') ? { in: storeId.split(',') } : storeId;
    }

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        store: {
          select: { id: true, name: true, currency: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Breakdown totals
    const totalAmount = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const adsTotal = expenses
      .filter((e) => ['FACEBOOK_ADS', 'TIKTOK_ADS', 'SNAPCHAT_ADS', 'GOOGLE_ADS'].includes(e.category))
      .reduce((acc, e) => acc + (e.amount || 0), 0);
    const productPurchaseTotal = expenses
      .filter((e) => e.category === 'PRODUCT_PURCHASE')
      .reduce((acc, e) => acc + (e.amount || 0), 0);
    const shippingTotal = expenses
      .filter((e) => e.category === 'SHIPPING')
      .reduce((acc, e) => acc + (e.amount || 0), 0);
    const phoneTotal = expenses
      .filter((e) => e.category === 'PHONE_SUBSCRIPTION')
      .reduce((acc, e) => acc + (e.amount || 0), 0);
    const packagingTotal = expenses
      .filter((e) => e.category === 'PACKAGING')
      .reduce((acc, e) => acc + (e.amount || 0), 0);
    const salariesTotal = expenses
      .filter((e) => ['SALARIES', 'CONFIRMER_FEE'].includes(e.category))
      .reduce((acc, e) => acc + (e.amount || 0), 0);
    const otherTotal = expenses
      .filter(
        (e) =>
          ![
            'FACEBOOK_ADS',
            'TIKTOK_ADS',
            'SNAPCHAT_ADS',
            'GOOGLE_ADS',
            'PRODUCT_PURCHASE',
            'SHIPPING',
            'PHONE_SUBSCRIPTION',
            'PACKAGING',
            'SALARIES',
            'CONFIRMER_FEE',
          ].includes(e.category)
      )
      .reduce((acc, e) => acc + (e.amount || 0), 0);

    return NextResponse.json({
      success: true,
      expenses,
      stats: {
        totalAmount,
        adsTotal,
        productPurchaseTotal,
        shippingTotal,
        phoneTotal,
        packagingTotal,
        salariesTotal,
        otherTotal,
      },
    });
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeId, category, amount, description, date } = body;

    if (!storeId) {
      return NextResponse.json({ success: false, error: 'Store ID est obligatoire' }, { status: 400 });
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ success: false, error: 'Montant invalide' }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        storeId,
        category: category || 'OTHER',
        amount: parseFloat(amount),
        description: description || null,
        date: date ? new Date(date) : new Date(),
      },
      include: {
        store: { select: { id: true, name: true } },
      },
    });

    await logActivity({
      userName: body.userName || 'Admin',
      userRole: body.userRole || 'ADMIN',
      action: 'EXPENSE_ADD',
      entity: 'EXPENSE',
      entityId: expense.id,
      storeId: expense.storeId,
      newValue: `${expense.amount} MAD`,
      details: `A enregistré une dépense de ${expense.amount} MAD dans la catégorie [${expense.category}] - Motif: "${expense.description || 'Non précisé'}"`,
    });

    return NextResponse.json({ success: true, expense });
  } catch (error: any) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');
    const userName = searchParams.get('userName') || 'Admin';

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body?.id;
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Expense ID est obligatoire' }, { status: 400 });
    }

    const expense = await prisma.expense.findUnique({ where: { id } });

    await prisma.expense.delete({
      where: { id },
    });

    if (expense) {
      await logActivity({
        userName: userName,
        userRole: 'ADMIN',
        action: 'EXPENSE_DELETE',
        entity: 'EXPENSE',
        entityId: id,
        storeId: expense.storeId,
        oldValue: `${expense.amount} MAD`,
        details: `A supprimé la dépense de ${expense.amount} MAD (${expense.category} - "${expense.description || 'Sans motif'}")`,
      });
    }

    return NextResponse.json({ success: true, message: 'Dépense supprimée avec succès' });
  } catch (error: any) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
