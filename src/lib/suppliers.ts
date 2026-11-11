import { runtimeDataPath } from './runtimeData';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  city: string;
  country: 'MA' | 'SN';
  notes?: string;
  totalPurchased: number;
  totalPaid: number;
  balanceDue: number; // totalPurchased - totalPaid
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCostPrice: number;
  totalAmount: number;
  date: string;
  reference?: string;
  notes?: string;
  country: 'MA' | 'SN';
  createdAt: string;
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  date: string;
  notes?: string;
  country: 'MA' | 'SN';
  createdAt: string;
}

interface SuppliersData {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  payments: SupplierPayment[];
}

const DATA_FILE = runtimeDataPath('suppliers-data.json');

const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup_casa_01',
    name: 'Atlas Import Grossiste',
    contactPerson: 'Haj Abdelilah',
    phone: '+212661234567',
    address: 'Derb Omar, Rue Faidi Khalifa',
    city: 'Casablanca',
    country: 'MA',
    notes: 'Fournisseur principal pour les diffuseurs et huiles essentielles.',
    totalPurchased: 45000,
    totalPaid: 35000,
    balanceDue: 10000,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'sup_rabat_02',
    name: 'Cosmétique Bio Nature SARL',
    contactPerson: 'Mme Nezha Bennani',
    phone: '+212662987654',
    address: 'Zone Industrielle Ain Atiq',
    city: 'Rabat',
    country: 'MA',
    notes: 'Laboratoire certifié, crèmes et sérums anti-taches.',
    totalPurchased: 28000,
    totalPaid: 28000,
    balanceDue: 0,
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: 'sup_dakar_03',
    name: 'Dakar Transit & Distribution Hub',
    contactPerson: 'M. Ousmane Diop',
    phone: '+221776543210',
    address: 'Zone Franche Industrielle',
    city: 'Dakar',
    country: 'SN',
    notes: 'Arrivage maritime, stock tampon pour le Sénégal.',
    totalPurchased: 3500000, // In XOF
    totalPaid: 2500000,
    balanceDue: 1000000,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
];

export function loadSuppliersData(): SuppliersData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        suppliers: parsed.suppliers || [],
        purchaseOrders: parsed.purchaseOrders || [],
        payments: parsed.payments || [],
      };
    }
  } catch (e) {
    console.error('Error loading suppliers data:', e);
  }
  // Initialize with initial dataset
  const initial = {
    suppliers: INITIAL_SUPPLIERS,
    purchaseOrders: [],
    payments: [],
  };
  saveSuppliersData(initial);
  return initial;
}

export function saveSuppliersData(data: SuppliersData): void {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving suppliers data:', e);
  }
}

// Record purchase order and automatically increment product stock
export async function recordPurchaseOrder(params: {
  supplierId: string;
  productId: string;
  quantity: number;
  unitCostPrice: number;
  date?: string;
  reference?: string;
  notes?: string;
  userName?: string;
}): Promise<{ success: boolean; purchase?: PurchaseOrder; error?: string }> {
  try {
    const data = loadSuppliersData();
    const supplier = data.suppliers.find((s) => s.id === params.supplierId);
    if (!supplier) {
      return { success: false, error: 'Fournisseur introuvable' };
    }

    const product = await prisma.product.findUnique({
      where: { id: params.productId },
      include: { store: true },
    });
    if (!product) {
      return { success: false, error: 'Produit introuvable' };
    }

    const totalAmount = params.quantity * params.unitCostPrice;
    const country = supplier.country || (product.store?.currency === 'XOF' ? 'SN' : 'MA');

    const newPurchase: PurchaseOrder = {
      id: `po_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: params.quantity,
      unitCostPrice: params.unitCostPrice,
      totalAmount,
      date: params.date || new Date().toISOString(),
      reference: params.reference || `BON-${Date.now().toString().slice(-6)}`,
      notes: params.notes,
      country,
      createdAt: new Date().toISOString(),
    };

    // 1. Increment product real stock
    const prevStock = product.stockQuantity;
    const nextStock = prevStock + params.quantity;
    await prisma.product.update({
      where: { id: product.id },
      data: {
        stockQuantity: nextStock,
        costPrice: params.unitCostPrice || product.costPrice,
      },
    });

    // 2. Create StockMovement log
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        type: 'PURCHASE',
        quantity: params.quantity,
        previousStock: prevStock,
        newStock: nextStock,
        reference: newPurchase.reference,
        notes: `Arrivage Fournisseur: ${supplier.name} (${params.quantity} pcs @ ${params.unitCostPrice})`,
      },
    });

    // 3. Update supplier balance
    supplier.totalPurchased += totalAmount;
    supplier.balanceDue = supplier.totalPurchased - supplier.totalPaid;

    data.purchaseOrders = [newPurchase, ...data.purchaseOrders];
    saveSuppliersData(data);

    await logActivity({
      userName: params.userName || 'Admin',
      action: 'STOCK_UPDATE',
      entity: 'PRODUCT',
      entityId: product.id,
      storeId: product.storeId,
      details: `Arrivage Stock Fournisseur: +${params.quantity} pcs de ${product.name} reçu de ${supplier.name} (Réf: ${newPurchase.reference})`,
    });

    return { success: true, purchase: newPurchase };
  } catch (e: any) {
    console.error('Error recording purchase order:', e);
    return { success: false, error: e.message };
  }
}

// Record supplier payment
export async function recordSupplierPayment(params: {
  supplierId: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  date?: string;
  notes?: string;
  userName?: string;
}): Promise<{ success: boolean; payment?: SupplierPayment; error?: string }> {
  try {
    const data = loadSuppliersData();
    const supplier = data.suppliers.find((s) => s.id === params.supplierId);
    if (!supplier) {
      return { success: false, error: 'Fournisseur introuvable' };
    }

    const newPayment: SupplierPayment = {
      id: `spay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      amount: params.amount,
      paymentMethod: params.paymentMethod || 'Virement bancaire',
      reference: params.reference || `VIR-${Date.now().toString().slice(-6)}`,
      date: params.date || new Date().toISOString(),
      notes: params.notes,
      country: supplier.country,
      createdAt: new Date().toISOString(),
    };

    supplier.totalPaid += params.amount;
    supplier.balanceDue = supplier.totalPurchased - supplier.totalPaid;

    data.payments = [newPayment, ...data.payments];
    saveSuppliersData(data);

    await logActivity({
      userName: params.userName || 'Admin',
      action: 'EXPENSE_ADD',
      entity: 'STORE',
      details: `Règlement Fournisseur: Paiement de ${params.amount} ${supplier.country === 'SN' ? 'XOF' : 'MAD'} à ${supplier.name} via ${params.paymentMethod}`,
    });

    return { success: true, payment: newPayment };
  } catch (e: any) {
    console.error('Error recording supplier payment:', e);
    return { success: false, error: e.message };
  }
}
