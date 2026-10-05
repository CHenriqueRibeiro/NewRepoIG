import { NextRequest, NextResponse } from 'next/server';
import { processCustomerMessage } from '@/lib/ai/customer-agent';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messageText = 'Tem tamanho M dessa blusa amarela?',
      buyerUsername = 'cliente_mariana',
      buyerId = 'buyer_test_123',
      storyUrl,
      storyMediaId,
    } = body;

    const result = await processCustomerMessage({
      storeId: body.storeId || 'store_demo_vitryne',
      storeName: body.storeName || 'Vitryne Boutique',
      catalogSlug: body.catalogSlug || 'minha-loja',
      buyerId,
      buyerUsername,
      messageText,
      storyUrl,
      storyMediaId,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
