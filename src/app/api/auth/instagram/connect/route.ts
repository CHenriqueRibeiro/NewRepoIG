import { NextRequest, NextResponse } from 'next/server';
import {
  validateInstagramTokenWithMeta,
  setActiveInstagramSession,
  InstagramAccountProfile,
} from '@/lib/instagram/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, type, customHandle, customStoreName } = body;

    // 1. Conexão via Sandbox / Demonstração
    if (type === 'sandbox' || token === 'sandbox' || token === 'demo') {
      const sandboxAccount: InstagramAccountProfile = {
        id: 'ig_17841400000000001',
        username: customHandle ? customHandle.replace(/^@/, '') : 'vitryne.oficial',
        name: customStoreName || 'Vitryne Boutique',
        profilePictureUrl: '',
        accountType: 'BUSINESS',
        connectedAt: new Date().toISOString(),
        tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        isSandbox: true,
      };

      setActiveInstagramSession(sandboxAccount, 'mock_instagram_access_token_super_secure');

      return NextResponse.json({
        success: true,
        account: sandboxAccount,
        message: 'Conta de demonstração conectada com sucesso!',
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
