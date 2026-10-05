import { NextRequest, NextResponse } from 'next/server';
import { intelligentCatalogService } from '@/lib/catalog/intelligent-service';
import { ProductEntity } from '@/lib/catalog/intelligent-types';
import { clearServerCatalogStore } from '@/lib/catalog/storage';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get('clear') === 'true' || searchParams.get('wipe') === 'true') {
      intelligentCatalogService.clearAll();
      clearServerCatalogStore();
      return NextResponse.json({
        success: true,
        products: [],
        relations: [],
      });
    } else if (searchParams.get('seed') === 'true') {
      intelligentCatalogService.seedDemoFixtures();
      if (!global.__vitryneCatalogStore) global.__vitryneCatalogStore = {};
      if (!global.__vitryneCatalogUserCustomized) global.__vitryneCatalogUserCustomized = new Set();
      global.__vitryneCatalogStore['minha-loja'] = {
        ...(global.__vitryneCatalogStore['minha-loja'] || {}),
        slug: 'minha-loja',
        storeName: 'Minha Loja',
        templateChosen: true,
        isPublished: true,
        products: [
          {
            id: 'prod_blusa_curta_01',
            name: 'Blusa Feminina Manga Curta',
            description: 'Blusa feminina amarela confeccionada em viscose premium, caimento suave.',
            price: 89.9,
            category: 'Blusa',
            stock: 5,
            images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800'],
            sizes: ['P', 'M', 'G'],
            colors: ['amarelo'],
          },
        ],
      } as any;
      global.__vitryneCatalogUserCustomized.add('minha-loja');
    }
    const deleteMediaId = searchParams.get('deleteMediaId');
    if (deleteMediaId) {
      await intelligentCatalogService.deleteMediaByInstagramId(deleteMediaId);
    }
    const products = await intelligentCatalogService.listProducts();
    const relations = await intelligentCatalogService.listMediaRelations();

    return NextResponse.json({
      success: true,
      products,
      relations,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    intelligentCatalogService.clearAll();
    clearServerCatalogStore();
    return NextResponse.json({ success: true, message: 'Todos os dados e memória foram zerados com sucesso.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.title || !body.price_cents) {
      return NextResponse.json(
        { success: false, error: 'Título e preço são obrigatórios' },
        { status: 400 }
      );
    }

    const newProduct: ProductEntity = {
      id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      store_id: body.store_id || 'store_demo_vitryne',
      title: body.title,
      description: body.description || '',
      canonical_description: body.canonical_description || body.description || body.title,
      price_cents: Number(body.price_cents),
      is_unique_piece: Boolean(body.is_unique_piece),
      stock_quantity: Number(body.stock_quantity || 1),
      category: body.category || 'Geral',
      status: 'active',
      image_url: body.image_url || '',
      attributes: body.attributes || {},
      variants: body.variants || [
        { id: `var_${Date.now()}_unico`, product_id: '', name: 'Único', stock_quantity: Number(body.stock_quantity || 1) }
      ],
      images: body.image_url ? [
        {
          id: `img_${Date.now()}`,
          product_id: '',
          url: body.image_url,
          is_primary: true,
          source_type: 'catalog',
        }
      ] : [],
    };

    // Salva na store global
    global.__intelligentProductsStore = global.__intelligentProductsStore || [];
    global.__intelligentProductsStore.unshift(newProduct);

    // Se veio de uma sugestão de mídia do Instagram (suggested_new), atualiza a relação
    if (body.fromRelationId) {
      await intelligentCatalogService.confirmMediaProductMatch(
        body.fromRelationId,
        newProduct.id
      );
    }

    return NextResponse.json({
      success: true,
      product: newProduct,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
