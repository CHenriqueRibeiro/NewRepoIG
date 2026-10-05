import {
  ExtractedVideoFrame,
  InstagramMediaEntity,
  InstagramMediaProductRelation,
  MatchDecisionResult,
  ProductEntity,
} from '../catalog/intelligent-types';
import { sampleRepresentativeFrames } from '../ai/video-frame-sampler';
import { analyzeMediaWithVision } from '../ai/vision-service';
import { generateEmbedding } from '../ai/embedding-service';
import { evaluateProductMatches } from '../ai/attribute-matcher';
import { intelligentCatalogService } from '../catalog/intelligent-service';
import { getServerCatalog, saveServerCatalog } from '../catalog/storage';
import { ProductItem } from '../catalog/types';

export interface ProcessMediaParams {
  storeId: string;
  catalogSlug?: string;
  instagramMediaId: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'STORY' | 'REEL';
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  permalink?: string;
  timestamp?: string;
  openAiApiKey?: string;
}

export interface SyncPipelineResult {
  media: InstagramMediaEntity;
  relation: InstagramMediaProductRelation;
  decision: MatchDecisionResult;
  isDuplicateSkipped: boolean;
}

/**
 * Pipeline Central de Sincronização Inteligente do Instagram:
 * Executa o fluxo completo com máxima automação e custo mínimo de IA:
 * 1. Idempotência por instagram_media_id (nunca reprocessa mídia já conhecida)
 * 2. Seleção inteligente de frames para vídeos/stories/reels
 * 3. Análise visual OpenAI Vision com atributos dinâmicos em JSON
 * 4. Geração de embedding vetorial de 1536 dimensões
 * 5. Busca rápida de produtos candidatos via índice HNSW (pgvector)
 * 6. Comparação profunda de atributos
 * 7. Decisão estrita (Match Forte / Dúvida / Sugestão de Novo Produto)
 * 8. Alimentação contínua da Memória Visual do Produto
 */
export async function processIncomingInstagramMedia(
  params: ProcessMediaParams
): Promise<SyncPipelineResult> {
  const {
    storeId,
    instagramMediaId,
    mediaType,
    mediaUrl,
    thumbnailUrl,
    caption,
    permalink,
    timestamp,
    openAiApiKey,
  } = params;

  console.log(`\n📸 ==================== [PIPELINE INSTAGRAM MÍDIA] ====================`);
  console.log(`🆔 ID Meta: ${instagramMediaId} | Tipo: ${mediaType}`);
  console.log(`🔗 URL: ${mediaUrl ? mediaUrl.slice(0, 70) : 'N/A'}...`);
  console.log(`📝 Legenda: "${caption || 'Sem legenda'}"`);

  // 1. CHECAGEM DE IDEMPOTÊNCIA ESTRITA
  const existingMedia = await intelligentCatalogService.getMediaByInstagramId(instagramMediaId);
  if (existingMedia && existingMedia.status === 'processed') {
    console.log(`⚡ [Idempotência Ativada] Mídia ${instagramMediaId} já processada anteriormente! Reutilizando dados sem custo.`);
    const existingRelation = await intelligentCatalogService.getRelationByMediaId(existingMedia.id);

    const existingProduct = existingRelation?.product_id
      ? await intelligentCatalogService.getProductById(existingRelation.product_id)
      : undefined;

    return {
      media: existingMedia,
      relation: existingRelation || {
        id: `rel_${existingMedia.id}`,
        media_id: existingMedia.id,
        product_id: existingProduct?.id,
        confidence: 0.95,
        match_status: 'auto_matched',
      },
      decision: {
        decision: 'strong_match',
        match_status: 'auto_matched',
        confidence: 0.95,
        candidates: [],
        matched_product: existingProduct || undefined,
        extracted_attributes: existingMedia.extracted_attributes || {},
        canonical_description: existingMedia.canonical_description || '',
        explanation: 'Mídia recuperada do cache sem novo processamento de IA.',
      },
      isDuplicateSkipped: true,
    };
  }

  // 2. EXTRAÇÃO DE FRAMES REPRESENTATIVOS (VÍDEO / STORY / REEL)
  let frames: ExtractedVideoFrame[] = [];
  let visualAnalysisTargetUrl = mediaUrl;

  const isVideo = mediaType === 'VIDEO' || mediaType === 'REEL' || mediaType === 'STORY';

  if (isVideo) {
    frames = await sampleRepresentativeFrames(mediaUrl, {
      intervalSeconds: 3,
      maxFrames: 3,
      thumbnailFallbackUrl: thumbnailUrl,
    });
    // Usa o frame representativo de melhor qualidade
    visualAnalysisTargetUrl = frames[0]?.url || thumbnailUrl || mediaUrl;
  }

  // 3. ANÁLISE DE IMAGEM VIA OPENAI VISION (ATRIBUTOS DINÂMICOS EM JSON)
  console.log(`🧠 [Vision] Analisando imagem e extraindo atributos estruturados...`);
  const visionResult = await analyzeMediaWithVision({
    imageUrl: visualAnalysisTargetUrl,
    caption,
    apiKey: openAiApiKey,
  });

  console.log(`✨ [Vision Atributos Extraídos]:`, JSON.stringify(visionResult.attributes, null, 2));
  console.log(`📄 [Descrição Canônica]: "${visionResult.canonicalDescription}"`);

  // 4. EMBEDDINGS (TEXT-EMBEDDING-3-SMALL / 1536 DIMENSÕES)
  console.log(`🔢 [Embedding] Gerando vetor de 1536 dimensões...`);
  const embedding = await generateEmbedding(visionResult.canonicalDescription, openAiApiKey);

  // 5. HNSW: BUSCA DE CANDIDATOS NO PGVECTOR
  console.log(`⚡ [HNSW pgvector] Consultando candidatos no índice vetorial...`);
  const candidatesFromHnsw = await intelligentCatalogService.findHnswCandidates(
    embedding,
    storeId,
    5
  );

  console.log(`🎯 [HNSW Candidatos Encontrados]: ${candidatesFromHnsw.length} produtos retornados.`);
  for (const c of candidatesFromHnsw) {
    console.log(`   - ${c.product.title} (Similaridade Vetorial: ${(c.similarity * 100).toFixed(1)}%)`);
  }

  // 6. COMPARAÇÃO PROFUNDA DE ATRIBUTOS E DECISÃO
  console.log(`⚖️ [Attribute Matcher] Confrontando categoria, cor e especificidades...`);
  const decisionResult = evaluateProductMatches({
    extractedAttributes: visionResult.attributes,
    canonicalDescription: visionResult.canonicalDescription,
    candidateProductsWithSimilarity: candidatesFromHnsw,
  });

  console.log(`🏆 [Decisão do Matching]: ${decisionResult.decision.toUpperCase()} (${decisionResult.match_status})`);
  console.log(`💬 [Explicação]: ${decisionResult.explanation}`);

  // 6.5. CADASTRO AUTOMÁTICO DE PEÇA INÉDITA DETECTADA NO INSTAGRAM (PRODUTOS / STORIES / REELS)
  if (decisionResult.match_status === 'suggested_new' || decisionResult.decision === 'no_match' || !decisionResult.matched_product) {
    const isService = visionResult.detectedCategory === 'serviço' || visionResult.attributes.categoria === 'serviço';
    
    // Conforme regra definida pelo lojista: se for serviço não cria produto duplicado, mas para produtos físicos cria a ficha técnica completa!
    let productTitle = visionResult.suggestedTitle;
    if (!productTitle && caption) {
      const cleanFirstLine = caption.split('\n')[0].replace(/[#@][\w.-]+/g, '').replace(/https?:\/\/\S+/g, '').trim();
      if (cleanFirstLine.length >= 3 && cleanFirstLine.length <= 60) {
        productTitle = cleanFirstLine;
      }
    }
    if (!productTitle) {
      const cat = (visionResult.detectedCategory || visionResult.attributes.categoria || '').trim().toLowerCase();
      const isGenericCat = !cat || /^(novidades|geral|peça|produto)$/i.test(cat);
      if (!isGenericCat) {
        productTitle = visionResult.attributes.subcategoria
          ? `${visionResult.detectedCategory || cat} ${visionResult.attributes.subcategoria}`
          : `${visionResult.detectedCategory || cat} ${visionResult.attributes.cor_principal || ''}`.trim();
      } else {
        productTitle = 'Peça em Lançamento';
      }
    }

    const cleanTitle = productTitle.charAt(0).toUpperCase() + productTitle.slice(1);
    const priceCents = visionResult.estimatedPriceCents && visionResult.estimatedPriceCents > 0
      ? visionResult.estimatedPriceCents
      : 0;

    const newProductId = `prod_story_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const autoCreatedProduct: ProductEntity = {
      id: newProductId,
      store_id: storeId,
      title: cleanTitle,
      description: caption || visionResult.canonicalDescription,
      canonical_description: visionResult.canonicalDescription,
      price_cents: priceCents,
      is_unique_piece: true,
      stock_quantity: isService ? 999 : 1,
      category:
        visionResult.detectedCategory === 'perfumaria'
          ? 'Perfumaria'
          : visionResult.detectedCategory === 'relógio'
          ? 'Relógios'
          : (visionResult.detectedCategory && !/^(novidades|geral)$/i.test(visionResult.detectedCategory))
          ? visionResult.detectedCategory
          : 'Lançamentos',
      status: priceCents > 0 ? 'active' : 'inactive',
      image_url: visualAnalysisTargetUrl || mediaUrl,
      attributes: visionResult.attributes,
      variants: [
        {
          id: `var_${Date.now()}`,
          product_id: newProductId,
          name: (visionResult.attributes as any).volume || visionResult.attributes.modelagem || 'Único',
          stock_quantity: isService ? 999 : 1,
        },
      ],
      images: [
        {
          id: `img_story_${Date.now()}`,
          product_id: newProductId,
          url: visualAnalysisTargetUrl || mediaUrl,
          is_primary: true,
          source_type: 'instagram_story',
        },
      ],
    };

    // 1. Cadastra na store de inteligência
    global.__intelligentProductsStore = global.__intelligentProductsStore || [];
    global.__intelligentProductsStore.unshift(autoCreatedProduct);

    // 2. REGRA CRÍTICA DO LOJISTA:
    // "quando subir um produto e nao tiver preço e para que diga que ainda nao esta no catalogo e que em breve vai ser colocado,
    //  nao e para ir com valor e etc e muito menos com nome... so e para responder caso seja cadastrado o valor"
    if (priceCents <= 0) {
      try {
        await intelligentCatalogService.createPriceConfirmationRequest({
          storeId,
          productId: autoCreatedProduct.id,
          productTitle: autoCreatedProduct.title,
          productImageUrl: autoCreatedProduct.image_url,
          buyerUsername: 'Lojista',
          buyerId: 'system_sync',
          inquiryText: `Nova peça do Story/Post (${cleanTitle}) aguardando definição de valor.`,
        });
        console.log(`⏳ [Sync Pipeline] Produto "${cleanTitle}" cadastrado como 'inactive'. Aguardando definição de valor antes de publicar no catálogo.`);
      } catch (reqErr) {
        console.warn('[Sync Pipeline Price Request Warn]', reqErr);
      }
      decisionResult.matched_product = autoCreatedProduct;
      decisionResult.match_status = 'suggested_new';
      decisionResult.decision = 'no_match';
    } else {
      // 3. SÓ PUBLICA NA VITRINE SE TIVER VALOR CADASTRADO (> 0)
      try {
        const targetSlug = params.catalogSlug || 'minha-loja';
        const activeCatalog = getServerCatalog(targetSlug);
        if (activeCatalog) {
          activeCatalog.slug = targetSlug;
          const storeProd: ProductItem = {
            id: autoCreatedProduct.id,
            name: autoCreatedProduct.title,
            description: autoCreatedProduct.description || '',
            category: autoCreatedProduct.category || 'Lançamentos',
            price: autoCreatedProduct.price_cents / 100,
            stock: autoCreatedProduct.stock_quantity,
            images: autoCreatedProduct.image_url ? [autoCreatedProduct.image_url] : [],
            isUniquePiece: autoCreatedProduct.is_unique_piece,
            badge: 'Recém Chegado do Story',
            paymentBadge: 'PIX ou Cartão',
            maxInstallments: 3,
            installmentWithoutInterest: true,
          };
          activeCatalog.products = activeCatalog.products || [];
          if (!activeCatalog.products.some((p) => p.id === storeProd.id)) {
            activeCatalog.products.unshift(storeProd);
            saveServerCatalog(activeCatalog);
            console.log(`🛍️ [Auto-Cadastro Vitrine] Produto "${storeProd.name}" CADASTRADO com sucesso na vitrine da loja (${targetSlug})!`);
          }

          // Garante que também fique visível em 'minha-loja' caso targetSlug seja diferente
          if (targetSlug !== 'minha-loja') {
            const minhaLojaCatalog = getServerCatalog('minha-loja');
            if (minhaLojaCatalog) {
              minhaLojaCatalog.products = minhaLojaCatalog.products || [];
              if (!minhaLojaCatalog.products.some((p) => p.id === storeProd.id)) {
                minhaLojaCatalog.products.unshift(storeProd);
                saveServerCatalog(minhaLojaCatalog);
              }
            }
          }
        }
      } catch (e) {
        console.warn('[Auto-Cadastro Vitrine Warn]', e);
      }

      decisionResult.matched_product = autoCreatedProduct;
      decisionResult.match_status = 'confirmed';
      decisionResult.decision = 'strong_match';
    }
  }

  // 7. PERSISTÊNCIA DA MÍDIA E DA RELAÇÃO
  const mediaRecord: InstagramMediaEntity = {
    id: existingMedia?.id || `med_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    store_id: storeId,
    instagram_media_id: instagramMediaId,
    media_type: mediaType,
    media_url: mediaUrl,
    thumbnail_url: thumbnailUrl || visualAnalysisTargetUrl,
    permalink,
    caption,
    timestamp: timestamp || new Date().toISOString(),
    status: 'processed',
    extracted_attributes: visionResult.attributes,
    canonical_description: visionResult.canonicalDescription,
    extracted_frames: frames,
    embedding,
    processed_at: new Date().toISOString(),
  };

  const savedMedia = await intelligentCatalogService.saveInstagramMedia(mediaRecord);

  const relationRecord: InstagramMediaProductRelation = {
    id: `rel_${savedMedia.id}`,
    media_id: savedMedia.id,
    product_id: decisionResult.matched_product?.id,
    confidence: decisionResult.confidence,
    match_status: decisionResult.match_status,
    match_reason: decisionResult.explanation,
    candidates: decisionResult.candidates,
    attribute_comparison: {
      visual_similarity: decisionResult.candidates[0]?.similarity || 0,
      category_match: !decisionResult.candidates[0]?.divergentAttributes.some((d) =>
        d.includes('Categoria diferente')
      ),
      color_match: !decisionResult.candidates[0]?.divergentAttributes.some((d) =>
        d.includes('Cor diferente')
      ),
      attributes_match_score: decisionResult.confidence,
      divergent_points: decisionResult.candidates[0]?.divergentAttributes || [],
    },
    created_at: new Date().toISOString(),
  };

  const savedRelation = await intelligentCatalogService.saveMediaProductRelation(relationRecord);

  // Se for Match Forte, atualiza imediatamente a Memória Visual do Produto!
  if (decisionResult.decision === 'strong_match' && decisionResult.matched_product) {
    savedRelation.confirmed_at = new Date().toISOString();
    await intelligentCatalogService.confirmMediaProductMatch(
      savedRelation.id,
      decisionResult.matched_product.id
    );
  }

  console.log(`========================================================================\n`);

  return {
    media: savedMedia,
    relation: savedRelation,
    decision: decisionResult,
    isDuplicateSkipped: false,
  };
}
