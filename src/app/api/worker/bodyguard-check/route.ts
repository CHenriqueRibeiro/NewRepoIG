import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis/locks';
import { processCustomerInteractionWithAI } from '@/lib/ai/byok-orchestrator';
import { instagramClient } from '@/lib/instagram/client';

/**
 * Worker do Modo Guarda-Costas:
 * Invocado pelo Upstash QStash 15 minutos após a pergunta do seguidor.
 * - Cenário A (Atendido): Status mudou para RESPONDIDO_HUMANO -> Encerra sem custo de IA.
 * - Cenário B (Vácuo): Status ainda é PENDENTE_HUMANO -> IA assume e fecha a venda na hora!
 */
export async function POST(request: NextRequest) {
  try {
    const { commentId, fromHandle, text, pendingKey } = await request.json();

    const currentStatus = await redis.get<string>(pendingKey);

    if (currentStatus === 'RESPONDIDO_HUMANO') {
      console.log(`[Modo Guarda-Costas] Cliente ${fromHandle} já foi atendido pela equipe humana. Nenhuma IA acionada.`);
      return NextResponse.json({ status: 'already_handled_by_human', cost: 0 });
    }

    if (currentStatus === 'PENDENTE_HUMANO' || !currentStatus) {
      console.log(`[Modo Guarda-Costas] VÁCUO DETECTADO! 15 minutos sem resposta para ${fromHandle}. Acionando IA de Resgate...`);

      const aiResponse = await processCustomerInteractionWithAI({
        rawComment: text,
        postContext: 'Post no Instagram - Vestido ou Conjunto em Destaque',
        storeName: 'Vitryne Boutique',
      });

      const checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/demo-resgate`;
      const replyMessage = `Oi ${fromHandle}! Sentimos muito pela demora, nossa equipe estava em atendimento na loja física. Mas já vim te ajudar: ${aiResponse.suggested_reply} Se quiser garantir antes que esgote: ${checkoutUrl}`;

      await instagramClient.sendPrivateReply({
        commentId,
        messageText: replyMessage,
      });

      // Atualiza status no Redis
      await redis.set(pendingKey, 'RESGATADO_POR_IA');

      return NextResponse.json({
        status: 'rescued_by_ai',
        buyer: fromHandle,
        aiIntent: aiResponse.intent,
      });
    }

    return NextResponse.json({ status: 'completed' });
  } catch (error: any) {
    console.error('[Bodyguard Check Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
