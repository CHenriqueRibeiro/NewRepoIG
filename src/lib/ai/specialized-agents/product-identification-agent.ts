import type { ISpecializedAgent, SpecializedAgentContext, SpecializedAgentResult } from './types.ts';
import { getServerCatalog, isCatalogPublishable } from '../../catalog/storage.ts';
import { buildProductCleanUrl } from '../../catalog/url-helpers.ts';
import type { ProductItem } from '../../catalog/types.ts';
import { generateEmbedding, cosineSimilarity } from '../embedding-service.ts';
import { matchStoryProductWithJevAndOpenAI } from '../story-product-matcher.ts';
import { getFriendlyFirstName } from './name-helper.ts';

/**
 * Agente Especialista: Identificação de Produtos & Estoque
 * Tarefa Única: Localizar a peça desejada no catálogo oficial, checar tamanhos, cores, estoque e responder com detalhes e link direto.
 */
export class ProductIdentificationAgent implements ISpecializedAgent {
  readonly type = 'product_identification';
  readonly name = 'Agente de Identificação de Produto';
  readonly description = 'Localiza a peça solicitada pelo cliente, checa tamanhos, cores, estoque e gera o link direto da peça.';

  async execute(ctx: SpecializedAgentContext): Promise<SpecializedAgentResult> {
    const catalog = getServerCatalog(ctx.catalogSlug);
    const storeName = catalog.storeName || ctx.storeName || 'Quota';
    const products: ProductItem[] = catalog.products || [];
    const canShareCatalog = isCatalogPublishable(catalog);
    const catalogUrl = canShareCatalog ? `${ctx.appUrl}/${ctx.catalogSlug}` : undefined;

    let bestMatch: ProductItem | undefined;
    let storyMatch: any = undefined;

    // Se o cliente interagiu com um Story, aciona o motor TypeSafe Jev + OpenAI Vision
    if (ctx.storyUrl || ctx.storyMediaId) {
      try {
        const storyResult = await matchStoryProductWithJevAndOpenAI(ctx);
        if (storyResult.hasMatch && storyResult.matchedProduct) {
          bestMatch = storyResult.matchedProduct;
          storyMatch = storyResult;
        }
      } catch (err) {
        console.warn('⚠️ [Story Matcher Aviso]: Falha no matcher Jev/OpenAI do Story:', err);
      }
    }

    // 2. Se ainda não identificado por Story, executa Busca Semântica Vetorial por IA no catálogo
    if (!bestMatch) {
      const messageVector = await generateEmbedding(ctx.messageText);
      let highestSimilarity = 0;

      for (const product of products) {
        const productSemanticProfile = [
          product.name,
          product.category,
          product.description,
          product.colors?.join(' '),
          product.sizes?.join(' ')
        ].filter(Boolean).join(' ');

        const productVector = await generateEmbedding(productSemanticProfile);
        const similarity = cosineSimilarity(messageVector, productVector);

        if (similarity > highestSimilarity) {
          highestSimilarity = similarity;
          bestMatch = product;
        }
      }

      // Se a similaridade vetorial for muito baixa, não acopla produto inconsistente
      if (highestSimilarity < 0.05) {
        bestMatch = undefined;
      }
    }

    const isFirstContact = ctx.isFirstContact !== false;
    const firstName = getFriendlyFirstName(ctx.buyerUsername);
    const initialGreeting = firstName ? `Oie, ${firstName}!` : 'Oie!';
    const handleDisplay = ctx.storeHandle ? ` (@${ctx.storeHandle.replace(/^@+/, '')})` : '';

    const rawText = (ctx.messageText || '').trim();

    // 1. Detecção de respostas de continuação/negação a pedidos de print/foto ("não tenho", "não tenho print", "não")
    const isNegationToPrint = /^(não|nao|não tenho|nao tenho|não tirei|nao tirei|não tenho print|nao tenho print|sem print|não tenho foto|nao tenho foto|perdi|não achei|nao achei)\b/i.test(rawText);
    if (isNegationToPrint && !isFirstContact) {
      const reply = `Sem problemas! Me conta então como você gostaria: qual peça, cor ou estilo você tem em mente? Assim eu já vejo as opções perfeitas para você! ✨`;
      return {
        agentType: this.type,
        agentName: this.name,
        shouldReply: true,
        replyText: reply,
        confidence: 0.95,
      };
    }

    if (!bestMatch) {
      // Extrai o item/assunto que o cliente mencionou removendo preâmbulos conversacionais
      let extractedSubject = rawText.replace(/\?+$/, '').trim();
      const prefixRegex = /^(mas\s+|e\s+|quero\s+saber\s+se\s+tem\s+|saber\s+se\s+tem\s+|se\s+tem\s+|vocês\s+têm\s+|voces\s+tem\s+|vocês\s+vendem\s+|voces\s+vendem\s+|tem\s+|procurando\s+|buscando\s+|quero\s+|queria\s+ver\s+|queria\s+|gostaria\s+de\s+|eu\s+queria\s+|qual\s+o\s+preço\s+d[oa]\s+|quanto\s+custa\s+o[a]\s+|o\s+|a\s+|os\s+|as\s+|um\s+|uma\s+|uns\s+|umas\s+)/i;
      while (prefixRegex.test(extractedSubject)) {
        extractedSubject = extractedSubject.replace(prefixRegex, '').trim();
      }

      const hasSpecificQuery = extractedSubject.length >= 3 && !/^(tudo|bem|ola|oie|oi|bom dia|boa tarde|boa noite|catalogo|catálogo|roupa|roupas|pecas|peças|produtos|novidades)$/i.test(extractedSubject);

      let reply = '';

      if (hasSpecificQuery) {
        // O cliente especificou um produto, mas a loja não possui no catálogo ou estoque
        if (isFirstContact) {
          reply = canShareCatalog && catalogUrl
            ? `${initialGreeting} Sou o assistente virtual da *${storeName}*${handleDisplay}! ✨\n\nNo momento não temos **${extractedSubject}** em nosso estoque pronta-entrega. Mas temos outras peças lindas disponíveis na nossa vitrine oficial:\n👉 ${catalogUrl}\n\nSe você viu alguma foto específica nos nossos posts ou stories, pode me mandar o print por aqui!`
            : `${initialGreeting} Sou o assistente virtual da *${storeName}*${handleDisplay}! ✨\n\nNo momento não temos **${extractedSubject}** em nosso estoque pronta-entrega. Se você tiver alguma foto ou print de uma peça que viu nos nossos posts ou stories, pode me mandar aqui que já verifico com a equipe para você!`;
        } else {
          // Conversa em andamento: resposta direta e natural
          reply = canShareCatalog && catalogUrl
            ? `No momento não temos **${extractedSubject}** disponível em nosso estoque pronta-entrega. Você pode conferir os lançamentos disponíveis no nosso catálogo oficial:\n👉 ${catalogUrl}\n\nSe tiver alguma foto de referência ou quiser ver outros modelos, me avisa por aqui!`
            : `No momento não temos **${extractedSubject}** disponível em nosso estoque pronta-entrega. Se você tiver alguma foto de referência de post ou story, pode me mandar o print aqui que eu vejo se conseguimos para você com a nossa equipe!`;
        }
      } else {
        // O cliente não especificou nenhum modelo ainda (exploração inicial)
        if (isFirstContact) {
          reply = canShareCatalog && catalogUrl
            ? `${initialGreeting} Sou o assistente virtual da *${storeName}*${handleDisplay}! ✨ Temos diversas opções maravilhosas disponíveis!\n\nVocê pode conferir todas as nossas peças com fotos, tamanhos e valores atualizados no nosso catálogo oficial:\n👉 ${catalogUrl}\n\nQual modelo ou estilo você está procurando? Me conta aqui que te ajudo a achar! 🛍️`
            : `${initialGreeting} Sou o assistente virtual da *${storeName}*${handleDisplay}! ✨\n\nQual modelo, look ou peça você está procurando? Pode me mandar o print aqui do post ou story que eu já vejo a disponibilidade e te passo os detalhes certinho! 🛍️`;
        } else {
          // Conversa em andamento: pergunta de forma natural sem repetir a saudação inicial
          reply = canShareCatalog && catalogUrl
            ? `Você pode ver todos os modelos atualizados no nosso catálogo oficial:\n👉 ${catalogUrl}\n\nMe conta: que estilo ou modelo você tem em mente?`
            : `Me conta: qual modelo, estilo ou peça você tem em mente? Ou se viu algo nos nossos posts ou stories, pode me mandar o print aqui!`;
        }
      }

      return {
        agentType: this.type,
        agentName: this.name,
        shouldReply: true,
        replyText: reply,
        confidence: 0.85,
      };
    }

    // 3. REGRA DO LOJISTA: Se a peça não tiver valor cadastrado (> 0), informa que em breve estará no catálogo
    const hasPrice = Boolean(bestMatch.price && bestMatch.price > 0);
    if (!hasPrice) {
      const unpricedReply = isFirstContact
        ? `${initialGreeting} Sou o assistente virtual da *${storeName}*${handleDisplay}! ✨\n\nEssa peça é uma novidade que acabou de chegar e ainda não está no catálogo com valor oficial, mas em breve vai ser colocada! ✨ Se você quiser, posso avisar você assim que o cadastro com o valor estiver concluído! 😊`
        : `Essa peça é uma novidade que acabou de chegar e ainda não está no catálogo com valor oficial, mas em breve vai ser colocada! ✨ Se você quiser, posso avisar você assim que o cadastro com o valor estiver concluído! 😊`;

      return {
        agentType: this.type,
        agentName: this.name,
        shouldReply: true,
        replyText: unpricedReply,
        confidence: 1.0,
        metadata: {
          productName: bestMatch.name,
          price: 0,
          storyMatch,
        },
      };
    }

    // 4. Monta link e detalhes do produto com preço cadastrado
    const productLink = canShareCatalog
      ? buildProductCleanUrl(ctx.appUrl, ctx.catalogSlug, {
          id: bestMatch.id,
          title: bestMatch.name,
          category: bestMatch.category,
        })
      : undefined;

    const isService = /\b(servico|serviço|servicos|serviços|barbearia|corte|cabelo|barba|unha|unhas|manicure|pedicure|estetica|estética|lash|cilios|cílios|sobrancelha|sobrancelhas|limpeza de pele|massagem|drenagem|depilacao|depilação|detailing|polimento|lavagem|aluguel|agendamento|procedimento)\b/i.test(`${bestMatch.category || ''} ${bestMatch.name || ''}`);

    const isAvailable = bestMatch.stock > 0 || bestMatch.isInfiniteStock;
    const priceFormatted = `R$ ${bestMatch.price.toFixed(2)}`;
    const stockNotice = isService
      ? (isAvailable ? '✨ *Disponível para agendamento!*' : '⚠️ *Horários sob consulta.*')
      : (isAvailable ? '✨ *Em estoque pronto para envio!*' : '⚠️ *Últimas unidades ou sob consulta.*');

    let sizeDetails = '';
    if (bestMatch.sizes && bestMatch.sizes.length > 0) {
      sizeDetails += `\n📏 *${isService ? 'Opções/Modalidades' : 'Tamanhos'}:* ${bestMatch.sizes.join(', ')}`;
    }
    if (bestMatch.colors && bestMatch.colors.length > 0) {
      sizeDetails += `\n🎨 *${isService ? 'Variações' : 'Cores'}:* ${bestMatch.colors.join(', ')}`;
    }

    const linkSection = isService
      ? (productLink
          ? `\n\nVocê pode conferir todos os detalhes e escolher seu horário diretamente por este link:\n👉 ${productLink}\n\nDeseja que eu reserve um horário para você? ✨`
          : `\n\nDeseja agendar um horário? Basta me confirmar o melhor dia e período por aqui! 📅`)
      : (productLink
          ? `\n\nVocê pode conferir todas as fotos e garantir o seu diretamente por este link exclusivo:\n👉 ${productLink}\n\nDeseja que eu reserve uma unidade para você? 🛍️`
          : `\n\nDeseja que eu reserve uma unidade para você? Basta me confirmar seu tamanho e endereço por aqui! 🛍️`);

    const replyText = isFirstContact
      ? `${initialGreeting} Sou o assistente virtual da *${storeName}*${handleDisplay}! Temos sim o *${bestMatch.name}*! ${stockNotice}\n\n💰 *Valor:* ${priceFormatted}${sizeDetails}${linkSection}`
      : `Temos sim o *${bestMatch.name}*! ${stockNotice}\n\n💰 *Valor:* ${priceFormatted}${sizeDetails}${linkSection}`;

    return {
      agentType: this.type,
      agentName: this.name,
      shouldReply: true,
      replyText: replyText.trim(),
      productLink,
      confidence: 1.0,
      metadata: {
        productName: bestMatch.name,
        price: bestMatch.price,
        storyMatch,
        whatsappStoryAction: storyMatch?.whatsappAction,
      },
    };
  }
}

export const productIdentificationAgent = new ProductIdentificationAgent();
