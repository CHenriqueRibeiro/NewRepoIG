import type { ISpecializedAgent, SpecializedAgentContext, SpecializedAgentResult } from './types.ts';
import { getServerCatalog } from '../../catalog/storage.ts';

/**
 * Agente Especialista: Transbordo para Atendimento Humano
 * Tarefa Única: Acalmar o cliente em situações de reclamação ou pedido de humano e transferir para a equipe.
 */
export class HumanHandoffAgent implements ISpecializedAgent {
  readonly type = 'human_handoff';
  readonly name = 'Agente de Transbordo Humano';
  readonly description = 'Transfere o atendimento para uma pessoa da equipe em casos de insatisfação ou pedido explícito.';

  async execute(ctx: SpecializedAgentContext): Promise<SpecializedAgentResult> {
    const catalog = getServerCatalog(ctx.catalogSlug);
    const storeName = catalog.storeName || ctx.storeName || 'Loja';
    const cleanWhatsapp = catalog.whatsapp?.replace(/\D/g, '');

    const greeting = ctx.buyerUsername && ctx.buyerUsername !== 'Cliente' ? `Olá, ${ctx.buyerUsername}!` : 'Olá!';

    let replyText = `${greeting} Compreendo perfeitamente! Já notifiquei nossa equipe responsável e um dos nossos atendentes vai assumir a conversa para ajudar você com total atenção.`;

    if (cleanWhatsapp) {
      replyText += `\n\nCaso prefira atendimento imediato via WhatsApp, você também pode nos chamar diretamente no link:\n👉 https://wa.me/${cleanWhatsapp}`;
    }

    return {
      agentType: this.type,
      agentName: this.name,
      shouldReply: true,
      replyText,
      confidence: 1.0,
      metadata: { handoffTriggered: true },
    };
  }
}

export const humanHandoffAgent = new HumanHandoffAgent();
