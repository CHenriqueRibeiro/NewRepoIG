import { NextRequest, NextResponse } from 'next/server';
import { getMetaOAuthUrl, getAppBaseUrl } from '@/lib/instagram/auth';

export async function GET(request: NextRequest) {
  const origin = getAppBaseUrl(request);
  try {
    const redirectUri = `${origin}/api/auth/instagram/callback`;
    const { url, configured } = getMetaOAuthUrl(redirectUri);

    if (!configured || !url) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('Credenciais do Instagram não configuradas no .env.local')}`
      );
    }

    return NextResponse.redirect(url);
  } catch (error: any) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message || 'Erro ao iniciar login com o Instagram')}`
    );
  }
}
