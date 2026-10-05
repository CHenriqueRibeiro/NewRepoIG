-- =====================================================================
-- VITRYNE - REFORÇO DE SEGURANÇA E PROTEÇÃO CONTRA VAZAMENTO (RLS PENTEST)
-- Proteção LGPD contra vazamento de CPFs, telefones e pedidos
-- =====================================================================

-- 1. BLINDAGEM DE PEDIDOS (ORDERS)
-- NUNCA permitir SELECT irrestrito (USING true) na tabela orders.
-- Somente o lojista autenticado dono da loja pode consultar seus pedidos.
DROP POLICY IF EXISTS "Public read for ephemeral checkout" ON public.orders;

DROP POLICY IF EXISTS "Stores can view their orders" ON public.orders;
CREATE POLICY "Stores can view their orders"
ON public.orders
FOR ALL
USING (store_id IN (SELECT id FROM public.stores WHERE auth_user_id = auth.uid()))
WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE auth_user_id = auth.uid()));

-- 2. BLINDAGEM DE INTERAÇÕES E COMENTÁRIOS (INTERACTIONS)
-- Apenas a loja dona tem acesso aos comentários e DMs recebidas.
DROP POLICY IF EXISTS "Stores can view and manage their interactions" ON public.interactions;
CREATE POLICY "Stores can view and manage their interactions"
ON public.interactions
FOR ALL
USING (store_id IN (SELECT id FROM public.stores WHERE auth_user_id = auth.uid()))
WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE auth_user_id = auth.uid()));

-- 3. BLINDAGEM DA FILA DE ESPERA (WAITLIST)
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Stores can view their waitlist" ON public.waitlist;
CREATE POLICY "Stores can view their waitlist"
ON public.waitlist
FOR ALL
USING (product_id IN (SELECT id FROM public.products WHERE store_id IN (SELECT id FROM public.stores WHERE auth_user_id = auth.uid())));

-- 4. BLINDAGEM DE CONVERSAS E CONTEXTO DO INSTAGRAM (CONVERSATIONS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Stores manage their conversations" ON public.conversations;
CREATE POLICY "Stores manage their conversations"
ON public.conversations
FOR ALL
USING (store_id IN (SELECT id FROM public.stores WHERE auth_user_id = auth.uid()));

-- 5. BLINDAGEM DE DADOS SENSÍVEIS DA LOJA (STORES)
-- Chaves de API Asaas, tokens Meta e senhas criptografadas NUNCA podem ser lidos publicamente.
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Stores can view and edit their own data" ON public.stores;
CREATE POLICY "Stores can view and edit their own data"
ON public.stores
FOR ALL
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

-- 6. CATÁLOGO PÚBLICO: Somente leitura de produtos ativos
-- Usuários anônimos NUNCA podem alterar preço, título ou estoque.
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read for available products" ON public.products;
CREATE POLICY "Public read for available products"
ON public.products
FOR SELECT
USING (status IN ('available', 'reserved', 'active'));

DROP POLICY IF EXISTS "Stores can manage their own products" ON public.products;
CREATE POLICY "Stores can manage their own products"
ON public.products
FOR ALL
USING (store_id IN (SELECT id FROM public.stores WHERE auth_user_id = auth.uid()))
WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE auth_user_id = auth.uid()));
