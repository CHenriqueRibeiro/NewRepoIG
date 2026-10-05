import type { ISpecializedAgent, SpecializedAgentContext, SpecializedAgentResult } from './types.ts';
import { getServerCatalog, isCatalogPublishable } from '../../catalog/storage.ts';
import { formatPixKeyDisplay, getPixKeyTypeLabel } from '../../pix/brcode.ts';
import { getFriendlyFirstName } from './name-helper.ts';
import { faqAgent } from './faq-agent.ts';

/**
 * Agente Especialista: Pagamentos & PIX
 * Tarefa Única: Auxiliar no pagamento, fornecer a chave PIX oficial da loja e orientar o envio de comprovante no WhatsApp.
 */
export class CheckoutPixAgent implements ISpecializedAgent {
  readonly type = 'checkout_pix';
  readonly name = 'Agente de Pagamento & PIX';
  readonly description = 'Fornece a chave PIX da loja, dados do titular e instruções para confirmação do pedido.';

  async execute(ctx: SpecializedAgentContext): Promise<SpecializedAgentResult> {
    const rawText = (ctx.messageText || '').toLowerCase().trim();
    const isExplicitPayment = /\b(pix|pagar|pagamento|transfer[êe]ncia|banco|comprovante|chave|qr code|copia e cola)\b/i.test(rawText);
    const isShippingOrCep = /\b(frete|entrega|entregam|entregas|envia|enviam|envio|correios|sedex|pac|transportadora|cep)\b/i.test(rawText) || /\b\d{5}-?\d{3}\b/.test(rawText);

    // Salvaguarda: Se a pergunta for sobre envio/frete/CEP sem menção de pagamento, delega ao FaqAgent
    if (isShippingOrCep && !isExplicitPayment) {
      return faqAgent.execute(ctx);
    }

    const catalog = getServerCatalog(ctx.catalogSlug);
    const pConfig = catalog.paymentConfig;
    const storeName = catalog.storeName || ctx.storeName || 'Quota';
    const canShareCatalog = isCatalogPublishable(catalog);
    const catalogUrl = canShareCatalog ? `${ctx.appUrl}/${ctx.catalogSlug}` : undefined;

    const firstName = getFriendlyFirstName(ctx.buyerUsername);
    const greeting = ctx.isFirstContact !== false && firstName ? `Perfeito, ${firstName}!` : 'Perfeito!';

    if (!pConfig?.pixEnabled || !pConfig.pixKey) {
      // Se a loja tem catálogo aprovado com produtos, direciona para a sacola
      if (canShareCatalog && catalogUrl) {
        const fallbackText = `${greeting} Para concluir sua compra com segurança, você pode adicionar as peças desejadas diretamente na sua sacola e escolher a melhor forma de pagamento:\n👉 ${catalogUrl}\n\nLá você confere os valores certinhos com frete e finaliza em 1 clique!`;
        return {
          agentType: this.type,
          agentName: this.name,
          shouldReply: true,
          replyText: fallbackText,
          confidence: 0.9,
        };
      }

      // Se o catálogo NÃO existe ou não foi aprovado para divulgação: ZERO LINKS
      const directText = `${greeting} Que ótimo! Para combinarmos a sua compra com pagamento via PIX com total segurança: me conta qual peça ou tamanho você escolheu (ou pode me mandar o print dela por aqui). Vou conferir a disponibilidade com a nossa equipe e já te passo a chave PIX e dados de entrega direto por aqui! ✨`;
      return {
        agentType: this.type,
        agentName: this.name,
        shouldReply: true,
        replyText: directText,
        confidence: 0.9,
      };
    }

    const keyTypeLabel = getPixKeyTypeLabel(pConfig.pixKeyType);
    const visualKey = formatPixKeyDisplay(pConfig.pixKey, pConfig.pixKeyType);
    const beneficiary = pConfig.pixBeneficiaryName || storeName;

    let replyText = `${greeting} Seguem os dados oficiais para pagamento via *PIX*:\n\n🔑 *Chave PIX (${keyTypeLabel}):* ${visualKey}\n👤 *Titular / Beneficiário:* ${beneficiary}\n📍 *Cidade:* ${pConfig.pixBeneficiaryCity || 'São Paulo'}\n\nApós realizar a transferência, basta enviar o comprovante aqui para separarmos seu pedido imediatamente! ✨`;

    if (canShareCatalog && catalogUrl) {
      replyText += `\n\nSe ainda não escolheu os tamanhos ou frete, monte sua sacola por aqui:\n👉 ${catalogUrl}`;
    }

    return {
      agentType: this.type,
      agentName: this.name,
      shouldReply: true,
      replyText: replyText.trim(),
      confidence: 1.0,
      metadata: {
        pixKey: visualKey,
        keyType: keyTypeLabel,
        beneficiary,
        catalogUrl,
      },
    };
  }
}

export const checkoutPixAgent = new CheckoutPixAgent();
