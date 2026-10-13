import { NextRequest, NextResponse } from 'next/server';
import { getMetaOAuthUrl, getFacebookDialogUrl, getAppBaseUrl } from '@/lib/instagram/auth';

export async function GET(request: NextRequest) {
  try {
    const origin = getAppBaseUrl(request);
    const redirectUri = `${origin}/api/auth/instagram/callback`;

    const { url, configured, vercelUrl } = getMetaOAuthUrl(redirectUri);
    const fbOAuth = getFacebookDialogUrl(redirectUri);

    return NextResponse.json({
      success: true,
      configured,
      url,
      vercelUrl,
      fbUrl: fbOAuth.url,
      redirectUri,
      appId: process.env.INSTAGRAM_APP_ID || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao gerar URL do Meta OAuth' },
      { status: 500 }
    );
  }
}
