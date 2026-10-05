import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';

export const isSupabaseConfigured =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project') &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('your-supabase');

// Cliente público para o navegador (restrito estritamente pelas políticas de Row Level Security RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Cliente com privilégios administrativos (Service Role).
 * NUNCA pode ser chamado ou vazado para o navegador do cliente.
 */
export function getServiceRoleSupabase() {
  if (typeof window !== 'undefined') {
    throw new Error('VIOLAÇÃO DE SEGURANÇA: getServiceRoleSupabase nunca pode ser executado no navegador!');
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada no ambiente seguro do servidor.');
  }
  return createClient(supabaseUrl, serviceKey);
}

/**
 * Retorna o cliente seguro do servidor (prioriza Service Role para ultrapassar RLS em operações internas).
 */
export function getServerSupabase() {
  if (typeof window === 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      return getServiceRoleSupabase();
    } catch {
      // fallback
    }
  }
  return supabase;
}

/**
 * Garante que a loja está cadastrada na tabela public.stores do Supabase.
 * Retorna o UUID da loja para relacionamentos de chaves estrangeiras.
 */
export async function ensureStoreInSupabase(account: {
  id?: string;
  name?: string;
  username?: string;
}): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const client = getServerSupabase();
  const rawId = account.id || 'ig_default_account';
  const cleanUsername = account.username?.replace(/^@/, '') || 'instagram';
  const storeName = account.name || cleanUsername || 'Quota';

  try {
    const { data: existing } = await client
      .from('stores')
      .select('id')
      .or(`instagram_user_id.eq.${rawId},instagram_username.eq.${cleanUsername}`)
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      return existing.id;
    }

    const { data: inserted, error } = await client
      .from('stores')
      .upsert(
        {
          store_name: storeName,
          instagram_username: cleanUsername,
          instagram_user_id: rawId,
          ai_mode: 'total_24_7',
        },
        { onConflict: 'instagram_user_id' }
      )
      .select('id')
      .single();

    if (inserted?.id) {
      return inserted.id;
    }
    if (error) {
      console.warn('[Supabase ensureStore Error]:', error.message);
    }
  } catch (err: any) {
    console.warn('[Supabase ensureStore Exception]:', err.message);
  }
  return null;
}

