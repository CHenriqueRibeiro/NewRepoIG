import { NextRequest, NextResponse } from 'next/server';
import { getServerCatalog } from '@/lib/catalog/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const catalog = getServerCatalog(slug);

    if (!catalog) {
      return NextResponse.json(
        { error: 'Catálogo não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, catalog });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
