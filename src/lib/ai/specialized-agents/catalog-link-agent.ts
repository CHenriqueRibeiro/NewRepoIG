import type { ISpecializedAgent, SpecializedAgentContext, SpecializedAgentResult } from './types.ts';
import { getServerCatalog, isCatalogPublishable } from '../../catalog/storage.ts';

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
    const storeName = catalog.storeName || ctx.storeName || 'nossa loja';
    const canShareCatalog = isCatalogPublishable(catalog);
    const catalogUrl = canShareCatalog ? `${ctx.appUrl}/${ctx.catalogSlug}` : undefined;

    const isFirstContact = ctx.isFirstContact !== false;
    const cleanUsername = ctx.buyerUsername && ctx.buyerUsername !== 'Cliente' ? ctx.buyerUsername : '';
    const initialGreeting = cleanUsername ? `Oie, ${cleanUsername}!` : 'Oie!';
    const naturalPrefix = cleanUsername ? `${cleanUsername}, ` : '';

    // Se o catálogo NÃO existe ou não foi aprovado para ser divulgado: NÃO ENVIA LINK VAZIO
    if (!canShareCatalog) {
      const replyText = isFirstContact
        ? `${initialGreeting} Que alegria ter você por aqui na *${storeName}*! ✨\n\nNo momento, estamos atualizando nossa vitrine com novos lançamentos. Mas me conta ou me manda o print de qual modelo ou look você viu nos nossos posts ou stories, que eu já vejo a disponibilidade e valores para você agora mesmo! 🛍️`
        : `${naturalPrefix}no momento estamos atualizando nossa vitrine com novos lançamentos! Mas se você viu algum modelo ou look nos nossos posts ou stories, me conta aqui ou me manda o print que eu já vejo a disponibilidade para você agora mesmo! 🛍️`;
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
      ? `${initialGreeting} Que maravilha ter você por aqui! ✨${topics}\n\nVocê pode conferir todas as nossas peças disponíveis, fotos e valores no nosso catálogo oficial:\n👉 ${catalogUrl}\n\nQualquer dúvida sobre algum look ou tamanho, é só me chamar aqui! 🛍️`
      : `${naturalPrefix}você pode conferir todas as nossas peças disponíveis, fotos e valores no nosso catálogo oficial:\n👉 ${catalogUrl}\n\nQualquer dúvida sobre algum look ou tamanho, é só me chamar aqui! 🛍️`;

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
