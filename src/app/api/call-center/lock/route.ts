import { NextRequest, NextResponse } from 'next/server';
import { lockLead, unlockLead, getAllLocks, getLeadLock } from '@/lib/leadLocks';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (orderId) {
      const lock = getLeadLock(orderId);
      return NextResponse.json({ success: true, lock });
    }

    const locks = getAllLocks();
    return NextResponse.json({ success: true, locks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, orderId, agentId, agentName } = body;

    if (action === 'LOCK') {
      if (!orderId || !agentId) {
        return NextResponse.json({ error: 'orderId et agentId obligatoires' }, { status: 400 });
      }

      const result = lockLead(orderId, agentId, agentName || 'Agent');
      if (result.success) {
        logActivity({
          userId: agentId,
          userName: agentName || 'Agent',
          userRole: 'CALL_AGENT',
          action: 'LEAD_LOCKED',
          entity: 'ORDER',
          entityId: orderId,
          orderId,
          details: `L'agent "${agentName || 'Agent'}" a ouvert et verrouillé le lead pour traitement`,
        }).catch(console.error);
      }
      return NextResponse.json(result);
    }

    if (action === 'UNLOCK') {
      if (!orderId) {
        return NextResponse.json({ error: 'orderId obligatoire' }, { status: 400 });
      }

      const unlocked = unlockLead(orderId, agentId);
      return NextResponse.json({ success: true, unlocked });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
