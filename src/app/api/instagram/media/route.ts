import { NextRequest, NextResponse } from 'next/server';
import { getActiveInstagramSession } from '@/lib/instagram/auth';
import { decryptAES256GCM } from '@/lib/crypto/encryption';
import { addLiveLog } from '@/lib/logger/live-logs';
import { getServerCatalog } from '@/lib/catalog/storage';
import { classifyOpportunitySemantically } from '@/lib/ai/opportunity-classifier';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const session = getActiveInstagramSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não conectado' }, { status: 400 });
    }

    const plainToken = decryptAES256GCM(session.accessTokenEncrypted);

    // 1. Perfil completo real
    const profileRes = await fetch(
      `https://graph.instagram.com/v21.0/me?fields=id,username,name,account_type,profile_picture_url,media_count&access_token=${encodeURIComponent(
        plainToken
      )}`,
      { cache: 'no-store' }
    );
    const profile = await profileRes.json();
    if (profile?.username && session?.account) {
      session.account.username = profile.username;
      if (profile.name) session.account.name = profile.name;
      if (profile.id) session.account.id = profile.id;
      if (profile.profile_picture_url) session.account.profilePictureUrl = profile.profile_picture_url;
    }

    // 2. Mídias reais publicadas com cache desabilitado
    let mediaList: any[] = [];
    try {
      const mediaRes = await fetch(
        `https://graph.instagram.com/v21.0/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,comments_count,like_count&limit=12&access_token=${encodeURIComponent(
          plainToken
        )}`,
        { cache: 'no-store' }
      );
      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        mediaList = mediaData.data || [];
      }
    } catch (e) {
      console.warn('Erro ao buscar mídias:', e);
    }

    // Calcula ticket médio dinâmico a partir do catálogo real da loja
    const activeCatalog = getServerCatalog();
    const catalogPrices = (activeCatalog.products || [])
      .map((p: any) => p.price_cents)
      .filter((pr: number) => typeof pr === 'number' && pr > 0);
    const dynamicBaseTicketCents =
      catalogPrices.length > 0
        ? Math.round(catalogPrices.reduce((a: number, b: number) => a + b, 0) / catalogPrices.length)
        : 12900;

    // 3. Comentários reais das mídias com classificação semântica vetorial
    let realComments: any[] = [];
    for (const media of mediaList.slice(0, 5)) {
      if (media.comments_count > 0) {
        try {
          const commentsRes = await fetch(
            `https://graph.instagram.com/v21.0/${media.id}/comments?fields=id,text,timestamp,username,like_count&access_token=${encodeURIComponent(
              plainToken
            )}`,
            { cache: 'no-store' }
          );
          if (commentsRes.ok) {
            const commData = await commentsRes.json();
            if (commData.data && commData.data.length > 0) {
              for (const c of commData.data) {
                const aiClassification = classifyOpportunitySemantically(
                  c.text || '',
                  dynamicBaseTicketCents
                );

                realComments.push({
                  ...c,
                  media_caption: media.caption,
                  media_permalink: media.permalink,
                  media_url: media.media_url || media.thumbnail_url,
                  aiClassification,
                });
              }
            }
          }
        } catch (err) {
          // silencioso
        }
      }
    }

    const currentHandle = profile?.username || session?.account?.username || 'instagram';

    addLiveLog(
      'META_API',
      'success',
      `Mídias do perfil @${currentHandle} sincronizadas: ${mediaList.length} publicações, ${realComments.length} comentários reais.`,
      {
        profileUsername: currentHandle,
        mediaCount: profile?.media_count || mediaList.length,
        totalFetched: mediaList.length,
        commentsLoaded: realComments.length,
      }
    );

    return NextResponse.json({
      success: true,
      profile,
      mediaCount: profile.media_count || mediaList.length,
      mediaList,
      realComments,
    });
  } catch (err: any) {
    addLiveLog('META_API', 'error', `Falha ao carregar mídias do Instagram: ${err.message}`);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
