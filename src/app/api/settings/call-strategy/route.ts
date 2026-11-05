import { NextRequest, NextResponse } from 'next/server';
import { getCallStrategySettings, saveCallStrategySettings } from '@/lib/callStrategySettings';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = getCallStrategySettings();
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      enableAutoRotation,
      maxAttemptsBeforeRotation,
      relanceTimeoutHours,
      maxUnansweredBacklog,
      enableBacklogThrottle,
      userName = 'Admin',
      userRole = 'ADMIN',
      userId = null,
    } = body;

    // Strict security check: Only Admin and Manager can modify lead strategy
    if (userRole === 'CALL_AGENT') {
      return NextResponse.json(
        { success: false, error: 'Accès refusé. Seuls les administrateurs et managers peuvent modifier cette stratégie.' },
        { status: 403 }
      );
    }

    const updated = saveCallStrategySettings({
      enableAutoRotation,
      maxAttemptsBeforeRotation,
      relanceTimeoutHours,
      maxUnansweredBacklog,
      enableBacklogThrottle,
    });

    // Audit log
    await logActivity({
      userId,
      userName,
      userRole,
      action: 'SETTING_CHANGE',
      entity: 'SETTING',
      details: `Mise à jour de la stratégie d'appels & rotation: Max tentatives=${updated.maxAttemptsBeforeRotation}, Délai relance=${updated.relanceTimeoutHours}h, Seuil backlog=${updated.maxUnansweredBacklog}`,
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
