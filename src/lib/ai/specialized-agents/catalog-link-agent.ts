import type { ISpecializedAgent, SpecializedAgentContext, SpecializedAgentResult } from './types.ts';
import { getServerCatalog, isCatalogPublishable } from '../../catalog/storage.ts';
import { getFriendlyFirstName } from './name-helper.ts';

/**
 * Agente Especialista: Envio de Link do Catálogo
 * Tarefa Única: Compartilhar o link da vitrine virtual da loja para o cliente explorar todos os produtos.
 */
export class CatalogLinkAgent implements ISpecializedAgent {
  readonly type = 'catalog_link';
  readonly name = 'Agente de Envio de Catálogo';
  readonly description = 'Fornece o link oficial da vitrine virtual e convida o cliente a conhecer as novidades.';

  async execute(ctx: SpecializedAgentContext): Promise<SpecializedAgentResult> {
    const catalog = getServerCatalog(ctx.catalogSlug);
    const storeName = catalog.storeName || ctx.storeName || 'Quota';
    const canShareCatalog = isCatalogPublishable(catalog);
    const catalogUrl = canShareCatalog ? `${ctx.appUrl}/${ctx.catalogSlug}` : undefined;

    const isFirstContact = ctx.isFirstContact !== false;
    const firstName = getFriendlyFirstName(ctx.buyerUsername);
    const initialGreeting = firstName ? `Oie, ${firstName}!` : 'Oie!';
    const handleDisplay = ctx.storeHandle ? ` (@${ctx.storeHandle.replace(/^@+/, '')})` : '';

    // Se o catálogo NÃO existe ou não foi aprovado para ser divulgado: NÃO ENVIA LINK VAZIO
    if (!canShareCatalog) {
      const replyText = isFirstContact
        ? `${initialGreeting} Sou o assistente virtual da *${storeName}*${handleDisplay}! ✨\n\nNo momento, estamos atualizando nossa vitrine com novos lançamentos. Mas me conta ou me manda o print de qual modelo ou look você viu nos nossos posts ou stories, que eu já vejo a disponibilidade e valores para você agora mesmo! 🛍️`
        : `No momento estamos atualizando nossa vitrine com novos lançamentos! Mas se você viu algum modelo ou look nos nossos posts ou stories, me conta aqui ou me manda o print que eu já vejo a disponibilidade para você agora mesmo! 🛍️`;
      return {
        agentType: this.type,
        agentName: this.name,
        shouldReply: true,
        replyText,
        confidence: 0.95,
      };
    }
    
    // Identifica se há categorias/tópicos em destaque
    const topics = catalog.topics && catalog.topics.length > 0 ? ` Temos coleções completas de ${catalog.topics.slice(0, 3).join(', ')} e muito mais!` : '';

    const replyText = isFirstContact
      ? `${initialGreeting} Sou o assistente virtual da *${storeName}*${handleDisplay}! ✨ Que maravilha ter você por aqui!${topics}\n\nVocê pode conferir todas as nossas peças disponíveis, fotos e valores no nosso catálogo oficial:\n👉 ${catalogUrl}\n\nQualquer dúvida sobre algum look ou tamanho, é só me chamar aqui! 🛍️`
      : `Você pode conferir todas as nossas peças disponíveis, fotos e valores no nosso catálogo oficial:\n👉 ${catalogUrl}\n\nQualquer dúvida sobre algum look ou tamanho, é só me chamar aqui! 🛍️`;

    return {
      agentType: this.type,
      agentName: this.name,
      shouldReply: true,
      replyText,
      confidence: 1.0,
      metadata: { catalogUrl },
    };
  }
}

export const catalogLinkAgent = new CatalogLinkAgent();
