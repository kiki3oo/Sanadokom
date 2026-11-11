import { runtimeDataPath } from './runtimeData';
import fs from 'fs';
import path from 'path';

export interface ReclamationTicket {
  id: string;
  ticketNumber: string; // e.g. REC-1001
  orderId: string;
  orderNumber: string;
  storeId: string;
  storeName?: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  customerAddress?: string;
  productName?: string;
  productSku?: string;
  courierProvider?: string | null;
  trackingNumber?: string | null;
  totalAmount?: number;
  currency?: string;
  type: 
    | 'PRODUIT_DEFECTUEUX'
    | 'ERREUR_PRODUIT'
    | 'PIECE_MANQUANTE'
    | 'LITIGE_TRANSPORTEUR'
    | 'DEMANDE_ECHANGE'
    | 'DEMANDE_REMBOURSEMENT'
    | 'AUTRE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status:
    | 'NOUVEAU'
    | 'EN_COURS'
    | 'ATTENTE_CLIENT'
    | 'ATTENTE_TRANSPORTEUR'
    | 'ECHANGE_PROGRAMME'
    | 'RESOLU'
    | 'REJETE';
  description: string;
  customerDemand?: string; // Ce que réclame le client (remplacement, remboursement, geste)
  resolutionNotes?: string;
  photos?: string[]; // URLs or base64 or photo paths
  assignedAgentId?: string | null;
  assignedAgentName?: string | null;
  exchangeOrderId?: string | null;
  exchangeOrderNumber?: string | null;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
}

const RECLAMATIONS_FILE_PATH = runtimeDataPath('reclamations.json');

let memoryTickets: ReclamationTicket[] | null = null;

export function loadReclamations(): ReclamationTicket[] {
  try {
    if (fs.existsSync(RECLAMATIONS_FILE_PATH)) {
      const content = fs.readFileSync(RECLAMATIONS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        memoryTickets = parsed;
        return memoryTickets;
      }
    }
  } catch (e) {
    console.error('Error reading reclamations file:', e);
  }
  memoryTickets = [];
  return memoryTickets;
}

export function saveReclamations(tickets: ReclamationTicket[]): void {
  try {
    const dir = path.dirname(RECLAMATIONS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(RECLAMATIONS_FILE_PATH, JSON.stringify(tickets, null, 2), 'utf-8');
    memoryTickets = tickets;
  } catch (e) {
    console.error('Error writing reclamations file:', e);
  }
}

export function generateTicketNumber(): string {
  const tickets = loadReclamations();
  const nextNum = 1000 + tickets.length + 1;
  return `REC-${nextNum}`;
}

export function createReclamation(data: Omit<ReclamationTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>): ReclamationTicket {
  const tickets = loadReclamations();
  const now = new Date().toISOString();
  const ticketNumber = generateTicketNumber();
  const newTicket: ReclamationTicket = {
    ...data,
    id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ticketNumber,
    createdAt: now,
    updatedAt: now,
  };

  tickets.unshift(newTicket);
  saveReclamations(tickets);
  return newTicket;
}

export function updateReclamation(id: string, updates: Partial<ReclamationTicket>): ReclamationTicket | null {
  const tickets = loadReclamations();
  const index = tickets.findIndex(t => t.id === id);
  if (index === -1) return null;

  const now = new Date().toISOString();
  const existing = tickets[index];

  const updated: ReclamationTicket = {
    ...existing,
    ...updates,
    updatedAt: now,
    resolvedAt: updates.status === 'RESOLU' && !existing.resolvedAt ? now : (updates.status !== 'RESOLU' && updates.status !== undefined ? null : existing.resolvedAt),
  };

  tickets[index] = updated;
  saveReclamations(tickets);
  return updated;
}

export function deleteReclamation(id: string): boolean {
  const tickets = loadReclamations();
  const filtered = tickets.filter(t => t.id !== id);
  if (filtered.length === tickets.length) return false;
  saveReclamations(filtered);
  return true;
}
