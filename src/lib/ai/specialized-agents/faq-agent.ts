import type { ISpecializedAgent, SpecializedAgentContext, SpecializedAgentResult } from './types.ts';
import { getServerCatalog, isCatalogPublishable } from '../../catalog/storage.ts';

/**
 * Agente Especialista: FAQ & Saudações Cordiais
 * Tarefa Única: Responder dúvidas comuns e cumprimentos acolhendo o cliente e abrindo portas para a compra.
 */
export class FaqAgent implements ISpecializedAgent {
  readonly type = 'faq_general';
  readonly name = 'Agente de FAQ & Boas-Vindas';
  readonly description = 'Responde saudações, esclarece dúvidas básicas e conduz o cliente para a vitrine.';

  async execute(ctx: SpecializedAgentContext): Promise<SpecializedAgentResult> {
    const catalog = getServerCatalog(ctx.catalogSlug);
    const storeName = catalog.storeName || ctx.storeName || 'Loja';
    const canShareCatalog = isCatalogPublishable(catalog);
    const catalogUrl = canShareCatalog ? `${ctx.appUrl}/${ctx.catalogSlug}` : undefined;

    const isFirstContact = ctx.isFirstContact !== false;
    const cleanUsername = ctx.buyerUsername && ctx.buyerUsername !== 'Cliente' ? ctx.buyerUsername : '';
    const initialGreeting = cleanUsername ? `Olá, ${cleanUsername}!` : 'Olá!';
    const naturalPrefix = cleanUsername ? `${cleanUsername}, ` : '';

    let replyText = isFirstContact
      ? `${initialGreeting} Tudo bem por aí? É um prazer atender você na *${storeName}*! ✨\n\nNós trabalhamos com envio para todo o Brasil e retirada no local.`
      : `${naturalPrefix}com certeza! Nós trabalhamos com envio para todo o Brasil e retirada no local.`;
    if (canShareCatalog && catalogUrl) {
      replyText += ` Você pode ver todas as nossas peças disponíveis com fotos, tamanhos e valores atualizados na nossa vitrine:\n👉 ${catalogUrl}\n\nSe tiver qualquer dúvida ou quiser ajuda para montar seu look, estou à disposição!`;
    } else {
      replyText += ` Se você procura algum modelo ou quiser tirar dúvidas de tamanhos e modelos, pode me contar aqui que eu te ajudo com o maior carinho! 💖`;
    }

    return {
      agentType: this.type,
      agentName: this.name,
      shouldReply: true,
      replyText,
      confidence: 0.95,
      metadata: { catalogUrl },
    };
  }
}

export const faqAgent = new FaqAgent();
