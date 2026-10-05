import { NextResponse } from 'next/server';
import { getActiveInstagramSession } from '@/lib/instagram/auth';
import { decryptAES256GCM } from '@/lib/crypto/encryption';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = getActiveInstagramSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Sem sessão ativa' }, { status: 400 });
    }

    const plainToken = decryptAES256GCM(session.accessTokenEncrypted);

    // 1. Tenta assinar no Instagram Graph API v21.0
    const igUrl = `https://graph.instagram.com/v21.0/me/subscribed_apps?subscribed_fields=comments,messages&access_token=${encodeURIComponent(
      plainToken
    )}`;

    const igRes = await fetch(igUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const igJson = await igRes.json();

    // 2. Consulta assinaturas ativas para conferir
    const checkRes = await fetch(
      `https://graph.instagram.com/v21.0/me/subscribed_apps?access_token=${encodeURIComponent(plainToken)}`
    );
    const checkJson = await checkRes.json();

    return NextResponse.json({
      success: true,
      subscribeResult: igJson,
      activeSubscriptions: checkJson,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
