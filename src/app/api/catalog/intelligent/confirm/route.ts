import { NextRequest, NextResponse } from 'next/server';
import { intelligentCatalogService } from '@/lib/catalog/intelligent-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { relationId, productId } = body;

    if (!relationId || !productId) {
      return NextResponse.json(
        { success: false, error: 'relationId e productId são obrigatórios' },
        { status: 400 }
      );
    }

    // Confirmação e enriquecimento da memória visual do produto
    const updatedRelation = await intelligentCatalogService.confirmMediaProductMatch(
      relationId,
      productId
    );

    const product = await intelligentCatalogService.getProductById(productId);

    return NextResponse.json({
      success: true,
      message: `Mídia associada com sucesso ao produto "${product?.title}". Memória visual enriquecida!`,
      relation: updatedRelation,
      product,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
