import { NextRequest, NextResponse } from 'next/server';
import { intelligentCatalogService } from '@/lib/catalog/intelligent-service';
import { instagramClient } from '@/lib/instagram/client';
import { getValidAccessToken } from '@/lib/instagram/auth';
import { buildProductCleanUrl, getPublicAppUrl } from '@/lib/catalog/url-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId') || undefined;

    const requests = await intelligentCatalogService.listPriceConfirmationRequests(storeId);
    return NextResponse.json({
      success: true,
      requests,
      pendingCount: requests.filter((r) => r.status === 'pending').length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, productId, price, catalogSlug = 'minha-loja' } = body;

    if (!productId || typeof price !== 'number') {
      return NextResponse.json(
        { success: false, error: 'productId e price (número) são obrigatórios.' },
        { status: 400 }
      );
    }

    const priceCents = Math.round(price * 100);
    const result = await intelligentCatalogService.confirmPrice({
      requestId,
      productId,
      priceCents,
      catalogSlug,
    });

    // Se houver uma requisição pendente com buyerId, envia mensagem automática no Direct da cliente
    let dmDelivered = false;
    if (result.request?.buyer_id) {
      try {
        const token = getValidAccessToken();
        if (token) {
          const appUrl = getPublicAppUrl();
          const productLink = result.product
            ? buildProductCleanUrl(appUrl, catalogSlug, result.product)
            : `${appUrl}/${catalogSlug}`;

          const priceFormatted = (priceCents / 100).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          });

          const replyText = `Oi, ${result.request.buyer_username || 'tudo bem'}! ✨ Confirmado pela nossa equipe: o valor oficial é ${priceFormatted}!\n\nVocê já pode conferir todos os detalhes e garantir diretamente na nossa vitrine:\n${productLink}`;

          await instagramClient.sendDirectMessage({
            recipientId: result.request.buyer_id,
            messageText: replyText,
            accessToken: token,
          });
          dmDelivered = true;
          console.log(`📤 [Micro-Confirmação Direct] Mensagem enviada para @${result.request.buyer_username} com valor ${priceFormatted}!`);
        }
      } catch (dmErr: any) {
        console.warn('[Micro-Confirmação Direct Warn]', dmErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      product: result.product,
      request: result.request,
      dmDelivered,
      priceCents,
      formattedPrice: (priceCents / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
      message: `Preço de R$ ${price.toFixed(2)} confirmado com sucesso! A IA agora responderá automaticamente.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
