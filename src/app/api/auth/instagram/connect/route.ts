import { NextRequest, NextResponse } from 'next/server';
import {
  validateInstagramTokenWithMeta,
  setActiveInstagramSession,
  InstagramAccountProfile,
} from '@/lib/instagram/auth';
import { ensureStoreInSupabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, type, customHandle, customStoreName } = body;

    // 1. Conexão via Login Direto / Demonstração sem bloqueios da Meta
    if (type === 'sandbox' || type === 'direct' || token === 'sandbox' || token === 'demo' || !token) {
      const cleanHandle = customHandle ? customHandle.replace(/^@/, '') : 'vitryne.oficial';
      const storeName = customStoreName?.trim() || cleanHandle;

      const directAccount: InstagramAccountProfile = {
        id: 'ig_' + Math.floor(100000000000000 + Math.random() * 900000000000000),
        username: cleanHandle,
        name: storeName,
        profilePictureUrl: '',
        accountType: 'BUSINESS',
        connectedAt: new Date().toISOString(),
        tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        isSandbox: true,
      };

      setActiveInstagramSession(directAccount, 'mock_instagram_access_token_super_secure');

      try {
        await ensureStoreInSupabase(directAccount);
      } catch (storeErr) {
        console.warn('[Supabase Store Sync Warn]:', storeErr);
      }

      return NextResponse.json({
        success: true,
        account: directAccount,
        message: `Loja @${cleanHandle} conectada com sucesso!`,
      });
    }

    // 2. Conexão com Token Real da Meta Graph API
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Por favor, informe um token de acesso válido da Meta Graph API.' },
        { status: 400 }
      );
    }

    const cleanToken = token.trim();

    // Validação ao vivo contra a Meta Graph API (/me)
    const validation = await validateInstagramTokenWithMeta(cleanToken);

    if (!validation.isValid || !validation.account) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error || 'Token inválido ou sem permissões para gerenciar mensagens do Instagram.',
          latencyMs: validation.latencyMs,
        },
        { status: 400 }
      );
    }

    // Se fornecido custom handle para complementar
    if (customHandle && validation.account.isSandbox) {
      validation.account.username = customHandle.replace(/^@/, '');
    }

    setActiveInstagramSession(validation.account, cleanToken);

    return NextResponse.json({
      success: true,
      account: validation.account,
      latencyMs: validation.latencyMs,
      message: `Conta @${validation.account.username} conectada com sucesso!`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao processar conexão com Instagram' },
      { status: 500 }
    );
  }
}
