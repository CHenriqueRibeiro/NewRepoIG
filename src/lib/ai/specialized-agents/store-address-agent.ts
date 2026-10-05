import type { ISpecializedAgent, SpecializedAgentContext, SpecializedAgentResult } from './types.ts';
import { getServerCatalog, isCatalogPublishable } from '../../catalog/storage.ts';

/**
 * Agente Especialista: Localização, Endereço & Retirada
 * Tarefa Única: Informar o endereço físico, horário de funcionamento e regras para retirada no balcão ou via aplicativo.
 */
export class StoreAddressAgent implements ISpecializedAgent {
  readonly type = 'store_address';
  readonly name = 'Agente de Endereço & Retirada';
  readonly description = 'Informa localização física, horário de funcionamento e opções de retirada da loja.';

  async execute(ctx: SpecializedAgentContext): Promise<SpecializedAgentResult> {
    const catalog = getServerCatalog(ctx.catalogSlug);
    const storeName = catalog.storeName || ctx.storeName || 'nossa loja';
    const location = catalog.locationText || 'São Paulo, SP';
    const hours = catalog.schedulingConfig?.businessHours || 'Segunda a Sábado, das 09h às 18h';
    const canShareCatalog = isCatalogPublishable(catalog);
    const catalogUrl = canShareCatalog ? `${ctx.appUrl}/${ctx.catalogSlug}` : undefined;

    const isFirstContact = ctx.isFirstContact !== false;
    const cleanUsername = ctx.buyerUsername && ctx.buyerUsername !== 'Cliente' ? ctx.buyerUsername : '';
    const initialGreeting = cleanUsername ? `Olá, ${cleanUsername}!` : 'Olá!';
    const naturalPrefix = cleanUsername ? `${cleanUsername}, ` : '';

    let replyText = isFirstContact
      ? `${initialGreeting} Seguem as informações do nosso espaço:\n\n📍 *Endereço:* ${location}\n🕒 *Horário de Atendimento:* ${hours}\n\n`
      : `${naturalPrefix}seguem as informações de endereço e retirada do nosso espaço:\n\n📍 *Endereço:* ${location}\n🕒 *Horário de Atendimento:* ${hours}\n\n`;

    if (catalog.shipping?.pickupEnabled) {
      replyText += `🛍️ *Retirada no Local:* Disponível gratuitamente! Você pode reservar as peças e retirar pessoalmente.\n`;
    }

    if (catalog.shipping?.uberFlashEnabled) {
      replyText += `🛵 *Retirada por Moto Uber / 99:* Também liberamos para o motorista do aplicativo retirar seu pacote após confirmação do pedido!\n`;
    }

    if (canShareCatalog && catalogUrl) {
      replyText += `\nCaso queira escolher suas peças antecipadamente, acesse nosso catálogo: ${catalogUrl}`;
    }

    return {
      agentType: this.type,
      agentName: this.name,
      shouldReply: true,
      replyText: replyText.trim(),
      confidence: 1.0,
      metadata: { location, hours },
    };
  }
}

export const storeAddressAgent = new StoreAddressAgent();
