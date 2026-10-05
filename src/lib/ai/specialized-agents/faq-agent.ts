import type { ISpecializedAgent, SpecializedAgentContext, SpecializedAgentResult } from './types.ts';
import { getServerCatalog, isCatalogPublishable } from '../../catalog/storage.ts';
import { getFriendlyFirstName } from './name-helper.ts';

/**
 * Agente Especialista: FAQ & Saudações Cordiais
 * Tarefa Única: Responder saudações, dúvidas frequentes (promoções, envio, atacado, funcionamento) de forma dinâmica, humana e acolhedora.
 */
export class FaqAgent implements ISpecializedAgent {
  readonly type = 'faq_general';
  readonly name = 'Agente de FAQ & Boas-Vindas';
  readonly description = 'Responde saudações, esclarece dúvidas básicas e conduz o cliente para a vitrine.';

  async execute(ctx: SpecializedAgentContext): Promise<SpecializedAgentResult> {
    const catalog = getServerCatalog(ctx.catalogSlug);
    const storeName = catalog.storeName || ctx.storeName || 'Quota';
    const canShareCatalog = isCatalogPublishable(catalog);
    const catalogUrl = canShareCatalog ? `${ctx.appUrl}/${ctx.catalogSlug}` : undefined;

    const isFirstContact = ctx.isFirstContact !== false;
    const firstName = getFriendlyFirstName(ctx.buyerUsername);
    const text = (ctx.messageText || '').toLowerCase().trim();

    // 1. Perguntas sobre Promoção / Descontos / Ofertas
    const isPromoQuery = /promo[çc][aã]o|promo[çc][oõ]es|desconto|liquida[çc][aã]o|oferta|sald[aã]o|pre[çc]o especial/i.test(text);
    if (isPromoQuery) {
      if (canShareCatalog && catalogUrl) {
        return {
          agentType: this.type,
          agentName: this.name,
          shouldReply: true,
          replyText: `Temos opções e novidades com valores super especiais! ✨\n\nVocê pode conferir as peças disponíveis direto na nossa vitrine:\n👉 ${catalogUrl}\n\nSe você procura alguma peça em especial (como vestidos, blusas ou conjuntos), me conta aqui que eu te ajudo! 💖`,
          confidence: 0.95,
          metadata: { catalogUrl },
        };
      }
      return {
        agentType: this.type,
        agentName: this.name,
        shouldReply: true,
        replyText: `Temos novidades e peças com valores super especiais! ✨ Qual tipo de peça você procura (vestidos, blusas, conjuntos)? Me conta aqui que te mostro as opções disponíveis! 💖`,
        confidence: 0.95,
      };
    }

    // 2. Perguntas sobre Envio / Frete / Entrega
    const isShippingQuery = /envio|envia|frete|entrega|entregam|correios|sedex|pac|pacote|manda pra|chega em/i.test(text);
    if (isShippingQuery) {
      return {
        agentType: this.type,
        agentName: this.name,
        shouldReply: true,
        replyText: `Nós enviamos para todo o Brasil com frete seguro e também temos retirada no local! 📦 Se quiser, me passa seu CEP ou me conta qual peça você gostou que eu já vejo prazos e valores para você! ✨`,
        confidence: 0.95,
      };
    }

    // 3. Perguntas sobre Atacado / Revenda
    const isWholesaleQuery = /atacado|revenda|revender|lojista|pre[çc]o de atacado/i.test(text);
    if (isWholesaleQuery) {
      return {
        agentType: this.type,
        agentName: this.name,
        shouldReply: true,
        replyText: `Trabalhamos com condições especiais para pedidos em maior quantidade! ✨ Me conta quais peças e quantidades você tem em mente que eu te passo as opções!`,
        confidence: 0.95,
      };
    }

    // 4. Primeiro contato / Boas-vindas
    if (isFirstContact) {
      const greeting = firstName ? `Olá, ${firstName}!` : 'Olá!';
      let reply = `${greeting} Tudo bem por aí? É um prazer atender você na *${storeName}*! ✨\n\nNós trabalhamos com envio para todo o Brasil e retirada no local.`;
      if (canShareCatalog && catalogUrl) {
        reply += ` Você pode ver todas as nossas peças disponíveis com fotos, tamanhos e valores na nossa vitrine:\n👉 ${catalogUrl}\n\nSe tiver qualquer dúvida ou quiser ajuda para escolher seu look, estou à disposição!`;
      } else {
        reply += ` Se você procura algum modelo ou quiser tirar dúvidas de tamanhos e modelos, pode me contar aqui que eu te ajudo com o maior carinho! 💖`;
      }
      return {
        agentType: this.type,
        agentName: this.name,
        shouldReply: true,
        replyText: reply,
        confidence: 0.95,
        metadata: { catalogUrl },
      };
    }

    // 5. Turnos seguintes: Saudações repetidas ("Oi", "Tudo bem", "Olá" em turnos seguintes)
    const isJustGreeting = /^(oi|ol[aá]|oie|tudo bem|tudo bom|bom dia|boa tarde|boa noite|opa)\b/i.test(text);
    if (isJustGreeting) {
      return {
        agentType: this.type,
        agentName: this.name,
        shouldReply: true,
        replyText: `Oi de novo! ✨ Como posso te ajudar agora? Procura alguma peça ou gostaria de tirar alguma dúvida?`,
        confidence: 0.95,
      };
    }

    // 6. Resposta aberta para outras dúvidas institucionais (sem nunca repetir o texto fixo de frete)
    return {
      agentType: this.type,
      agentName: this.name,
      shouldReply: true,
      replyText: `Com certeza! Me conta melhor o que você procura ou se viu alguma peça nos nossos posts e stories, que eu já te passo todos os detalhes de tamanhos e valores com o maior carinho! 💖`,
      confidence: 0.9,
    };
  }
}

export const faqAgent = new FaqAgent();
