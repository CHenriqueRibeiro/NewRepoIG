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
