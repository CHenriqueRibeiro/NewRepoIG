import { NextRequest, NextResponse } from 'next/server';
import { jevAgentOrchestrator } from '@/lib/ai/orchestrator-router';
import { getServerCatalog, resolveActiveStoreIdentity } from '@/lib/catalog/storage';
import { getPublicAppUrl } from '@/lib/catalog/url-helpers';
import { getActiveInstagramSession, getValidAccessToken } from '@/lib/instagram/auth';
import { instagramClient } from '@/lib/instagram/client';
import { isTypeSafeConfigured, getTypeSafeApiKey } from '@/lib/ai/typesafe-jev-client';

/**
 * Endpoint da API: Orquestrador Multi-Agente com Decisão TypeSafe AI (Jev)
 * Rota: POST /api/ai/orchestrator
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      messageText,
      buyerUsername = 'Cliente',
      buyerId = 'client_default',
      storeId,
      storeName,
      catalogSlug,
      apiKey,
      storyUrl,
      storyMediaId,
    } = body;

    if (!messageText) {
      return NextResponse.json({ error: 'messageText é obrigatório' }, { status: 400 });
    }

    const session = getActiveInstagramSession();
    const token = getValidAccessToken();
    const storeProfile = await instagramClient.getStoreProfile(token);
    const instagramName = storeProfile?.name || session?.account?.name;
    const instagramHandle = storeProfile?.username || session?.account?.username || 'app_quota';

    const activeStore = resolveActiveStoreIdentity(session?.account);
    const activeCatalog = getServerCatalog(catalogSlug || activeStore.slug);

    const resolvedStoreName = (storeName && storeName !== 'Minha Loja')
      ? storeName
      : ((instagramName && instagramName !== 'Minha Loja')
        ? instagramName
        : (activeCatalog.storeName && activeCatalog.storeName !== 'Minha Loja' ? activeCatalog.storeName : 'Quota'));
    const resolvedSlug = catalogSlug || activeCatalog.slug || activeStore.slug || 'minha-loja';
    const resolvedStoreId = storeId || storeProfile?.id || activeStore.storeId || 'store_default';
    const publicAppUrl = getPublicAppUrl();

    const orchestration = await jevAgentOrchestrator.routeAndExecute(
      {
        storeId: resolvedStoreId,
        storeName: resolvedStoreName,
        storeHandle: instagramHandle,
        catalogSlug: resolvedSlug,
        buyerId,
        buyerUsername,
        messageText,
        appUrl: publicAppUrl,
        storyUrl,
        storyMediaId,
      },
      apiKey
    );

    return NextResponse.json({
      success: true,
      shouldReply: orchestration.shouldReply,
      selectedAgentType: orchestration.selectedAgentType,
      selectedAgentName: orchestration.selectedAgentName,
      confidence: orchestration.jevConfidence,
      routingSource: orchestration.jevRoutingSource,
      replyText: orchestration.executionResult?.replyText || '',
      executionResult: orchestration.executionResult,
      reason: orchestration.reason,
      debug: {
        isConfigured: isTypeSafeConfigured(apiKey),
        hasKey: Boolean(getTypeSafeApiKey()),
      },
    });
  } catch (err: any) {
    console.error('❌ [API /api/ai/orchestrator Erro]:', err);
    return NextResponse.json(
      { error: err.message || 'Erro ao orquestrar agentes com TypeSafe Jev' },
      { status: 500 }
    );
  }
}
