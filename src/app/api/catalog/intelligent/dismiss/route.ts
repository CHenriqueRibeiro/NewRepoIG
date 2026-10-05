import { NextRequest, NextResponse } from 'next/server';
import { intelligentCatalogService } from '@/lib/catalog/intelligent-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { relationId } = body;

    if (!relationId) {
      return NextResponse.json(
        { success: false, error: 'relationId é obrigatório' },
        { status: 400 }
      );
    }

    const relation = (global.__intelligentRelationsStore || []).find((r) => r.id === relationId);
    if (relation) {
      relation.match_status = 'rejected';
      relation.match_reason = 'Marcado pelo lojista como conteúdo puramente institucional/informativo (não comercial).';
    }

    return NextResponse.json({
      success: true,
      message: 'Mídia marcada como conteúdo informativo e removida da fila de cadastro.',
      relation,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
