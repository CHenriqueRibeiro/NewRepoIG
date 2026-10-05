import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeCodeForTokens,
  validateInstagramTokenWithMeta,
  setActiveInstagramSession,
  getAppBaseUrl,
} from '@/lib/instagram/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const origin = getAppBaseUrl(request);

  if (error) {
    console.error('[Meta OAuth Error]', error, errorDescription);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Código de autorização da Meta não encontrado.')}`
    );
  }

  try {
    const redirectUri = `${origin}/api/auth/instagram/callback`;
    const { accessToken } = await exchangeCodeForTokens(code, redirectUri);

    const validation = await validateInstagramTokenWithMeta(accessToken);
    if (!validation.isValid || !validation.account) {
      throw new Error(validation.error || 'Não foi possível obter dados da conta do Instagram');
    }

    setActiveInstagramSession(validation.account, accessToken);

    // Auto-assina a conta para receber webhooks de comentários e mensagens
    try {
      await fetch(
        `https://graph.instagram.com/v21.0/me/subscribed_apps?subscribed_fields=comments,messages&access_token=${encodeURIComponent(
          accessToken
        )}`,
        { method: 'POST' }
      );
      console.log('[Meta Webhook] Conta auto-assinada aos webhooks com sucesso!');
    } catch (subErr) {
      console.warn('[Meta Webhook Auto-Subscribe Error]', subErr);
    }

    return NextResponse.redirect(`${origin}/dashboard?connected=true`);
  } catch (err: any) {
    console.error('[Meta Token Exchange Error]', err);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(err.message || 'Falha na conexão com o Instagram')}`
    );
  }
}
