-- =====================================================================
-- VITRYNE - CATÁLOGO INTELIGENTE CONECTADO AO INSTAGRAM
-- PostgreSQL + pgvector + HNSW + Memória Visual + Estoque Confiável
-- =====================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Atualizar ou Criar Tabela de Produtos (Produto Permanente)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    canonical_description TEXT, -- Descrição padronizada gerada pelo Vision para embedding
    price_cents INT NOT NULL CHECK (price_cents > 0),
    is_unique_piece BOOLEAN DEFAULT false,
    stock_quantity INT DEFAULT 1 CHECK (stock_quantity >= 0),
    image_url TEXT,
    category TEXT DEFAULT 'Geral',
    sku TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold_out')),
    attributes JSONB DEFAULT '{}'::jsonb, -- Atributos dinâmicos estruturados (cor, gola, manga, detalhes, estampa, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garantir colunas novas caso a tabela products já existisse
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='canonical_description') THEN
        ALTER TABLE public.products ADD COLUMN canonical_description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='category') THEN
        ALTER TABLE public.products ADD COLUMN category TEXT DEFAULT 'Geral';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='attributes') THEN
        ALTER TABLE public.products ADD COLUMN attributes JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 3. Variantes de Produtos (Estoque por Tamanho / Cor / Modelo)
-- O banco de dados é a ÚNICA fonte da verdade para estoque.
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Ex: 'P', 'M', 'G', 'GG', '38', '40', 'Amarelo / M'
    sku TEXT,
    price_cents INT, -- Opcional se for diferente do preço base
    stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),
    attributes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Memória Visual do Produto (ProductImage)
-- Cada imagem oficial ou frame confirmado do Instagram vira referência visual do produto!
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    source_type TEXT DEFAULT 'catalog' CHECK (source_type IN ('catalog', 'instagram_post', 'instagram_story', 'instagram_reel', 'video_frame')),
    source_media_id TEXT,
    source_frame_second NUMERIC,
    embedding vector(1536), -- Vetor visual/canônico desta referência
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Conteúdos do Instagram (InstagramMedia)
-- Story, Reel ou Post específico publicado.
-- Idempotência estrita: instagram_media_id único. Nunca processar o mesmo ID duas vezes!
CREATE TABLE IF NOT EXISTS public.instagram_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    instagram_media_id TEXT NOT NULL UNIQUE, -- ID oficial da Meta
    media_type TEXT NOT NULL CHECK (media_type IN ('IMAGE', 'VIDEO', 'CAROUSEL_ALBUM', 'STORY', 'REEL')),
    media_url TEXT,
    thumbnail_url TEXT,
    permalink TEXT,
    caption TEXT,
    timestamp TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'error', 'skipped')),
    extracted_attributes JSONB DEFAULT '{}'::jsonb, -- Características estruturadas extraídas pelo Vision
    canonical_description TEXT, -- Descrição textual canônica gerada pela IA
    extracted_frames JSONB DEFAULT '[]'::jsonb, -- Frames representativos para vídeos/reels
    embedding vector(1536), -- Embedding gerado a partir da visão computacional
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- 6. Relacionamento Mídia x Produto (InstagramMediaProduct)
-- Um produto pode aparecer em vários conteúdos (Story 123, Reel 456, Post 789).
-- Três situações possíveis:
--  - auto_matched: Confiança forte (>= 0.85) -> Associação automática
--  - pending_confirmation: Dúvida (0.50 a 0.84) -> Pedir confirmação da dona da loja
--  - suggested_new: Nenhum match (< 0.50) -> Sugerir criação de novo produto
CREATE TABLE IF NOT EXISTS public.instagram_media_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_id UUID NOT NULL REFERENCES public.instagram_media(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    confidence NUMERIC(5,4), -- Ex: 0.9420
    match_status TEXT NOT NULL CHECK (match_status IN ('auto_matched', 'pending_confirmation', 'confirmed', 'rejected', 'suggested_new')),
    match_reason TEXT,
    attribute_comparison JSONB DEFAULT '{}'::jsonb, -- Resumo da comparação de atributos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ
);

-- 7. Contexto de Conversas no Instagram (Conversations)
-- Armazena o produto em foco para responder rapidamente sem reprocessar IA/Vision.
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    buyer_id TEXT NOT NULL, -- senderId do Instagram
    buyer_username TEXT,
    current_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    last_media_id UUID REFERENCES public.instagram_media(id) ON DELETE SET NULL,
    last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT uq_conversation_store_buyer UNIQUE (store_id, buyer_id)
);

-- 8. Tabela de Embeddings do Produto (ProductEmbedding)
-- Alimenta a busca rápida HNSW no Supabase pgvector.
CREATE TABLE IF NOT EXISTS public.product_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('canonical', 'image_reference', 'confirmed_media', 'manual')),
    source_id TEXT,
    embedding vector(1536) NOT NULL,
    canonical_text TEXT NOT NULL,
    attributes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- ÍNDICES HNSW (Hierarchical Navigable Small World) & PERFORMANCE
-- =====================================================================

-- Índice HNSW para busca vetorial de produtos mais semelhantes
CREATE INDEX IF NOT EXISTS idx_product_embeddings_hnsw 
ON public.product_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Índice HNSW para embeddings de mídias do Instagram
CREATE INDEX IF NOT EXISTS idx_instagram_media_embedding_hnsw 
ON public.instagram_media 
USING hnsw (embedding vector_cosine_ops)
WHERE embedding IS NOT NULL;

-- Índice HNSW para imagens de produtos
CREATE INDEX IF NOT EXISTS idx_product_images_embedding_hnsw 
ON public.product_images 
USING hnsw (embedding vector_cosine_ops)
WHERE embedding IS NOT NULL;

-- Índices relacionais padrão
CREATE INDEX IF NOT EXISTS idx_media_instagram_id ON public.instagram_media(instagram_media_id);
CREATE INDEX IF NOT EXISTS idx_media_status ON public.instagram_media(status);
CREATE INDEX IF NOT EXISTS idx_media_products_media ON public.instagram_media_products(media_id);
CREATE INDEX IF NOT EXISTS idx_media_products_product ON public.instagram_media_products(product_id);
CREATE INDEX IF NOT EXISTS idx_media_products_status ON public.instagram_media_products(match_status);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_conversations_store_buyer ON public.conversations(store_id, buyer_id);

-- =====================================================================
-- FUNÇÃO RPC: BUSCA VETORIAL COM ÍNDICE HNSW
-- =====================================================================
CREATE OR REPLACE FUNCTION match_products(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.5,
    match_count int DEFAULT 5,
    filter_store_id uuid DEFAULT NULL
)
RETURNS TABLE (
    product_id uuid,
    similarity float,
    canonical_text text,
    attributes jsonb,
    source_type text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pe.product_id,
        1 - (pe.embedding <=> query_embedding) AS similarity,
        pe.canonical_text,
        pe.attributes,
        pe.source_type
    FROM public.product_embeddings pe
    JOIN public.products p ON p.id = pe.product_id
    WHERE (filter_store_id IS NULL OR p.store_id = filter_store_id)
      AND (1 - (pe.embedding <=> query_embedding)) >= match_threshold
    ORDER BY pe.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;

-- =====================================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================================
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_media_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_embeddings ENABLE ROW LEVEL SECURITY;

-- Políticas para leitura de catálogo público
DROP POLICY IF EXISTS "Public read for product variants" ON public.product_variants;
CREATE POLICY "Public read for product variants"
ON public.product_variants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read for product images" ON public.product_images;
CREATE POLICY "Public read for product images"
ON public.product_images FOR SELECT USING (true);

-- Lojistas gerenciam suas próprias tabelas
DROP POLICY IF EXISTS "Stores manage their product variants" ON public.product_variants;
CREATE POLICY "Stores manage their product variants"
ON public.product_variants FOR ALL
USING (product_id IN (SELECT id FROM public.products WHERE store_id IN (SELECT id FROM public.stores WHERE auth_user_id = auth.uid())));

DROP POLICY IF EXISTS "Stores manage their product images" ON public.product_images;
CREATE POLICY "Stores manage their product images"
ON public.product_images FOR ALL
USING (product_id IN (SELECT id FROM public.products WHERE store_id IN (SELECT id FROM public.stores WHERE auth_user_id = auth.uid())));

DROP POLICY IF EXISTS "Stores manage their instagram media" ON public.instagram_media;
CREATE POLICY "Stores manage their instagram media"
ON public.instagram_media FOR ALL
USING (store_id IN (SELECT id FROM public.stores WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Stores manage their instagram media products" ON public.instagram_media_products;
CREATE POLICY "Stores manage their instagram media products"
ON public.instagram_media_products FOR ALL
USING (media_id IN (SELECT id FROM public.instagram_media WHERE store_id IN (SELECT id FROM public.stores WHERE auth_user_id = auth.uid())));

DROP POLICY IF EXISTS "Stores manage their conversations" ON public.conversations;
CREATE POLICY "Stores manage their conversations"
ON public.conversations FOR ALL
USING (store_id IN (SELECT id FROM public.stores WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Stores manage their product embeddings" ON public.product_embeddings;
CREATE POLICY "Stores manage their product embeddings"
ON public.product_embeddings FOR ALL
USING (product_id IN (SELECT id FROM public.products WHERE store_id IN (SELECT id FROM public.stores WHERE auth_user_id = auth.uid())));
