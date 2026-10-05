-- =====================================================================
-- VITRYNE - ESQUEMA DE BANCO DE DADOS POSTGRESQL (SUPABASE)
-- RLS (Row Level Security) Multi-tenant, Auditoria e Concorrência
-- =====================================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABELA DE LOJAS (STORES / TENANTS)
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    store_name TEXT NOT NULL,
    instagram_user_id TEXT UNIQUE,
    instagram_username TEXT,
    instagram_access_token_encrypted TEXT,
    instagram_token_expires_at TIMESTAMPTZ,
    
    -- Blind index para pesquisa exata sem vazar texto puro
    email_blind_index TEXT,
    
    -- Subconta Asaas & Split
    asaas_wallet_id TEXT,
    asaas_api_key_encrypted TEXT,
    pix_key_encrypted TEXT,
    
    -- Módulo BYOK (IA)
    ai_provider TEXT DEFAULT 'openai',
    ai_api_key_encrypted TEXT,
    ai_api_key_masked TEXT,
    ai_mode TEXT DEFAULT 'guarda_costas' CHECK (ai_mode IN ('total_24_7', 'guarda_costas', 'noturno', 'personalizado')),
    bodyguard_delay_minutes INT DEFAULT 15,
    night_shift_start TIME DEFAULT '18:00',
    night_shift_end TIME DEFAULT '08:00',
    
    -- Módulos contratados / ativos
    active_modules JSONB DEFAULT '["modulo_zero", "modulo_ia", "modulo_checkout"]'::jsonb,
    
    -- Configuração de Logística
    pickup_enabled BOOLEAN DEFAULT true,
    pickup_address TEXT,
    pickup_instructions TEXT,
    motoboy_enabled BOOLEAN DEFAULT true,
    motoboy_fee_cents INT DEFAULT 1500, -- R$ 15,00
    motoboy_neighborhoods TEXT[] DEFAULT ARRAY['Centro', 'Jardins', 'Pinheiros', 'Moema', 'Morumbi'],
    national_shipping_enabled BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE PRODUTOS / PEÇAS ÚNICAS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price_cents INT NOT NULL CHECK (price_cents > 0),
    is_unique_piece BOOLEAN DEFAULT true,
    stock_quantity INT DEFAULT 1 CHECK (stock_quantity >= 0),
    image_url TEXT,
    instagram_media_id TEXT,
    sku TEXT,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold_out')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE AUDITORIA E TELEMETRIA (MÓDULO ZERO - RADAR DE DEMANDA)
CREATE TABLE IF NOT EXISTS public.interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    buyer_username TEXT NOT NULL,
    buyer_id TEXT,
    origin TEXT NOT NULL CHECK (origin IN ('reels', 'story', 'feed', 'direct')),
    intent_detected TEXT NOT NULL,
    comment_text TEXT NOT NULL,
    store_reply_text TEXT,
    wait_time_seconds INT DEFAULT 0,
    status TEXT DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'respondido', 'no_vacuo', 'perdido')),
    parent_comment_id TEXT,
    media_id TEXT,
    ai_handled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    replied_at TIMESTAMPTZ
);

-- 4. TABELA DE PEDIDOS & CHECKOUT EFÊMERO (ASAAS INTEGRADO)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    buyer_username TEXT NOT NULL,
    buyer_name TEXT,
    buyer_phone TEXT,
    buyer_cpf TEXT,
    
    -- Valores e Split
    total_cents INT NOT NULL,
    vitryne_fee_cents INT NOT NULL,
    store_amount_cents INT NOT NULL,
    
    -- Logística
    shipping_type TEXT NOT NULL CHECK (shipping_type IN ('retirada', 'motoboy', 'nacional')),
    shipping_cost_cents INT DEFAULT 0,
    shipping_address JSONB,
    
    -- Asaas
    asaas_payment_id TEXT,
    payment_method TEXT CHECK (payment_method IN ('pix', 'credit_card', 'debit_card')),
    pix_qr_code_base64 TEXT,
    pix_copy_paste TEXT,
    
    -- Status e Janela Efêmera
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'refunded', 'cancelled')),
    reservation_expires_at TIMESTAMPTZ NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);

-- 5. TABELA DE FILA FIFO DE ESPERA
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    buyer_username TEXT NOT NULL,
    buyer_id TEXT NOT NULL,
    position INT NOT NULL,
    notified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_interactions_store_created ON public.interactions(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_status ON public.interactions(status);
CREATE INDEX IF NOT EXISTS idx_products_store ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_store ON public.orders(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_reservation ON public.orders(status, reservation_expires_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_product ON public.waitlist(product_id, position);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) - ISOLAMENTO MULTI-TENANT
-- =====================================================================

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Políticas para STORES
DROP POLICY IF EXISTS "Stores can view and edit their own data" ON public.stores;
CREATE POLICY "Stores can view and edit their own data"
ON public.stores
FOR ALL
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

-- Políticas para PRODUCTS
DROP POLICY IF EXISTS "Stores can manage their own products" ON public.products;
CREATE POLICY "Stores can manage their own products"
ON public.products
FOR ALL
USING (store_id IN (SELECT id FROM public.stores WHERE auth_user_id = auth.uid()))
WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE auth_user_id = auth.uid()));

-- Produtos públicos disponíveis para leitura no checkout
DROP POLICY IF EXISTS "Public read for available products" ON public.products;
CREATE POLICY "Public read for available products"
ON public.products
FOR SELECT
USING (status IN ('available', 'reserved', 'active'));

-- Políticas para INTERACTIONS
DROP POLICY IF EXISTS "Stores can view and manage their interactions" ON public.interactions;
CREATE POLICY "Stores can view and manage their interactions"
ON public.interactions
FOR ALL
USING (store_id IN (SELECT id FROM public.stores WHERE auth_user_id = auth.uid()))
WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE auth_user_id = auth.uid()));

-- Políticas para ORDERS
DROP POLICY IF EXISTS "Stores can view their orders" ON public.orders;
CREATE POLICY "Stores can view their orders"
ON public.orders
FOR ALL
USING (store_id IN (SELECT id FROM public.stores WHERE auth_user_id = auth.uid()))
WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE auth_user_id = auth.uid()));

-- Orders são restritas aos lojistas autenticados (ou service_role no backend)
DROP POLICY IF EXISTS "Public read for ephemeral checkout" ON public.orders;

-- HABILITAR REALTIME DO SUPABASE (Idempotente)
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.interactions;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;
