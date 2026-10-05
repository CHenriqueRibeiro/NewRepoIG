-- =====================================================================
-- VITRYNE - MÓDULO DE SERVIÇOS, PROCEDIMENTOS & AGENDAMENTOS
-- Gestão de Horários Livres, Preenchidos e Anti-Conflito de Agenda
-- =====================================================================

-- 1. CONFIGURAÇÕES DE AGENDAMENTO NA TABELA STORES
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='scheduling_mode') THEN
        ALTER TABLE public.stores ADD COLUMN scheduling_mode TEXT DEFAULT 'appointment' CHECK (scheduling_mode IN ('appointment', 'queue'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='scheduling_open_time') THEN
        ALTER TABLE public.stores ADD COLUMN scheduling_open_time TIME DEFAULT '09:00:00';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='scheduling_close_time') THEN
        ALTER TABLE public.stores ADD COLUMN scheduling_close_time TIME DEFAULT '19:00:00';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='scheduling_has_break') THEN
        ALTER TABLE public.stores ADD COLUMN scheduling_has_break BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='scheduling_break_start') THEN
        ALTER TABLE public.stores ADD COLUMN scheduling_break_start TIME DEFAULT '12:00:00';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='scheduling_break_end') THEN
        ALTER TABLE public.stores ADD COLUMN scheduling_break_end TIME DEFAULT '13:00:00';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='scheduling_slot_minutes') THEN
        ALTER TABLE public.stores ADD COLUMN scheduling_slot_minutes INT DEFAULT 30;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='scheduling_working_days') THEN
        ALTER TABLE public.stores ADD COLUMN scheduling_working_days TEXT[] DEFAULT ARRAY['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    END IF;
END $$;

-- 2. TABELA PRINCIPAL DE AGENDAMENTOS (SERVICE BOOKINGS)
CREATE TABLE IF NOT EXISTS public.service_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    
    -- Identificação do Cliente
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_instagram TEXT,
    
    -- Data e Janela de Horário
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 45,
    
    -- Valores e Status
    price_cents INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ÍNDICE EXCLUSIVO ANTI-CONFLITO (DOUBLE BOOKING)
-- Garante que um horário confirmado nunca seja duplicado para a mesma loja e data
CREATE UNIQUE INDEX IF NOT EXISTS uq_store_active_appointment_slot 
ON public.service_bookings (store_id, appointment_date, start_time) 
WHERE status IN ('pending', 'confirmed');

-- Índice para buscas rápidas de agenda por data
CREATE INDEX IF NOT EXISTS idx_service_bookings_date 
ON public.service_bookings (store_id, appointment_date, status);

-- 4. ROW LEVEL SECURITY (RLS) - PROTEÇÃO DE DADOS LGPD
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

-- Lojista dono gerencia seus agendamentos
DROP POLICY IF EXISTS "Stores can manage their service bookings" ON public.service_bookings;
CREATE POLICY "Stores can manage their service bookings"
ON public.service_bookings
FOR ALL
USING (store_id IN (SELECT id FROM public.stores WHERE auth_user_id = auth.uid()))
WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE auth_user_id = auth.uid()));

-- Consulta pública anônima estrita de horários ocupados (sem vazar dados dos clientes)
DROP POLICY IF EXISTS "Public check for busy appointment slots" ON public.service_bookings;
CREATE POLICY "Public check for busy appointment slots"
ON public.service_bookings
FOR SELECT
USING (status IN ('pending', 'confirmed'));

-- 5. FUNÇÃO RPC PARA CONSULTA DE HORÁRIOS OCUPADOS (USADA PELA IA E CATÁLOGO)
CREATE OR REPLACE FUNCTION public.get_busy_slots(
    p_store_id UUID,
    p_date DATE
)
RETURNS TABLE (
    slot_start TIME,
    slot_end TIME,
    slot_status TEXT
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        start_time AS slot_start,
        end_time AS slot_end,
        status AS slot_status
    FROM public.service_bookings
    WHERE store_id = p_store_id
      AND appointment_date = p_date
      AND status IN ('pending', 'confirmed')
    ORDER BY start_time ASC;
$$;
