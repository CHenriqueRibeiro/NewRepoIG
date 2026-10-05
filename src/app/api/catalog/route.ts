import { NextRequest, NextResponse } from 'next/server';
import { getServerCatalog, saveServerCatalog } from '@/lib/catalog/storage';
import { CatalogConfig } from '@/lib/catalog/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug') || undefined;
    const catalog = getServerCatalog(slug);
    return NextResponse.json({ success: true, catalog });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: CatalogConfig = await req.json();

    if (!body || !body.storeName) {
      return NextResponse.json(
        { error: 'Dados inválidos para o catálogo' },
        { status: 400 }
      );
    }

    // Garante que o slug é limpo e seguro para URL
    if (body.slug) {
      body.slug = body.slug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-_]/g, '-');
    } else {
      body.slug = 'minha-vitrine';
    }

    saveServerCatalog(body);

    return NextResponse.json({ success: true, catalog: body });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
