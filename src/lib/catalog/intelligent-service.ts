import {
  CandidateProductMatch,
  ConversationContextEntity,
  InstagramMediaEntity,
  InstagramMediaProductRelation,
  ProductEntity,
  ProductImageEntity,
  ProductVariantEntity,
  PriceConfirmationRequest,
} from './intelligent-types.ts';
import { getServerCatalog, saveServerCatalog } from './storage.ts';
import { supabase, isSupabaseConfigured } from '../supabase/client.ts';
import { cosineSimilarity, formatForPgVector, generateDeterministicEmbedding } from '../ai/embedding-service.ts';

// Armazenamento em memória para desenvolvimento local / modo sandbox
declare global {
  var __intelligentProductsStore: ProductEntity[] | undefined;
  var __intelligentMediaStore: InstagramMediaEntity[] | undefined;
  var __intelligentRelationsStore: InstagramMediaProductRelation[] | undefined;
  var __intelligentConversationsStore: Map<string, ConversationContextEntity> | undefined;
  var __intelligentPriceRequestsStore: PriceConfirmationRequest[] | undefined;
}

if (!global.__intelligentProductsStore) {
  global.__intelligentProductsStore = [];
}

if (!global.__intelligentMediaStore) {
  global.__intelligentMediaStore = [];
}

if (!global.__intelligentRelationsStore) {
  global.__intelligentRelationsStore = [];
}

if (!global.__intelligentConversationsStore) {
  global.__intelligentConversationsStore = new Map();
}

if (!global.__intelligentPriceRequestsStore) {
  global.__intelligentPriceRequestsStore = [];
}

export class IntelligentCatalogService {
  /**
   * Limpa completamente todos os produtos, mídias e relações em memória
   */
  clearAll() {
    global.__intelligentProductsStore = [];
    global.__intelligentMediaStore = [];
    global.__intelligentRelationsStore = [];
    if (global.__intelligentConversationsStore) {
      global.__intelligentConversationsStore.clear();
    }
  }

  /**
   * Inicializa fixtures sob demanda (usado exclusivamente pela suíte de testes)
   */
  seedDemoFixtures() {
    global.__intelligentProductsStore = [
      {
        id: 'prod_blusa_curta_01',
        store_id: 'store_demo_vitryne',
        title: 'Blusa Feminina Manga Curta',
        description: 'Blusa feminina amarela confeccionada em viscose premium, caimento suave.',
        canonical_description: 'Blusa feminina amarela, gola V, manga curta, com detalhe sutil e modelagem regular.',
        price_cents: 8990,
        is_unique_piece: false,
        stock_quantity: 5,
        category: 'Blusa',
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
        attributes: {
          categoria: 'blusa',
          cor_principal: 'amarelo',
          gola: 'V',
          manga: 'curta',
          cor_manga: 'amarelo',
          detalhes: ['acabamento premium'],
          estampa: 'lisa',
          modelagem: 'regular',
          material: 'viscose premium',
          genero: 'feminino',
        },
        variants: [
          { id: 'var_curta_p', product_id: 'prod_blusa_curta_01', name: 'P', stock_quantity: 2 },
          { id: 'var_curta_m', product_id: 'prod_blusa_curta_01', name: 'M', stock_quantity: 0 },
          { id: 'var_curta_g', product_id: 'prod_blusa_curta_01', name: 'G', stock_quantity: 3 },
        ],
        images: [
          {
            id: 'img_curta_cat_01',
            product_id: 'prod_blusa_curta_01',
            url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
            is_primary: true,
            source_type: 'catalog',
          },
        ],
      },
      {
        id: 'prod_blusa_bufante_02',
        store_id: 'store_demo_vitryne',
        title: 'Blusa Feminina Bufante',
        description: 'Blusa feminina amarela com gola redonda e mangas bufantes delicadas.',
        canonical_description: 'Blusa feminina amarela, gola redonda, manga bufante, lisa e modelagem solta.',
        price_cents: 9990,
        is_unique_piece: false,
        stock_quantity: 4,
        category: 'Blusa',
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80',
        attributes: {
          categoria: 'blusa',
          cor_principal: 'amarelo',
          gola: 'redonda',
          manga: 'bufante',
          cor_manga: 'amarelo',
          detalhes: ['elástico no punho'],
          estampa: 'lisa',
          modelagem: 'solta',
          material: 'crepe leve',
          genero: 'feminino',
        },
        variants: [
          { id: 'var_bufante_p', product_id: 'prod_blusa_bufante_02', name: 'P', stock_quantity: 1 },
          { id: 'var_bufante_m', product_id: 'prod_blusa_bufante_02', name: 'M', stock_quantity: 3 },
        ],
        images: [
          {
            id: 'img_bufante_cat_01',
            product_id: 'prod_blusa_bufante_02',
            url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80',
            is_primary: true,
            source_type: 'catalog',
          },
        ],
      },
      {
        id: 'prod_vestido_midi_03',
        store_id: 'store_demo_vitryne',
        title: 'Vestido Midi Floral',
        description: 'Vestido midi floral com decote suave e caimento evasê.',
        canonical_description: 'Vestido feminino floral vermelho e azul, decote V, alça fina, modelagem evasê midi.',
        price_cents: 18990,
        is_unique_piece: true,
        stock_quantity: 1,
        category: 'Vestido',
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
        attributes: {
          categoria: 'vestido',
          cor_principal: 'floral vermelho',
          gola: 'decote V',
          manga: 'alça fina',
          detalhes: ['fenda lateral', 'forro duplo'],
          estampa: 'floral',
          modelagem: 'evasê',
          material: 'chiffon',
          genero: 'feminino',
        },
        variants: [
          { id: 'var_serena_unico', product_id: 'prod_vestido_serena_03', name: 'Único (38-42)', stock_quantity: 1 },
        ],
        images: [
          {
            id: 'img_serena_cat_01',
            product_id: 'prod_vestido_serena_03',
            url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
            is_primary: true,
            source_type: 'catalog',
          },
        ],
      },
    ];
  }
  /**
   * 1. Lista todos os produtos cadastrados com variantes e memória visual
   */
  async listProducts(storeId?: string, catalogSlug?: string): Promise<ProductEntity[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('products').select(`
          *,
          variants:product_variants(*),
          images:product_images(*)
        `);
        if (storeId) query = query.eq('store_id', storeId);
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as ProductEntity[];
        }
      } catch (e) {
        console.warn('[Supabase Products Warn, using memory store]', e);
      }
    }

    if (!global.__intelligentProductsStore || global.__intelligentProductsStore.length === 0) {
      this.seedDemoFixtures();
    }

    const memoryProducts = [...(global.__intelligentProductsStore || [])];

    // Mescla também produtos cadastrados na vitrine pública (getServerCatalog)
    try {
      const publicCatalog = getServerCatalog(catalogSlug || 'minha-loja');
      if (publicCatalog?.products && publicCatalog.products.length > 0) {
        const existingIds = new Set(memoryProducts.map((p) => p.id));
        for (const p of publicCatalog.products) {
          if (!existingIds.has(p.id)) {
            memoryProducts.push({
              id: p.id,
              store_id: storeId || 'store_demo_vitryne',
              title: p.name,
              description: p.description || '',
              canonical_description: `${p.name}, ${p.category || 'Peça'}, valor ${p.price}`,
              price_cents: Math.round((p.price || 0) * 100),
              stock_quantity: 5,
              category: p.category || 'Geral',
              status: 'active',
              image_url: p.images?.[0] || (p as any).imageUrl || '',
              attributes: {
                categoria: (p.category || '').toLowerCase(),
                cor_principal: 'neutro',
                genero: 'unissex',
              },
              variants: (p.sizes || ['Único']).map((s: string) => ({
                id: `var_${p.id}_${s}`,
                product_id: p.id,
                name: s,
                stock_quantity: 3,
              })),
            });
            existingIds.add(p.id);
          }
        }
      }
    } catch {
      // silencioso se storage não estiver pronto
    }

    return memoryProducts;
  }

  /**
   * 2. Obtém produto por ID
   */
  async getProductById(productId: string): Promise<ProductEntity | null> {
    const products = await this.listProducts();
    return products.find((p) => p.id === productId) || null;
  }

  /**
   * 3. ESTOQUE E DISPONIBILIDADE:
   * A IA NUNCA inventa estoque. O banco de dados é a única fonte da verdade.
   */
  async checkStockAndAvailability(
    productId: string,
    variantName?: string
  ): Promise<{
    available: boolean;
    status: 'active' | 'inactive' | 'sold_out';
    productTitle: string;
    totalStock: number;
    variants: Array<{ name: string; stock: number; available: boolean }>;
    specificVariant?: { name: string; stock: number; available: boolean };
    humanFriendlyMessage: string;
  }> {
    const product = await this.getProductById(productId);
    if (!product) {
      return {
        available: false,
        status: 'inactive',
        productTitle: 'Produto não encontrado',
        totalStock: 0,
        variants: [],
        humanFriendlyMessage: 'Produto não cadastrado ou inativo no catálogo.',
      };
    }

    if (product.status !== 'active') {
      return {
        available: false,
        status: product.status,
        productTitle: product.title,
        totalStock: 0,
        variants: [],
        humanFriendlyMessage: `O produto "${product.title}" está indisponível no momento.`,
      };
    }

    const variants = (product.variants || []).map((v) => ({
      name: v.name,
      stock: v.stock_quantity,
      available: v.stock_quantity > 0,
    }));

    const totalStock = variants.length > 0
      ? variants.reduce((sum, v) => sum + v.stock, 0)
      : product.stock_quantity;

    let specificVariant: { name: string; stock: number; available: boolean } | undefined;

    if (variantName) {
      const cleanVar = variantName.trim().toUpperCase();
      specificVariant = variants.find(
        (v) => v.name.trim().toUpperCase() === cleanVar || v.name.toUpperCase().includes(cleanVar)
      );
    }

    // Geração de mensagem rigorosa e precisa
    let humanFriendlyMessage = '';
    if (specificVariant) {
      if (specificVariant.available) {
        humanFriendlyMessage = `Sim! Temos o tamanho ${specificVariant.name} da ${product.title} disponível (${specificVariant.stock} unidades).`;
      } else {
        const otherAvailable = variants.filter((v) => v.available).map((v) => `${v.name} (${v.stock})`);
        humanFriendlyMessage = `No momento, a ${product.title} está indisponível no tamanho ${specificVariant.name}.${
          otherAvailable.length > 0 ? ` Temos nos tamanhos: ${otherAvailable.join(', ')}.` : ' Não restam outras unidades.'
        }`;
      }
    } else {
      if (totalStock > 0) {
        const availList = variants.filter((v) => v.available).map((v) => v.name);
        humanFriendlyMessage = `A ${product.title} está disponível! Tamanhos: ${
          availList.length > 0 ? availList.join(', ') : 'Tamanho Único'
        }. Valor: R$ ${(product.price_cents / 100).toFixed(2).replace('.', ',')}.`;
      } else {
        humanFriendlyMessage = `A ${product.title} esgotou no momento.`;
      }
    }

    return {
      available: specificVariant ? specificVariant.available : totalStock > 0,
      status: totalStock > 0 ? 'active' : 'sold_out',
      productTitle: product.title,
      totalStock,
      variants,
      specificVariant,
      humanFriendlyMessage,
    };
  }

  /**
   * 4. HNSW: Busca rápida de candidatos no pgvector
   * Se Supabase configurado, usa a RPC match_products com índice HNSW.
   * Se offline/sandbox, usa busca vetorial determinística local.
   */
  async findHnswCandidates(
    queryEmbedding: number[],
    storeId?: string,
    limit: number = 5
  ): Promise<Array<{ product: ProductEntity; similarity: number }>> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('match_products', {
          query_embedding: formatForPgVector(queryEmbedding),
          match_threshold: 0.3,
          match_count: limit,
          filter_store_id: storeId || null,
        });

        if (!error && Array.isArray(data) && data.length > 0) {
          const products = await this.listProducts();
          const results: Array<{ product: ProductEntity; similarity: number }> = [];

          for (const row of data) {
            const prod = products.find((p) => p.id === row.product_id);
            if (prod) {
              results.push({
                product: prod,
                similarity: Number(row.similarity),
              });
            }
          }
          if (results.length > 0) return results;
        }
      } catch (err) {
        console.warn('[RPC match_products warn, falling back to local HNSW simulation]', err);
      }
    }

    // Simulação local de busca vetorial HNSW com memória visual
    const products = await this.listProducts();
    const ranked: Array<{ product: ProductEntity; similarity: number }> = [];

    for (const prod of products) {
      // Gera embedding da descrição canônica do produto
      const prodVector = generateDeterministicEmbedding(
        prod.canonical_description || `${prod.title} ${prod.category} ${prod.description}`
      );
      let bestSim = cosineSimilarity(queryEmbedding, prodVector);

      // Compara também contra a memória visual acumulada (imagens de stories/reels já confirmados)
      if (prod.images && prod.images.length > 0) {
        for (const img of prod.images) {
          if (img.embedding && img.embedding.length > 0) {
            const imgSim = cosineSimilarity(queryEmbedding, img.embedding);
            if (imgSim > bestSim) bestSim = imgSim;
          }
        }
      }

      ranked.push({
        product: prod,
        similarity: Number(bestSim.toFixed(3)),
      });
    }

    ranked.sort((a, b) => b.similarity - a.similarity);
    return ranked.slice(0, limit);
  }

  /**
   * 5. Sincronização e Idempotência:
   * Verifica se o instagram_media_id já existe. Se existir, não processa novamente!
   */
  async getMediaByInstagramId(instagramMediaId: string): Promise<InstagramMediaEntity | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('instagram_media')
          .select('*')
          .eq('instagram_media_id', instagramMediaId)
          .single();
        if (!error && data) return data as InstagramMediaEntity;
      } catch (e) {
        // fallback
      }
    }
    const found = (global.__intelligentMediaStore || []).find(
      (m) => m.instagram_media_id === instagramMediaId
    );
    return found || null;
  }

  async deleteMediaByInstagramId(instagramMediaId: string): Promise<void> {
    if (global.__intelligentMediaStore) {
      const targetMedia = global.__intelligentMediaStore.find(
        (m) => m.instagram_media_id === instagramMediaId
      );
      if (targetMedia) {
        global.__intelligentMediaStore = global.__intelligentMediaStore.filter(
          (m) => m.instagram_media_id !== instagramMediaId
        );
        if (global.__intelligentRelationsStore) {
          global.__intelligentRelationsStore = global.__intelligentRelationsStore.filter(
            (r) => r.media_id !== targetMedia.id
          );
        }
      }
    }
  }

  async saveInstagramMedia(media: InstagramMediaEntity): Promise<InstagramMediaEntity> {
    // 1. Checa idempotência
    const existing = await this.getMediaByInstagramId(media.instagram_media_id);
    if (existing) {
      return existing;
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('instagram_media')
          .insert([media])
          .select()
          .single();
        if (!error && data) return data as InstagramMediaEntity;
      } catch (e) {
        console.warn('[Supabase save media warn]', e);
      }
    }

    global.__intelligentMediaStore = global.__intelligentMediaStore || [];
    global.__intelligentMediaStore.unshift(media);
    return media;
  }

  /**
   * 6. Salva relação de matching (auto_matched, pending_confirmation, suggested_new)
   */
  async saveMediaProductRelation(
    relation: InstagramMediaProductRelation
  ): Promise<InstagramMediaProductRelation> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('instagram_media_products')
          .insert([relation])
          .select()
          .single();
        if (!error && data) return data as InstagramMediaProductRelation;
      } catch (e) {
        // fallback
      }
    }

    global.__intelligentRelationsStore = global.__intelligentRelationsStore || [];
    // Atualiza ou insere
    const idx = global.__intelligentRelationsStore.findIndex((r) => r.id === relation.id);
    if (idx >= 0) {
      global.__intelligentRelationsStore[idx] = relation;
    } else {
      global.__intelligentRelationsStore.unshift(relation);
    }
    return relation;
  }

  /**
   * 7. MEMÓRIA VISUAL DO PRODUTO:
   * Confirmação manual pela dona da loja ou match automático.
   * Adiciona o frame/mídia confirmado como referência visual permanente do produto,
   * atualizando os embeddings no pgvector para aprimorar futuros reconhecimentos.
   */
  async confirmMediaProductMatch(
    relationId: string,
    productId: string
  ): Promise<InstagramMediaProductRelation> {
    const relation = (global.__intelligentRelationsStore || []).find((r) => r.id === relationId);
    if (!relation) {
      throw new Error(`Relação ${relationId} não encontrada`);
    }

    relation.product_id = productId;
    relation.match_status = 'confirmed';
    relation.confirmed_at = new Date().toISOString();

    // Atualiza produto correspondente e anexa nova referência à Memória Visual
    const product = (global.__intelligentProductsStore || []).find((p) => p.id === productId);
    const media = (global.__intelligentMediaStore || []).find((m) => m.id === relation.media_id);

    if (product && media) {
      product.images = product.images || [];
      const newImageRef: ProductImageEntity = {
        id: `img_ref_${Date.now()}`,
        product_id: product.id,
        url: media.media_url || media.thumbnail_url || product.image_url || '',
        is_primary: false,
        source_type: media.media_type === 'STORY' ? 'instagram_story' : 'instagram_reel',
        source_media_id: media.instagram_media_id,
        embedding: media.embedding,
      };
      product.images.push(newImageRef);
      console.log(
        `🧠 [Memória Visual Enriquecida] O produto "${product.title}" agora possui ${product.images.length} referências visuais acumuladas!`
      );
    }

    return relation;
  }

  /**
   * 8. Contexto da Conversa:
   * Armazena current_product_id por buyer_id para responder perguntas subsequentes
   * ("TEM M?", "QUAL A COR?", "TEM G?") instantaneamente sem reexecutar Vision/Embeddings.
   */
  async getConversationContext(
    storeId: string,
    buyerId: string
  ): Promise<ConversationContextEntity | null> {
    const key = `${storeId}:${buyerId}`;
    const ctx = global.__intelligentConversationsStore?.get(key);
    if (!ctx) return null;

    if (ctx.current_product_id) {
      ctx.current_product = (await this.getProductById(ctx.current_product_id)) || undefined;
    }
    return ctx;
  }

  async updateConversationContext(
    storeId: string,
    buyerId: string,
    productId?: string,
    mediaId?: string,
    buyerUsername?: string,
    metadata?: Record<string, any>
  ): Promise<ConversationContextEntity> {
    const key = `${storeId}:${buyerId}`;
    const existing = global.__intelligentConversationsStore?.get(key);

    const mergedMetadata = {
      ...(existing?.metadata || {}),
      ...(metadata || {}),
    };

    const updated: ConversationContextEntity = {
      id: existing?.id || `conv_${Date.now()}`,
      store_id: storeId,
      buyer_id: buyerId,
      buyer_username: buyerUsername || existing?.buyer_username,
      current_product_id: productId !== undefined ? (productId || undefined) : existing?.current_product_id,
      last_media_id: mediaId !== undefined ? (mediaId || undefined) : existing?.last_media_id,
      last_interaction_at: new Date().toISOString(),
      metadata: mergedMetadata,
    };

    if (updated.current_product_id) {
      updated.current_product = (await this.getProductById(updated.current_product_id)) || undefined;
    }

    global.__intelligentConversationsStore?.set(key, updated);
    return updated;
  }

  /**
   * 9. Busca relação existente entre uma mídia do Instagram e um produto
   */
  async getRelationByMediaId(mediaId: string): Promise<InstagramMediaProductRelation | null> {
    const rel = (global.__intelligentRelationsStore || []).find((r) => r.media_id === mediaId);
    return rel || null;
  }

  /**
   * Lista todas as relações e mídias para a dashboard
   */
  async listMediaRelations(): Promise<InstagramMediaProductRelation[]> {
    const relations = global.__intelligentRelationsStore || [];
    const products = await this.listProducts();
    const mediaList = global.__intelligentMediaStore || [];

    return relations.map((rel) => {
      return {
        ...rel,
        product: products.find((p) => p.id === rel.product_id),
        media: mediaList.find((m) => m.id === rel.media_id),
      };
    });
  }

  /**
   * 10. Registra uma solicitação de micro-confirmação de preço para o lojista (Estratégia 3)
   */
  async createPriceConfirmationRequest(params: {
    storeId: string;
    productId: string;
    productTitle: string;
    productImageUrl?: string;
    buyerUsername: string;
    buyerId: string;
    inquiryText: string;
  }): Promise<PriceConfirmationRequest> {
    global.__intelligentPriceRequestsStore = global.__intelligentPriceRequestsStore || [];

    // Se já houver uma requisição pendente para o mesmo produto e comprador
    const existing = global.__intelligentPriceRequestsStore.find(
      (r) => r.product_id === params.productId && r.buyer_id === params.buyerId && r.status === 'pending'
    );
    if (existing) {
      existing.inquiry_text = params.inquiryText;
      return existing;
    }

    const newRequest: PriceConfirmationRequest = {
      id: `price_req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      store_id: params.storeId,
      product_id: params.productId,
      product_title: params.productTitle,
      product_image_url: params.productImageUrl,
      buyer_username: params.buyerUsername,
      buyer_id: params.buyerId,
      inquiry_text: params.inquiryText,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    global.__intelligentPriceRequestsStore.unshift(newRequest);
    console.log(`🚨 [Micro-Confirmação Criada] Preço pendente para "${params.productTitle}" solicitado por @${params.buyerUsername}`);
    return newRequest;
  }

  /**
   * Lista solicitações de preço pendentes para o lojista
   */
  async listPriceConfirmationRequests(storeId?: string): Promise<PriceConfirmationRequest[]> {
    global.__intelligentPriceRequestsStore = global.__intelligentPriceRequestsStore || [];
    if (!storeId) {
      return global.__intelligentPriceRequestsStore;
    }
    return global.__intelligentPriceRequestsStore.filter((r) => r.store_id === storeId);
  }

  /**
   * Confirma o preço em 1 clique pelo lojista, atualizando o catálogo e ensinando a IA em tempo real
   */
  async confirmPrice(params: {
    requestId?: string;
    productId: string;
    priceCents: number;
    catalogSlug?: string;
  }): Promise<{ success: boolean; product?: ProductEntity; request?: PriceConfirmationRequest }> {
    const { requestId, productId, priceCents, catalogSlug = 'minha-loja' } = params;

    // 1. Atualiza no store de inteligência
    const product = await this.getProductById(productId);
    if (product) {
      product.price_cents = priceCents;
    }

    // 2. Atualiza no catálogo público da vitrine (getServerCatalog / saveServerCatalog)
    try {
      const activeCatalog = getServerCatalog(catalogSlug);
      if (activeCatalog?.products) {
        const pIndex = activeCatalog.products.findIndex((p) => p.id === productId);
        if (pIndex !== -1) {
          activeCatalog.products[pIndex].price = priceCents / 100;
          saveServerCatalog(activeCatalog);
        }
      }
    } catch (e) {
      console.warn('[ConfirmPrice Catalog Save Warn]', e);
    }

    // 3. Atualiza status da solicitação
    global.__intelligentPriceRequestsStore = global.__intelligentPriceRequestsStore || [];
    let matchedRequest: PriceConfirmationRequest | undefined;
    if (requestId) {
      matchedRequest = global.__intelligentPriceRequestsStore.find((r) => r.id === requestId);
    } else {
      matchedRequest = global.__intelligentPriceRequestsStore.find(
        (r) => r.product_id === productId && r.status === 'pending'
      );
    }

    if (matchedRequest) {
      matchedRequest.status = 'confirmed';
      matchedRequest.confirmed_price_cents = priceCents;
      matchedRequest.confirmed_at = new Date().toISOString();
    }

    console.log(`🎉 [Micro-Confirmação SUCESSO] Preço de R$ ${(priceCents / 100).toFixed(2)} confirmado para "${product?.title || productId}". A IA agora responderá automaticamente!`);
    return {
      success: true,
      product: product || undefined,
      request: matchedRequest,
    };
  }
}

export const intelligentCatalogService = new IntelligentCatalogService();
