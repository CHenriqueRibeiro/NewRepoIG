import { NextRequest, NextResponse } from 'next/server';
import { processCustomerInteractionWithAI } from '@/lib/ai/byok-orchestrator';
import { getActiveInstagramSession } from '@/lib/instagram/auth';

// Armazenamento em memória para dados de demonstração em tempo real
export interface SimulatedInteraction {
  id: string;
  time: string;
  origin: 'reels' | 'story' | 'feed' | 'direct';
  buyer: string;
  comment: string;
  storeReply?: string;
  waitTimeFormatted: string;
  status: 'aguardando' | 'respondido' | 'no_vacuo' | 'perdido';
  aiRescued?: boolean;
}

declare global {
  var __simulatedAuditLog: SimulatedInteraction[];
}

if (!global.__simulatedAuditLog) {
  global.__simulatedAuditLog = [];
}

export async function GET() {
  const total = (global.__simulatedAuditLog || []).length;
  const vacuums = (global.__simulatedAuditLog || []).filter((i) => i.status === 'no_vacuo').length;
  return NextResponse.json({
    interactions: global.__simulatedAuditLog || [],
    metrics: {
      totalIntents: total,
      vacuumRate: total > 0 ? Number(((vacuums / total) * 100).toFixed(1)) : 0,
      averageSlaMinutes: total > 0 ? 12.0 : 0,
      estimatedLostRevenueBrl: vacuums * 150.0,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { action, buyer = '@cliente_novo', comment = 'Qual o valor e frete?' } = await request.json();

    const now = new Date();
    const timeFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(
      now.getMonth() + 1
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    if (action === 'new_comment') {
      const newEntry: SimulatedInteraction = {
        id: `int-${Date.now()}`,
        time: timeFormatted,
        origin: 'reels',
        buyer,
        comment,
        waitTimeFormatted: '1 min',
        status: 'aguardando',
      };
      global.__simulatedAuditLog.unshift(newEntry);
      return NextResponse.json({ success: true, item: newEntry });
    }

    if (action === 'trigger_ai_rescue') {
      // Simula o Modo Guarda-Costas ou Modo Total agindo
      const target = global.__simulatedAuditLog.find((i) => i.status === 'aguardando' || i.status === 'no_vacuo');
      if (target) {
        const session = getActiveInstagramSession();
        const storeName = (session?.account?.name && session.account.name !== 'Minha Loja') ? session.account.name : (process.env.INSTAGRAM_ACCOUNT_NAME || 'Quota');
        const username = session?.account?.username || 'app_quota';

        const aiResponse = await processCustomerInteractionWithAI({
          rawComment: target.comment,
          postContext: `Publicação da @${username}`,
          storeName,
        });
        target.storeReply = `[IA ${storeName}] ${aiResponse.suggested_reply}`;
        target.status = 'respondido';
        target.aiRescued = true;
        return NextResponse.json({ success: true, target, aiResponse });
      }
    }

    if (action === 'human_reply') {
      const target = global.__simulatedAuditLog.find((i) => i.status === 'aguardando');
      if (target) {
        target.storeReply = 'Oi! Respondido pela equipe humana na loja.';
        target.status = 'respondido';
        return NextResponse.json({ success: true, target });
      }
    }

    return NextResponse.json({ interactions: global.__simulatedAuditLog });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
