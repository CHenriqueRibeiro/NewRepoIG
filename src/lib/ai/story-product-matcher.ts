import { callJevSystemOne, isTypeSafeConfigured } from './typesafe-jev-client.ts';
import { analyzeMediaWithVision } from './vision-service.ts';
import { generateEmbedding, cosineSimilarity } from './embedding-service.ts';
import { getServerCatalog } from '../catalog/storage.ts';
import { buildProductCleanUrl } from '../catalog/url-helpers.ts';
import type { ProductItem } from '../catalog/types.ts';
import type { SpecializedAgentContext } from './specialized-agents/types.ts';

export interface WhatsAppStoryDispatchConfig {
  /**
   * Flag de ativação do disparo automático no WhatsApp.
   * Mantida desligada por padrão conforme solicitado pelo usuário (deixado pronto para uso futuro).
   */
  enabled: boolean;
  webhookUrl?: string;
}

export interface StoryProductMatchResult {
  hasMatch: boolean;
  confidence: number;
  engine: 'typesafe_jev_openai' | 'vector_semantic_vision';
  matchedProduct?: ProductItem;
  productLink?: string;
  visualSummary?: string;
  whatsappAction: {
    status: 'standby_ready' | 'dispatched' | 'disabled';
    enabled: boolean;
    storeWhatsAppNumber?: string;
    messageText: string;
    directWhatsAppLink: string;
    dispatchedAt?: string;
  };
}

// Configuração padrão: DISPARO DESATIVADO POR PADRÃO (Pronto para ser ativado quando o usuário desejar)
export const defaultWhatsAppConfig: WhatsAppStoryDispatchConfig = {
  enabled: process.env.ENABLE_WHATSAPP_STORY_DISPATCH === 'true' || false,
  webhookUrl: process.env.WHATSAPP_DISPATCH_WEBHOOK_URL,
};

/**
 * Identifica se uma peça exibida em Story do Instagram está no catálogo da loja
 * combinando OpenAI (Visão Computacional) + TypeSafe AI Jev (System One Matcher),
 * e prepara a ação de disparo de mensagem no WhatsApp.
 */
export async function matchStoryProductWithJevAndOpenAI(
  ctx: SpecializedAgentContext,
  customConfig?: Partial<WhatsAppStoryDispatchConfig>
): Promise<StoryProductMatchResult> {
  const catalog = getServerCatalog(ctx.catalogSlug);
  const products: ProductItem[] = catalog.products || [];
  const storeName = catalog.storeName || ctx.storeName || 'Vitryne Boutique';
  const cleanWhatsapp = (catalog.whatsapp || '').replace(/\D/g, '');

  const config: WhatsAppStoryDispatchConfig = {
    ...defaultWhatsAppConfig,
    ...customConfig,
  };

  const storyIdentifier = ctx.storyUrl || ctx.storyMediaId || '';
  if (!storyIdentifier) {
    return {
      hasMatch: false,
      confidence: 0,
      engine: 'vector_semantic_vision',
      whatsappAction: {
        status: 'disabled',
        enabled: false,
        messageText: '',
        directWhatsAppLink: '',
      },
    };
  }

  // 1. OpenAI Multimodal Vision: inspeciona a imagem/frame do Story
  console.log(`📸 [OpenAI Vision] Inspecionando mídia do Story: ${storyIdentifier.slice(0, 60)}...`);
  const visionAnalysis = await analyzeMediaWithVision({ imageUrl: storyIdentifier, caption: ctx.messageText });
  const visualAttributes = visionAnalysis.attributes;
  const visualSummary = visionAnalysis.canonicalDescription || `${visualAttributes.categoria} ${visualAttributes.cor_principal} ${visualAttributes.detalhes?.join(' ')}`;

  let matchedProduct: ProductItem | undefined;
  let matchConfidence = 0.5;
  let engine: StoryProductMatchResult['engine'] = 'vector_semantic_vision';

  // 2. TypeSafe AI Jev (System One Decisório): avalia se o item existe no catálogo da loja
  if (isTypeSafeConfigured() && products.length > 0) {
    try {
      console.log(`🤖 [TypeSafe Jev] Avaliando se a peça do Story existe no catálogo (${products.length} itens)...`);

      // Monta as opções de produtos para o critério do Jev Choice
      const productCriteria: Record<string, string> = {};
      const candidateProducts = products.slice(0, 25); // Top 25 itens ativos

      for (const p of candidateProducts) {
        productCriteria[p.id] = `Peça: "${p.name}" | Categoria: ${p.category || 'Geral'} | Cores: ${p.colors?.join(', ') || 'N/A'} | Preço: R$ ${p.price?.toFixed(2)}`;
      }
      productCriteria['not_found'] = 'Nenhum dos produtos do catálogo corresponde visualmente à peça do Story.';

      const statePrompt = `Peça Exibida no Story do Instagram:
- Categoria Visual: ${visualAttributes.categoria}
- Cor Principal: ${visualAttributes.cor_principal}
- Estampa / Modelagem: ${visualAttributes.estampa || 'N/A'} / ${visualAttributes.modelagem || 'N/A'}
- Detalhes Visuais: ${visualAttributes.detalhes?.join(', ') || 'Sem detalhes adicionais'}
- Título Sugerido: ${visualAttributes.titulo_sugerido || 'N/A'}
- Mensagem do Seguidor no Direct: "${ctx.messageText}"
- Loja: ${storeName}

Catálogo de Produtos Cadastrados:
${candidateProducts.map((p) => `• [${p.id}] "${p.name}" (Categoria: ${p.category || 'Moda'}, Preço: R$ ${p.price?.toFixed(2)}, Estoque: ${p.stock})`).join('\n')}`;

      const jevDecision = await callJevSystemOne({
        state: statePrompt,
        model: 'jev-latest',
        questions: {
          has_catalog_match: {
            type: 'noul',
            instructions: 'A peça exibida no Story do Instagram está cadastrada no catálogo da loja?',
            criteria: {
              true: 'A imagem do Story corresponde a uma peça que existe no catálogo da loja com alta probabilidade.',
              false: 'O produto do Story não existe no catálogo atual da loja ou é completamente diferente.',
            },
          },
          matched_product_id: {
            type: 'choice',
            instructions: 'Qual produto cadastrado do catálogo corresponde à imagem do Story?',
            criteria: productCriteria,
          },
          should_trigger_whatsapp: {
            type: 'noul',
            instructions: 'Deve preparar a notificação comercial do lead para o WhatsApp?',
            criteria: {
              true: 'Peça identificada e em estoque com oportunidade real de venda.',
              false: 'Peça não localizada ou sem interesse de compra detectado.',
            },
          },
        },
      });

      const matchNoul = jevDecision.answers['has_catalog_match'];
      const productChoice = jevDecision.answers['matched_product_id'];

      const isMatch = matchNoul?.type === 'noul' ? matchNoul.noul >= 0.5 : true;
      const selectedId = productChoice?.type === 'choice' ? productChoice.choice : 'not_found';

      if (isMatch && selectedId && selectedId !== 'not_found') {
        matchedProduct = products.find((p) => p.id === selectedId);
        if (matchedProduct) {
          matchConfidence = (productChoice?.type === 'choice' && typeof productChoice.confidence === 'number')
            ? productChoice.confidence
            : (matchNoul?.type === 'noul' ? matchNoul.noul : 0.9);
          engine = 'typesafe_jev_openai';
          console.log(`🎯 [TypeSafe Jev + OpenAI] Peça do Story identificada no catálogo: "${matchedProduct.name}" (ID: ${matchedProduct.id}, Confiança: ${(matchConfidence * 100).toFixed(0)}%)`);
        }
      }
    } catch (jevErr: any) {
      console.warn(`⚠️ [Jev Story Matching Falha]: ${jevErr.message}. Acionando busca semântica vetorial...`);
    }
  }

  // Fallback Semântico Vetorial se o Jev não identificou ou estiver indisponível
  if (!matchedProduct && products.length > 0) {
    const visualVector = await generateEmbedding(`${visualSummary} ${ctx.messageText}`);
    let bestSim = 0;

    for (const p of products) {
      const pProfile = [p.name, p.category, p.description, p.colors?.join(' '), p.sizes?.join(' ')].filter(Boolean).join(' ');
      const pVector = await generateEmbedding(pProfile);
      const sim = cosineSimilarity(visualVector, pVector);

      if (sim > bestSim) {
        bestSim = sim;
        matchedProduct = p;
      }
    }

    if (bestSim >= 0.15 && matchedProduct) {
      matchConfidence = Math.min(1.0, bestSim + 0.3);
      engine = 'vector_semantic_vision';
    } else {
      matchedProduct = undefined;
    }
  }

  const hasMatch = Boolean(matchedProduct);
  const productLink = matchedProduct
    ? buildProductCleanUrl(ctx.appUrl, ctx.catalogSlug, {
        id: matchedProduct.id,
        title: matchedProduct.name,
        category: matchedProduct.category,
      })
    : undefined;

  // 3. Preparação da Ação de Disparo de Mensagem no WhatsApp (Pronta em Standby)
  let whatsappMessageText = '';
  let directWhatsAppLink = '';
  let whatsappStatus: 'standby_ready' | 'dispatched' | 'disabled' = 'disabled';

  if (hasMatch && matchedProduct) {
    const buyerName = ctx.buyerUsername && ctx.buyerUsername !== 'Cliente' ? `@${ctx.buyerUsername}` : 'Cliente do Instagram';
    const priceText = matchedProduct.price ? `R$ ${matchedProduct.price.toFixed(2)}` : 'Sob consulta';
    const stockStatus = (matchedProduct.stock > 0 || matchedProduct.isInfiniteStock) ? 'Em estoque pronto para envio' : 'Sob encomenda / Últimas unidades';

    whatsappMessageText = `🛍️ *NOVA OPORTUNIDADE DE STORY (IA VITRYNE)* ✨\n\n` +
      `👤 *Lead Instagram:* ${buyerName}\n` +
      `📸 *Peça Identificada no Story:* ${matchedProduct.name}\n` +
      `💰 *Valor da Peça:* ${priceText}\n` +
      `📦 *Status:* ${stockStatus}\n` +
      `🔗 *Link Oficial de Compra:* ${productLink}\n` +
      (ctx.messageText ? `💬 *Mensagem do Seguidor:* "${ctx.messageText}"\n\n` : '\n') +
      `⚡ *Ação Sugerida:* Enviar link de checkout ou reservar tamanho!`;

    if (cleanWhatsapp) {
      directWhatsAppLink = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(whatsappMessageText)}`;
    }

    if (config.enabled) {
      // Disparo automático habilitado (quando o usuário ligar a flag)
      console.log(`🚀 [WhatsApp Story Dispatcher] Disparando mensagem no WhatsApp...`);
      whatsappStatus = 'dispatched';
      // Aqui pode ser chamado o webhook da Evolution API / Z-API / Baileys
      if (config.webhookUrl) {
        try {
          await fetch(config.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetPhone: cleanWhatsapp,
              message: whatsappMessageText,
              product: matchedProduct,
              lead: buyerName,
            }),
          });
        } catch (dispatchErr) {
          console.warn('[WhatsApp Webhook Dispatch Falhou]:', dispatchErr);
        }
      }
    } else {
      // MANTIDO PRONTO EM STANDBY (Conforme solicitado pelo usuário: "pode deixar pronto mas nao vou usar ainda")
      whatsappStatus = 'standby_ready';
      console.log(`ℹ️ [WhatsApp Story Dispatcher] Ação preparada com sucesso em STANDBY (Pronta para ativação futura).`);
    }
  }

  return {
    hasMatch,
    confidence: matchConfidence,
    engine,
    matchedProduct,
    productLink,
    visualSummary,
    whatsappAction: {
      status: whatsappStatus,
      enabled: config.enabled,
      storeWhatsAppNumber: cleanWhatsapp,
      messageText: whatsappMessageText,
      directWhatsAppLink,
      dispatchedAt: whatsappStatus === 'dispatched' ? new Date().toISOString() : undefined,
    },
  };
}
