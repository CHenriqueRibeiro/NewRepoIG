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
          replyText: `Temos opções e novidades com valores super especiais! ✨\n\nVocê pode conferir todas as opções disponíveis direto na nossa vitrine:\n👉 ${catalogUrl}\n\nSe você procura algum produto ou serviço em especial, me conta aqui que eu te ajudo! 💖`,
          confidence: 0.95,
          metadata: { catalogUrl },
        };
      }
      return {
        agentType: this.type,
        agentName: this.name,
        shouldReply: true,
        replyText: `Temos novidades e opções com valores super especiais! ✨ Qual tipo de produto ou serviço você procura? Me conta aqui que te mostro as opções disponíveis! 💖`,
        confidence: 0.95,
      };
    }

    // 2. Perguntas sobre Envio / Frete / Entrega / CEP
    const isShippingQuery = /envio|envia|enviam|frete|entrega|entregam|entregas|correios|sedex|pac|pacote|transportadora|cep|manda pra|manda para|chega em/i.test(text) || /\b\d{5}-?\d{3}\b/.test(text);
    if (isShippingQuery) {
      const cepMatch = text.match(/\b\d{5}-?\d{3}\b/);
      const greeting = isFirstContact && firstName ? `Olá, ${firstName}! ` : '';

      let replyText = '';
      if (cepMatch) {
        replyText = `${greeting}Enviamos sim para o seu CEP (${cepMatch[0]})! 📦✨ Trabalhamos com envio seguro para todo o Brasil via Correios e transportadora, além de retirada no local. Me conta qual produto ou item você tem interesse para eu calcular o prazo e valor certinho para o seu endereço!`;
      } else {
        replyText = `${greeting}Enviamos sim para todo o Brasil! 📦✨ Trabalhamos com envio seguro via Correios, transportadora e também temos opção de retirada no local. Me passa o seu CEP e qual item você gostou que eu já calculo o prazo e valor certinho para você!`;
      }

      return {
        agentType: this.type,
        agentName: this.name,
        shouldReply: true,
        replyText,
        confidence: 0.98,
      };
    }

    // 3. Perguntas sobre Atacado / Revenda
    const isWholesaleQuery = /atacado|revenda|revender|lojista|pre[çc]o de atacado/i.test(text);
    if (isWholesaleQuery) {
      return {
        agentType: this.type,
        agentName: this.name,
        shouldReply: true,
        replyText: `Trabalhamos com condições especiais para pedidos em maior quantidade! ✨ Me conta quais produtos ou serviços e quantidades você tem em mente que eu te passo as opções!`,
        confidence: 0.95,
      };
    }

    // 4. Primeiro contato / Boas-vindas (Apresentação oficial com o nome do perfil do Instagram)
    if (isFirstContact) {
      const greeting = firstName ? `Olá, ${firstName}!` : 'Olá!';
      const handleDisplay = ctx.storeHandle ? ` (@${ctx.storeHandle.replace(/^@+/, '')})` : '';
      let reply = `${greeting} Tudo bem por aí? Sou o assistente virtual da *${storeName}*${handleDisplay}! ✨ É um prazer atender você!\n\nNós trabalhamos com envio para todo o Brasil e retirada no local.`;
      if (canShareCatalog && catalogUrl) {
        reply += ` Você pode ver todas as nossas opções disponíveis com fotos, detalhes e valores na nossa vitrine:\n👉 ${catalogUrl}\n\nSe tiver qualquer dúvida ou quiser ajuda para escolher seu produto ou serviço, estou à disposição!`;
      } else {
        reply += ` Se você procura algum produto, serviço ou quiser tirar dúvidas de opções e horários, pode me contar aqui que eu te ajudo com o maior carinho! 💖`;
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
        replyText: `Oi de novo! ✨ Aqui é da equipe da *${storeName}*. Como posso te ajudar agora? Procura algum produto, serviço ou gostaria de tirar alguma dúvida?`,
        confidence: 0.95,
      };
    }

    // 6. Resposta aberta para outras dúvidas institucionais (sem nunca repetir o texto fixo de frete)
    return {
      agentType: this.type,
      agentName: this.name,
      shouldReply: true,
      replyText: `Com certeza! Me conta melhor o que você procura ou se viu algum produto ou serviço nos nossos posts e stories, que eu já te passo todos os detalhes, valores e disponibilidade com o maior carinho! 💖`,
      confidence: 0.9,
    };
  }
}

export const faqAgent = new FaqAgent();
