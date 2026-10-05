import { NextRequest, NextResponse } from 'next/server';
import { getMetaOAuthUrl, getAppBaseUrl } from '@/lib/instagram/auth';

export async function GET(request: NextRequest) {
  try {
    const origin = getAppBaseUrl(request);
    const redirectUri = `${origin}/api/auth/instagram/callback`;

    const { url, configured } = getMetaOAuthUrl(redirectUri);

    return NextResponse.json({
      success: true,
      configured,
      url,
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
