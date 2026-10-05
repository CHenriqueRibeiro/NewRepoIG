import { intelligentCatalogService } from '../catalog/intelligent-service';
import { generateEmbedding } from './embedding-service';
import type { ProductEntity } from '../catalog/intelligent-types';
import { buildProductCleanUrl, getPublicAppUrl } from '../catalog/url-helpers';
import { getServerCatalog, isCatalogPublishable } from '../catalog/storage';
import { processIncomingInstagramMedia } from '../instagram/sync-pipeline';
import { intentDiscoveryAgent, levenshteinDistance, expandInternetSlang } from './intent-discovery-agent';
import type { CustomerIntentAnalysis } from './intent-discovery-agent';

export interface CustomerInquiryInput {
  storeId: string;
  storeName?: string;
  storeHandle?: string;
  catalogSlug?: string;
  buyerId: string;
  buyerUsername?: string;
  messageText: string;
  storyUrl?: string;
  storyMediaId?: string;
  openAiApiKey?: string;
  appUrl?: string;
}

export interface CustomerInquiryOutput {
  shouldReply: boolean;
  intent: string;
  replyText: string;
  productId?: string;
  productTitle?: string;
  productDirectLink?: string;
  stockStatus: 'available' | 'sold_out' | 'variant_unavailable' | 'unknown';
  processingSource: 'cached_media_relation' | 'auto_cataloged_from_story' | 'conversation_context' | 'hnsw_text_search' | 'generic' | 'silenced';
  cachedAvoidedAiExecution: boolean;
  intentAnalysis?: CustomerIntentAnalysis;
}

/**
 * Busca produtos correspondentes por entidades qualificadas (categoria, atributos, estilo, tamanho)
 */
export function searchMatchingProducts(
  message: string,
  products: ProductEntity[],
  detectedSize?: string
): {
  bestMatch?: ProductEntity;
  matches: ProductEntity[];
  scored: Array<{ product: ProductEntity; score: number }>;
} {
  const expanded = expandInternetSlang(message);
  const norm = expanded
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const words = norm
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?!]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  const stopWords = new Set([
    'para', 'com', 'sem', 'tem', 'voce', 'voces', 'uma', 'uns', 'umas',
    'por', 'que', 'quero', 'queria', 'gostaria', 'estou', 'procurando',
    'ver', 'olhar', 'mostrar', 'algo', 'coisa', 'tipo', 'qual', 'quais',
    'saber', 'sobre', 'favor', 'obrigado', 'obrigada', 'bom', 'boa',
    'dia', 'tarde', 'noite', 'ola', 'oie', 'tudo', 'bem', 'aqui', 'loja',
    'essa', 'esse', 'aquele', 'aquela', 'dessa', 'desse', 'daquele'
  ]);

  const searchTokens = words.filter((w) => !stopWords.has(w));
  const scored: Array<{ product: ProductEntity; score: number }> = [];

  for (const product of products) {
    let score = 0;
    const titleNorm = product.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const catNorm = (product.category || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const descNorm = (product.description || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    // 1. Título completo contido na mensagem
    if (norm.includes(titleNorm)) {
      score += 25;
    }

    // 2. Tokens de busca (com correspondência exata e fuzzy tolerante a erros de digitação)
    const titleWords = titleNorm.split(/\s+/);
    for (const token of searchTokens) {
      const singularToken = token.endsWith('s') ? token.slice(0, -1) : token;
      
      if (titleNorm.includes(token) || titleNorm.includes(singularToken)) {
        score += 10;
      } else {
        // Tolerância a erros de digitação (ex: "vestdo" -> "vestido", "relojo" -> "relogio")
        for (const tw of titleWords) {
          if (tw.length >= 4 && token.length >= 4) {
            const maxDist = tw.length >= 6 ? 2 : 1;
            if (levenshteinDistance(tw, token) <= maxDist || levenshteinDistance(tw, singularToken) <= maxDist) {
              score += 8;
              break;
            }
          }
        }
      }

      if (catNorm.includes(token) || catNorm.includes(singularToken)) {
        score += 9;
      }
      if (descNorm.includes(token) || descNorm.includes(singularToken)) {
        score += 4;
      }

      // Atributos de cor e detalhes
      const cor = (product.attributes?.cor_principal || '').toLowerCase();
      if (cor && (cor.includes(token) || token.includes(cor))) {
        score += 6;
      }
      const modelagem = (product.attributes?.modelagem || '').toLowerCase();
      if (modelagem && modelagem.includes(token)) {
        score += 4;
      }
    }

    // 3. Tamanho
    if (detectedSize && product.variants?.some((v) => v.name.toUpperCase().includes(detectedSize.toUpperCase()) && v.stock_quantity > 0)) {
      score += 5;
    }

    if (score >= 6) {
      scored.push({ product, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const matches = scored.map((s) => s.product);

  return {
    bestMatch: scored.length > 0 ? scored[0].product : undefined,
    matches,
    scored,
  };
}

/**
 * Agente Comercial de Vendas (Commercial Sales Agent)
 * 
 * Papel Exclusivo:
 * - Recebe o diagnóstico e contexto qualificado pelo Agente de Descoberta (`CustomerIntentDiscoveryAgent`).
 * - Não faz match bruto por palavras para adivinhar intenção; confia no contexto estruturado recebido.
 * - Conduz a venda: pesquisa produtos reais no estoque, verifica disponibilidade como fonte da verdade,
 *   gera deep links limpos, recomenda peças e fecha pedidos sem loops repetitivos.
 */
export class CommercialSalesAgent {
  async processCommercialTurn(params: {
    input: CustomerInquiryInput;
    intentAnalysis: CustomerIntentAnalysis;
  }): Promise<CustomerInquiryOutput> {
    const { input, intentAnalysis } = params;
    const {
      storeId,
      storeName = 'Quota',
      storeHandle,
      catalogSlug = 'minha-loja',
      buyerId,
      buyerUsername = 'cliente',
      messageText,
      storyUrl,
      storyMediaId,
      openAiApiKey,
      appUrl: customAppUrl,
    } = input;

    const appUrl = customAppUrl || getPublicAppUrl();
    const cleanText = messageText.trim();
    const catalog = getServerCatalog(catalogSlug);
    const canShareCatalog = isCatalogPublishable(catalog);
    const generalCatalogLink = canShareCatalog ? `${appUrl}/${catalogSlug}` : undefined;

    // Contexto multi-turno persistido
    const convContext = await intelligentCatalogService.getConversationContext(storeId, buyerId);
    const currentTurn = (convContext?.metadata?.turn_count || 0) + 1;
    const greetingAlreadySent = Boolean(convContext?.metadata?.greeting_sent);
    const demandInquiryAlreadySent = Boolean(convContext?.metadata?.demand_inquiry_sent) || currentTurn >= 3;

    // Formatação humanizada do nome do comprador
    const rawUsername = (buyerUsername || '').trim();
    const cleanUsername = rawUsername.replace(/^@+/, '');
    const isGenericUser = !cleanUsername || cleanUsername.toLowerCase() === 'cliente';

    // Determina saudação empática de acordo com a mensagem ou o fuso horário
    const lowerClean = cleanText.toLowerCase();
    let salutation = 'Olá';
    if (lowerClean.includes('bom dia')) {
      salutation = 'Bom dia';
    } else if (lowerClean.includes('boa tarde')) {
      salutation = 'Boa tarde';
    } else if (lowerClean.includes('boa noite')) {
      salutation = 'Boa noite';
    } else {
      const now = new Date();
      const brHour = (now.getUTCHours() - 3 + 24) % 24;
      if (brHour >= 5 && brHour < 12) salutation = 'Bom dia';
      else if (brHour >= 12 && brHour < 18) salutation = 'Boa tarde';
      else salutation = 'Boa noite';
    }
    const nameSalutation = isGenericUser ? salutation : `${salutation}, ${cleanUsername}`;

    let targetProduct: ProductEntity | null = null;
    let processingSource: CustomerInquiryOutput['processingSource'] = 'generic';
    let cachedAvoidedAiExecution = false;

    // =========================================================================
    // 1. RECONHECIMENTO DE MÍDIA / STORY (Cache ou Auto-Cadastro)
    // =========================================================================
    if (storyMediaId || storyUrl) {
      const mediaIdToLookup = storyMediaId || (storyUrl?.match(/\/p\/([^\/]+)/)?.[1]) || storyUrl;
      if (mediaIdToLookup) {
        const media = await intelligentCatalogService.getMediaByInstagramId(mediaIdToLookup);
        if (media) {
          const relation = await intelligentCatalogService.getRelationByMediaId(media.id);
          if (relation?.product_id) {
            targetProduct = await intelligentCatalogService.getProductById(relation.product_id);
            if (targetProduct) {
              processingSource = 'cached_media_relation';
              cachedAvoidedAiExecution = true;
              console.log(`⚡ [Agente Comercial] Mídia do Story vinculada à "${targetProduct.title}". IA economizada!`);
            }
          }
        }
      }

      // Auto-cadastro em tempo real se mídia do Story for inédita
      if (!targetProduct && storyUrl) {
        console.log(`🚀 [Agente Comercial - Auto-Cadastro] Mídia inédita no Story: ${storyUrl}`);
        try {
          const syncResult = await processIncomingInstagramMedia({
            storeId,
            catalogSlug,
            instagramMediaId: storyMediaId || (storyUrl?.match(/asset_id=([^&]+)/)?.[1]) || `story_${Date.now()}`,
            mediaType: 'STORY',
            mediaUrl: storyUrl,
            caption: cleanText.length > 5 && !cleanText.toLowerCase().includes('quanto') && !cleanText.toLowerCase().includes('preço') ? cleanText : undefined,
            openAiApiKey,
          });

          if (syncResult.decision?.matched_product) {
            targetProduct = syncResult.decision.matched_product;
            processingSource = 'auto_cataloged_from_story';
          } else if (syncResult.relation?.product_id) {
            targetProduct = await intelligentCatalogService.getProductById(syncResult.relation.product_id);
            if (targetProduct) processingSource = 'auto_cataloged_from_story';
          }
        } catch (ingestErr) {
          console.error('❌ [Agente Comercial - Erro no Auto-Cadastro]:', ingestErr);
        }
      }
    }

    // =========================================================================
    // 2. CONTINUIDADE DO PRODUTO ANTERIOR (Contexto de Diálogo)
    // =========================================================================
    if (!targetProduct && intentAnalysis.entities.isContinuityOfPreviousProduct && convContext?.current_product_id) {
      const prevProduct = await intelligentCatalogService.getProductById(convContext.current_product_id);
      if (prevProduct) {
        targetProduct = prevProduct;
        processingSource = 'conversation_context';
        cachedAvoidedAiExecution = true;
        console.log(`💬 [Agente Comercial] Continuidade de conversa sobre "${targetProduct.title}".`);
      }
    }

    // =========================================================================
    // 3. CONSULTA AO CATÁLOGO VIA ENTIDADES QUALIFICADAS
    // =========================================================================
    let matchedProducts: ProductEntity[] = [];
    let allProducts: ProductEntity[] = [];

    if (!targetProduct && intentAnalysis.suggestedCommercialAction !== 'greet_warmly' && intentAnalysis.primaryIntent !== 'greeting') {
      allProducts = await intelligentCatalogService.listProducts(storeId, catalogSlug);

      // Busca usando as entidades extraídas pelo Agente de Intenção
      const searchResult = searchMatchingProducts(
        intentAnalysis.entities.specificQuery || cleanText,
        allProducts,
        intentAnalysis.entities.size
      );

      if (searchResult.matches.length === 1) {
        targetProduct = searchResult.matches[0];
        processingSource = 'hnsw_text_search';
      } else if (searchResult.matches.length > 1) {
        const top1 = searchResult.scored[0];
        const top2 = searchResult.scored[1];
        const lowerQuery = (intentAnalysis.entities.specificQuery || cleanText).toLowerCase();
        const titleExact = searchResult.matches.find((p) => lowerQuery.includes(p.title.toLowerCase()));

        if (titleExact) {
          targetProduct = titleExact;
          processingSource = 'hnsw_text_search';
        } else if (top1 && top2 && top1.score >= top2.score + 6) {
          targetProduct = top1.product;
          processingSource = 'hnsw_text_search';
        } else {
          matchedProducts = searchResult.matches;
        }
      } else {
        // Fallback vetorial semântico se disponível
        try {
          const queryEmbedding = await generateEmbedding(cleanText, openAiApiKey);
          const candidates = await intelligentCatalogService.findHnswCandidates(queryEmbedding, storeId, 3);
          if (candidates.length > 0 && candidates[0].similarity > 0.35) {
            targetProduct = candidates[0].product;
            processingSource = 'hnsw_text_search';
          }
        } catch {
          // silencioso
        }
      }
    }

    // =========================================================================
    // 4. AÇÃO COMERCIAL QUANDO UM PRODUTO ALVO FOI IDENTIFICADO
    // =========================================================================
    if (targetProduct) {
      const customerSalutation = isGenericUser ? 'Olá!' : `Olá, ${cleanUsername}!`;

      // REGRA CRÍTICA DO LOJISTA:
      // "quando subir um produto e nao tiver preço e para que diga que ainda nao esta no catalogo e que em breve vai ser colocado,
      //  nao e para ir com valor e etc e muito menos com nome... so e para responder caso seja cadastrado o valor"
      if (!targetProduct.price_cents || targetProduct.price_cents <= 0) {
        await intelligentCatalogService.createPriceConfirmationRequest({
          storeId,
          productId: targetProduct.id,
          productTitle: targetProduct.title,
          productImageUrl: targetProduct.image_url,
          buyerUsername: cleanUsername,
          buyerId,
          inquiryText: cleanText,
        });

        const unpricedReply = `${customerSalutation} Essa peça é uma novidade que acabou de chegar e ainda não está no catálogo com valor oficial, mas em breve vai ser colocada! ✨ Se você quiser, posso avisar você assim que o cadastro com o valor estiver concluído! 😊`;

        return {
          shouldReply: true,
          intent: intentAnalysis.primaryIntent,
          replyText: unpricedReply,
          productId: targetProduct.id,
          productTitle: targetProduct.title,
          stockStatus: 'unknown',
          processingSource,
          cachedAvoidedAiExecution,
          intentAnalysis,
        };
      }

      await intelligentCatalogService.updateConversationContext(
        storeId,
        buyerId,
        targetProduct.id,
        storyMediaId,
        cleanUsername,
        {
          greeting_sent: true,
          demand_inquiry_sent: true,
          turn_count: currentTurn,
          last_intent: intentAnalysis.primaryIntent,
        }
      );

      const stockInfo = await intelligentCatalogService.checkStockAndAvailability(
        targetProduct.id,
        intentAnalysis.entities.size
      );

      const productDirectLink = canShareCatalog
        ? buildProductCleanUrl(appUrl, catalogSlug, targetProduct)
        : undefined;
      const priceFormatted = (targetProduct.price_cents / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });

      let replyText = '';

      // Decisão comercial baseada na intenção qualificada pelo Agente 1
      if (intentAnalysis.primaryIntent === 'size_inquiry' || intentAnalysis.entities.size) {
        const sizeMentioned = intentAnalysis.entities.size;
        if (stockInfo.specificVariant?.available) {
          const priceSnippet = targetProduct.price_cents > 0 ? ` (${priceFormatted})` : '';
          replyText = productDirectLink
            ? `${customerSalutation} Sim, temos o tamanho ${sizeMentioned} do(a) ${targetProduct.title} no estoque${priceSnippet}! ✨\n\nVeja todos os detalhes e garanta a sua escolha aqui:\n${productDirectLink}`
            : `${customerSalutation} Sim, temos o tamanho ${sizeMentioned} do(a) ${targetProduct.title} no estoque${priceSnippet}! ✨\n\nDeseja que eu reserve uma unidade para você? Me confirma seu endereço por aqui!`;
        } else {
          replyText = productDirectLink
            ? `${customerSalutation} ${stockInfo.humanFriendlyMessage}\n\nConfira as opções disponíveis em nosso catálogo:\n${productDirectLink}`
            : `${customerSalutation} ${stockInfo.humanFriendlyMessage}\n\nSe quiser ver outros modelos disponíveis ou encomendar, me avisa por aqui!`;
        }
      } else if (intentAnalysis.primaryIntent === 'price_inquiry') {
        if (targetProduct.price_cents > 0) {
          replyText = productDirectLink
            ? `${customerSalutation} O(a) **${targetProduct.title}** está disponível por ${priceFormatted}! 😊\n${stockInfo.humanFriendlyMessage}\n\nPara ver detalhes completos e opções:\n${productDirectLink}`
            : `${customerSalutation} O(a) **${targetProduct.title}** está disponível por ${priceFormatted}! 😊\n${stockInfo.humanFriendlyMessage}\n\nSe quiser garantir o seu, pode me chamar aqui no direct! ✨`;
        } else {
          await intelligentCatalogService.createPriceConfirmationRequest({
            storeId,
            productId: targetProduct.id,
            productTitle: targetProduct.title,
            productImageUrl: targetProduct.image_url,
            buyerUsername: cleanUsername,
            buyerId,
            inquiryText: cleanText,
          });

          replyText = `${customerSalutation} O(a) **${targetProduct.title}** é uma novidade que acabou de chegar! ✨\nJá avisei nossa equipe para me passar o valor exato para você. Me dá só 1 minutinho que já te confirmo por aqui!`;
        }
      } else if (
        intentAnalysis.primaryIntent === 'purchase_intent' ||
        intentAnalysis.suggestedCommercialAction === 'send_product_checkout'
      ) {
        if (targetProduct.price_cents > 0) {
          replyText = productDirectLink
            ? `Que ótimo gosto, ${isGenericUser ? 'amamos sua escolha' : cleanUsername}! 💖 O(a) **${targetProduct.title}** está disponível (${priceFormatted}).\n\nFinalize seu pedido diretamente por aqui com atendimento ágil:\n${productDirectLink}`
            : `Que ótimo gosto, ${isGenericUser ? 'amamos sua escolha' : cleanUsername}! 💖 O(a) **${targetProduct.title}** está disponível (${priceFormatted}).\n\nDeseja que eu reserve uma unidade para você? Basta me confirmar seu tamanho e endereço por aqui! ✨`;
        } else {
          await intelligentCatalogService.createPriceConfirmationRequest({
            storeId,
            productId: targetProduct.id,
            productTitle: targetProduct.title,
            productImageUrl: targetProduct.image_url,
            buyerUsername: cleanUsername,
            buyerId,
            inquiryText: cleanText,
          });

          replyText = `Que ótimo gosto, ${isGenericUser ? 'amamos sua escolha' : cleanUsername}! 💖 O(a) **${targetProduct.title}** é uma novidade que acabou de chegar!\nJá pedi para nossa equipe liberar a precificação e reserva para você agora mesmo. Aguarde só um instante! ✨`;
        }
      } else {
        replyText = productDirectLink
          ? `${customerSalutation} Sobre o(a) **${targetProduct.title}** 😊\n${stockInfo.humanFriendlyMessage}\n\nConfira fotos, detalhes e disponibilidade em tempo real:\n${productDirectLink}`
          : `${customerSalutation} Sobre o(a) **${targetProduct.title}** 😊\n${stockInfo.humanFriendlyMessage}\n\nSe quiser garantir o seu ou tirar dúvidas, estou à disposição aqui no chat!`;
      }

      return {
        shouldReply: true,
        intent: intentAnalysis.primaryIntent,
        replyText,
        productId: targetProduct.id,
        productTitle: targetProduct.title,
        productDirectLink,
        stockStatus: stockInfo.available ? 'available' : 'sold_out',
        processingSource,
        cachedAvoidedAiExecution,
        intentAnalysis,
      };
    }

    // =========================================================================
    // 5. AÇÃO COMERCIAL: QUALIFICAÇÃO E CATÁLOGO QUANDO NÃO HÁ ITEM ÚNICO
    // =========================================================================

    // A) Saudação Inicial (Nunca despejar links em saudações de primeiro contato)
    if (
      intentAnalysis.suggestedCommercialAction === 'greet_warmly' ||
      intentAnalysis.primaryIntent === 'greeting'
    ) {
      let greetingReply = '';
      if (convContext?.current_product) {
        greetingReply = `${nameSalutation}! Tudo bem? Vi que você estava de olho no(a) ${convContext.current_product.title}! ✨\n\nComo posso te ajudar com ele(a)? Deseja tirar alguma dúvida de tamanho, frete ou prefere o link para garantir o seu?`;
      } else if (greetingAlreadySent) {
        greetingReply = canShareCatalog && generalCatalogLink
          ? `${nameSalutation}! Estou por aqui para te atender com o maior prazer. ✨\n\nMe conta: o que você gostaria de ver hoje? Pode me mandar o que procura ou dar uma olhada em todas as novidades na nossa vitrine:\n${generalCatalogLink}`
          : `${nameSalutation}! Estou por aqui para te atender com o maior prazer. ✨\n\nMe conta: o que você gostaria de ver hoje? Pode me mandar o modelo que procura ou o print de algo que viu nos nossos posts/stories que eu já vejo a disponibilidade pra você!`;
      } else if (lowerClean.includes('como funciona') || lowerClean.includes('como é') || lowerClean.includes('como e')) {
        const handleDisplay = storeHandle ? ` (@${storeHandle.replace(/^@+/, '')})` : '';
        greetingReply = `${nameSalutation}! Tudo bem? Sou o assistente virtual da *${storeName}*${handleDisplay}! ✨\n\nNosso atendimento por aqui é super prático e humanizado: você pode me contar qual produto, serviço ou informação procura, ou me mandar o print de algo que viu nos nossos posts/stories que eu verifico opções, valores e disponibilidade pra você na hora!\n\nComo posso te ajudar hoje?`;
      } else {
        const handleDisplay = storeHandle ? ` (@${storeHandle.replace(/^@+/, '')})` : '';
        greetingReply = `${nameSalutation}! Tudo bem? Sou o assistente virtual da *${storeName}*${handleDisplay}! ✨\n\nComo posso te ajudar hoje? Você procura algum produto ou serviço específico, ou gostaria de mais informações?`;
      }

      await intelligentCatalogService.updateConversationContext(
        storeId,
        buyerId,
        convContext?.current_product_id,
        storyMediaId || convContext?.last_media_id,
        cleanUsername,
        {
          greeting_sent: true,
          turn_count: currentTurn,
          last_intent: 'greeting',
        }
      );

      return {
        shouldReply: true,
        intent: 'greeting',
        replyText: greetingReply,
        productDirectLink: greetingAlreadySent ? generalCatalogLink : undefined,
        stockStatus: 'unknown',
        processingSource: 'generic',
        cachedAvoidedAiExecution: true,
        intentAnalysis,
      };
    }

    // B) Pedido Explícito de Catálogo / Vitrine / Fotos
    if (
      intentAnalysis.suggestedCommercialAction === 'send_catalog_link' ||
      intentAnalysis.primaryIntent === 'catalog_inquiry'
    ) {
      const catalogReply = canShareCatalog && generalCatalogLink
        ? `${nameSalutation}! Com certeza! Aqui está o link da nossa vitrine completa com novidades e opções disponíveis em tempo real:\n${generalCatalogLink}\n\nFique à vontade para conferir! Se tiver qualquer dúvida sobre produtos, serviços ou agendamentos, é só me chamar por aqui que te ajudo com o maior carinho! ✨`
        : `${nameSalutation}! Que maravilha ter você por aqui na *${storeName}*! ✨\n\nNo momento, estamos atualizando nossa vitrine com novos lançamentos. Mas me conta ou me manda o print de qual modelo ou look você viu nos nossos posts ou stories, que eu já vejo a disponibilidade e valores para você agora mesmo! 🛍️`;

      await intelligentCatalogService.updateConversationContext(
        storeId,
        buyerId,
        undefined,
        storyMediaId,
        cleanUsername,
        {
          greeting_sent: true,
          turn_count: currentTurn,
          last_intent: 'catalog_inquiry',
        }
      );

      return {
        shouldReply: true,
        intent: 'catalog_inquiry',
        replyText: catalogReply,
        productDirectLink: generalCatalogLink,
        stockStatus: 'unknown',
        processingSource: 'generic',
        cachedAvoidedAiExecution: false,
        intentAnalysis,
      };
    }

    // C) Consulta de Produtos: Vários encontrados ou Item Específico Fora de Estoque
    const isSpecificCategory = Boolean(intentAnalysis.entities.category);

    if (
      intentAnalysis.suggestedCommercialAction !== 'ask_qualifying_question' &&
      (
        intentAnalysis.suggestedCommercialAction === 'recommend_products' ||
        intentAnalysis.primaryIntent === 'product_inquiry' ||
        isSpecificCategory ||
        matchedProducts.length > 0
      )
    ) {
      let productReply = '';
      if (matchedProducts.length > 0) {
        const topList = matchedProducts.slice(0, 3);
        productReply = `${nameSalutation}! Temos opções lindas que combinam com o que você procura! ✨\n\n`;
        for (const prod of topList) {
          const link = canShareCatalog ? buildProductCleanUrl(appUrl, catalogSlug, prod) : undefined;
          const price = prod.price_cents > 0
            ? ` (${(prod.price_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`
            : '';
          if (link) {
            productReply += `• **${prod.title}**${price}:\n  ${link}\n\n`;
          } else {
            productReply += `• **${prod.title}**${price}\n\n`;
          }
        }
        productReply += canShareCatalog
          ? `Qual dessas opções mais combina com o seu estilo? Se quiser, posso te passar mais fotos e detalhes agora mesmo!`
          : `Qual dessas opções você mais gostou? Me conta aqui que já vejo as fotos e separo para você!`;
      } else if (demandInquiryAlreadySent || isSpecificCategory) {
        // Categoria solicitada sem estoque atual (ex: relógio, tênis, óculos)
        const targetNoun = intentAnalysis.entities.category || intentAnalysis.entities.specificQuery || 'essa peça específica';
        productReply = canShareCatalog && generalCatalogLink
          ? `${nameSalutation}! Anotei a sua preferência! ✨ No momento não temos ${targetNoun} no estoque, mas temos modelos exclusivos disponíveis na nossa vitrine:\n${generalCatalogLink}\n\nSe você viu alguma foto específica nos nossos posts ou stories, pode me mandar o print por aqui que verifico para você!`
          : `${nameSalutation}! Anotei a sua preferência! ✨ No momento não temos ${targetNoun} no estoque pronto para envio.\n\nSe você viu alguma foto específica nos nossos posts ou stories, pode me mandar o print por aqui que verifico com a nossa equipe para você!`;
      } else {
        productReply = canShareCatalog && generalCatalogLink
          ? `${nameSalutation}! Temos opções lindas e novidades incríveis preparadas para você! ✨\n\nVocê pode conferir todas as peças, fotos e disponibilidade em tempo real na nossa vitrine oficial:\n${generalCatalogLink}\n\nSe você procura alguma cor, modelo ou categoria específica (como vestidos, blusas, etc.), é só me contar aqui que eu te ajudo a encontrar agora mesmo!`
          : `${nameSalutation}! Que maravilha ter você por aqui na *${storeName}*! ✨\n\nSe você procura alguma cor, modelo ou look específico (ou viu algo nos nossos posts/stories), pode me mandar o print ou me contar aqui que eu te ajudo com o maior carinho! 💖`;
      }

      await intelligentCatalogService.updateConversationContext(
        storeId,
        buyerId,
        null as any,
        storyMediaId,
        cleanUsername,
        {
          greeting_sent: true,
          demand_inquiry_sent: true,
          turn_count: currentTurn,
          last_intent: 'product_inquiry',
        }
      );

      return {
        shouldReply: true,
        intent: 'product_inquiry',
        replyText: productReply,
        productDirectLink: generalCatalogLink,
        stockStatus: 'unknown',
        processingSource: 'generic',
        cachedAvoidedAiExecution: false,
        intentAnalysis,
      };
    }

    // D) Intenção de Compra Geral / Exploração Inicial ("estou procurando uma roupa")
    if (
      intentAnalysis.primaryIntent === 'purchase_intent' ||
      intentAnalysis.suggestedCommercialAction === 'ask_qualifying_question'
    ) {
      const isSpecificCat = Boolean(intentAnalysis.entities.category);

      let purchaseReply = '';
      if (intentAnalysis.suggestedCommercialAction === 'ask_qualifying_question') {
        purchaseReply = canShareCatalog && generalCatalogLink
          ? `${nameSalutation}! Que maravilha! Vai ser um prazer te ajudar com sua escolha! 💖\n\nVocê pode ver todas as opções e novidades disponíveis diretamente na nossa vitrine digital:\n${generalCatalogLink}\n\nMe conta: o que você tem em mente ou qual estilo/tamanho você procura?`
          : `${nameSalutation}! Que maravilha! Vai ser um prazer te ajudar com sua escolha! 💖\n\nMe conta: o que você tem em mente ou qual estilo/tamanho você procura? Pode me mandar o print de algum look também!`;
      } else if (demandInquiryAlreadySent || isSpecificCat) {
        if (allProducts.length > 0) {
          const topDestaques = allProducts.slice(0, 2);
          purchaseReply = `${nameSalutation}! Temos peças e novidades incríveis que você vai adorar! ✨\n\n`;
          for (const prod of topDestaques) {
            const link = canShareCatalog ? buildProductCleanUrl(appUrl, catalogSlug, prod) : undefined;
            const price = prod.price_cents > 0
              ? ` (${(prod.price_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`
              : '';
            if (link) {
              purchaseReply += `• **${prod.title}**${price}:\n  ${link}\n\n`;
            } else {
              purchaseReply += `• **${prod.title}**${price}\n\n`;
            }
          }
          if (canShareCatalog && generalCatalogLink) {
            purchaseReply += `Você também pode conferir todos os lançamentos atualizados em nossa vitrine oficial:\n${generalCatalogLink}\n\nSe gostar de algum modelo específico ou quiser me mandar o print de algo que viu nos stories, me avisa por aqui!`;
          } else {
            purchaseReply += `Se você gostou de algum modelo específico ou quiser me mandar o print de algo que viu nos stories ou posts, me avisa por aqui que já vejo a disponibilidade e separo para você!`;
          }
        } else {
          purchaseReply = canShareCatalog && generalCatalogLink
            ? `${nameSalutation}! Anotei a sua preferência! ✨ Para conferir todos os lançamentos atualizados com fotos em nossa vitrine oficial:\n${generalCatalogLink}\n\nSe gostar de algum modelo específico ou quiser me mandar o print de algo que viu nos stories, me avisa por aqui que já vejo a disponibilidade e separo para você!`
            : `${nameSalutation}! Anotei a sua preferência! ✨ Se você viu algum modelo específico ou quiser me mandar o print de algo que gostou nos nossos posts ou stories, me avisa por aqui que já vejo a disponibilidade e separo para você com o maior carinho!`;
        }
      } else {
        purchaseReply = canShareCatalog && generalCatalogLink
          ? `${nameSalutation}! Que maravilha! Vai ser um prazer te ajudar com sua escolha! 💖\n\nVocê pode ver todas as opções e novidades disponíveis diretamente na nossa vitrine digital:\n${generalCatalogLink}\n\nMe conta: o que você tem em mente ou qual estilo/tamanho você procura?`
          : `${nameSalutation}! Que maravilha! Vai ser um prazer te ajudar com sua escolha! 💖\n\nMe conta: o que você tem em mente ou qual estilo/tamanho você procura? Pode me mandar o print de algum look também!`;
      }


      await intelligentCatalogService.updateConversationContext(
        storeId,
        buyerId,
        null as any,
        storyMediaId,
        cleanUsername,
        {
          greeting_sent: true,
          demand_inquiry_sent: true,
          turn_count: currentTurn,
          last_intent: 'purchase_intent',
        }
      );

      return {
        shouldReply: true,
        intent: 'purchase_intent',
        replyText: purchaseReply,
        productDirectLink: generalCatalogLink,
        stockStatus: 'unknown',
        processingSource: 'generic',
        cachedAvoidedAiExecution: false,
        intentAnalysis,
      };
    }

    // E) Dúvida sobre Agendamento / Serviços
    if (intentAnalysis.primaryIntent === 'service_inquiry') {
      const serviceReply = `${nameSalutation}! Atendemos com horários e procedimentos agendados na ${storeName}! ✨\n\nQual serviço você gostaria de realizar? Me conta o melhor dia ou horário para eu verificar a disponibilidade na agenda para você!`;

      await intelligentCatalogService.updateConversationContext(
        storeId,
        buyerId,
        undefined,
        storyMediaId,
        cleanUsername,
        {
          greeting_sent: true,
          turn_count: currentTurn,
          last_intent: 'service_inquiry',
        }
      );

      return {
        shouldReply: true,
        intent: 'service_inquiry',
        replyText: serviceReply,
        productDirectLink: generalCatalogLink,
        stockStatus: 'unknown',
        processingSource: 'generic',
        cachedAvoidedAiExecution: false,
        intentAnalysis,
      };
    }

    // F) Dúvida sobre Frete / Envio / Prazos
    if (intentAnalysis.primaryIntent === 'shipping_inquiry') {
      const shippingReply = `${nameSalutation}! Realizamos entregas rápidas na região e envios para todo o Brasil! 📦✨\n\nQual seria o seu CEP ou bairro para eu consultar as opções e prazos certinho para você?`;

      await intelligentCatalogService.updateConversationContext(
        storeId,
        buyerId,
        undefined,
        storyMediaId,
        cleanUsername,
        {
          greeting_sent: true,
          turn_count: currentTurn,
          last_intent: 'shipping_inquiry',
        }
      );

      return {
        shouldReply: true,
        intent: 'shipping_inquiry',
        replyText: shippingReply,
        productDirectLink: generalCatalogLink,
        stockStatus: 'unknown',
        processingSource: 'generic',
        cachedAvoidedAiExecution: false,
        intentAnalysis,
      };
    }

    // G) Dúvida sobre Preços sem produto especificado
    if (intentAnalysis.primaryIntent === 'price_inquiry') {
      const priceReply = `${nameSalutation}! Trabalhamos com valores especiais e excelentes condições! ✨\n\nVocê viu algum produto ou serviço específico nos nossos posts ou stories? Se puder me mandar o nome ou o print, eu já te passo os detalhes e valores certinho agora mesmo! Ou se preferir, pode conferir todos os preços na nossa vitrine:\n${generalCatalogLink}`;

      await intelligentCatalogService.updateConversationContext(
        storeId,
        buyerId,
        undefined,
        storyMediaId,
        cleanUsername,
        {
          greeting_sent: true,
          turn_count: currentTurn,
          last_intent: 'price_inquiry',
        }
      );

      return {
        shouldReply: true,
        intent: 'price_inquiry',
        replyText: priceReply,
        productDirectLink: generalCatalogLink,
        stockStatus: 'unknown',
        processingSource: 'generic',
        cachedAvoidedAiExecution: false,
        intentAnalysis,
      };
    }

    // H) Dúvida sobre Tamanhos sem produto especificado
    if (intentAnalysis.primaryIntent === 'size_inquiry') {
      const sizeReply = `${nameSalutation}! Trabalhamos com diversas opções pensadas para melhor te atender! ✨\n\nQual modelo, especificação ou tamanho você procura hoje? Me conta para eu verificar a disponibilidade exata para você, ou confira nossa grade completa aqui:\n${generalCatalogLink}`;

      await intelligentCatalogService.updateConversationContext(
        storeId,
        buyerId,
        undefined,
        storyMediaId,
        cleanUsername,
        {
          greeting_sent: true,
          turn_count: currentTurn,
          last_intent: 'size_inquiry',
        }
      );

      return {
        shouldReply: true,
        intent: 'size_inquiry',
        replyText: sizeReply,
        productDirectLink: generalCatalogLink,
        stockStatus: 'unknown',
        processingSource: 'generic',
        cachedAvoidedAiExecution: false,
        intentAnalysis,
      };
    }

    // I) Apoio Geral
    const genericReply = greetingAlreadySent
      ? `${nameSalutation}! Estou à sua disposição! Para te atender da melhor forma: você pode me contar o que procura ou conferir todas as novidades disponíveis na nossa vitrine digital:\n${generalCatalogLink} ✨`
      : `${nameSalutation}! Tudo bem? Seja muito bem-vinda(o) à ${storeName}! ✨\n\nComo posso te ajudar hoje? Você procura algum produto, serviço ou informação específica?`;

    await intelligentCatalogService.updateConversationContext(
      storeId,
      buyerId,
      undefined,
      storyMediaId,
      cleanUsername,
      {
        greeting_sent: true,
        turn_count: currentTurn,
        last_intent: intentAnalysis.primaryIntent,
      }
    );

    return {
      shouldReply: true,
      intent: intentAnalysis.primaryIntent,
      replyText: genericReply,
      productDirectLink: greetingAlreadySent ? generalCatalogLink : undefined,
      stockStatus: 'unknown',
      processingSource: 'generic',
      cachedAvoidedAiExecution: false,
      intentAnalysis,
    };
  }
}

export const commercialSalesAgent = new CommercialSalesAgent();

/**
 * Orquestrador Central de Atendimento:
 * 1. Invoca o Agente Exclusivo de Intenção e Descoberta (`CustomerIntentDiscoveryAgent`).
 * 2. Se a intenção for qualificada, passa o contexto estruturado para o Agente Comercial de Vendas (`CommercialSalesAgent`).
 * 3. O Agente Comercial consulta o estoque, formula a resposta persuasiva e envia links/checkouts.
 */
export async function processCustomerMessage(
  input: CustomerInquiryInput
): Promise<CustomerInquiryOutput> {
  const cleanText = (input.messageText || '').trim();

  // Contexto multi-turno existente
  const convContext = await intelligentCatalogService.getConversationContext(
    input.storeId,
    input.buyerId
  );

  // =========================================================================
  // PASSO 1: Agente Exclusivo de Descoberta e Intenção
  // Analisa semanticamente a mensagem, estágio e entidades comerciais
  // =========================================================================
  const intentAnalysis = await intentDiscoveryAgent.analyze({
    messageText: cleanText,
    conversationContext: convContext,
    hasStoryContext: Boolean(input.storyMediaId || input.storyUrl),
    storyUrl: input.storyUrl,
    storyMediaId: input.storyMediaId,
    openAiApiKey: input.openAiApiKey,
  });

  // Se fora do escopo ou encerramento: silêncio absoluto
  if (!intentAnalysis.shouldReply || intentAnalysis.suggestedCommercialAction === 'stay_silent') {
    console.log(
      `🔇 [Agente de Intenção: Silêncio] (${intentAnalysis.primaryIntent}): "${cleanText}". Motivo: ${intentAnalysis.reasoning}`
    );
    return {
      shouldReply: false,
      intent: intentAnalysis.primaryIntent,
      replyText: '',
      stockStatus: 'unknown',
      processingSource: 'silenced',
      cachedAvoidedAiExecution: true,
      intentAnalysis,
    };
  }

  // =========================================================================
  // PASSO 2: Agente Comercial de Vendas
  // Recebe o contexto qualificado e realiza a condução comercial, links e venda
  // =========================================================================
  return commercialSalesAgent.processCommercialTurn({
    input,
    intentAnalysis,
  });
}
