import { NextRequest, NextResponse } from 'next/server';
import {
  parseExcelOrCsv,
  parseMarkdown,
  validateAndSanitizeProductRow,
  ImportValidationResult,
} from '@/lib/catalog/bulk-importer';
import { getServerCatalog, saveServerCatalog } from '@/lib/catalog/storage';
import { intelligentCatalogService } from '@/lib/catalog/intelligent-service';
import { ProductEntity } from '@/lib/catalog/intelligent-types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let validationResult: ImportValidationResult;
    let catalogSlug = 'minha-loja';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      catalogSlug = (formData.get('catalogSlug') as string) || 'minha-loja';
      const defaultCategory = (formData.get('defaultCategory') as string) || undefined;

      if (!file) {
        return NextResponse.json({ success: false, error: 'Nenhum arquivo enviado.' }, { status: 400 });
      }

      const buffer = await file.arrayBuffer();
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.md') || fileName.endsWith('.txt')) {
        const text = new TextDecoder('utf-8').decode(buffer);
        validationResult = parseMarkdown(text, defaultCategory);
      } else {
        validationResult = parseExcelOrCsv(buffer, defaultCategory);
      }
    } else {
      const body = await req.json();
      catalogSlug = body.catalogSlug || 'minha-loja';
      const defaultCategory = body.defaultCategory || undefined;

      if (body.markdownText) {
        validationResult = parseMarkdown(body.markdownText, defaultCategory);
      } else if (body.csvText) {
        validationResult = parseExcelOrCsv(body.csvText, defaultCategory);
      } else if (Array.isArray(body.products)) {
        const validProducts = [];
        const rejectedRows = [];
        let idx = 0;
        for (const item of body.products) {
          idx++;
          const { product, reasons } = validateAndSanitizeProductRow(item, idx, defaultCategory);
          if (product) validProducts.push(product);
          else rejectedRows.push({ rowIndex: idx, raw: item, reasons });
        }
        validationResult = {
          validProducts,
          rejectedRows,
          totalParsed: body.products.length,
        };
      } else {
        return NextResponse.json(
          { success: false, error: 'Formato não reconhecido. Envie um arquivo, csvText, markdownText ou lista de produtos.' },
          { status: 400 }
        );
      }
    }

    const { validProducts, rejectedRows, totalParsed } = validationResult;

    // Se nenhum produto for válido
    if (validProducts.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Nenhum item pôde ser importado pois todos os itens continham dados incompletos ou inválidos.',
        totalParsed,
        importedCount: 0,
        rejectedCount: rejectedRows.length,
        rejectedRows,
      }, { status: 422 });
    }

    // Persiste no catálogo da vitrine (getServerCatalog / saveServerCatalog)
    const activeCatalog = getServerCatalog(catalogSlug);
    activeCatalog.products = activeCatalog.products || [];

    // Adiciona os novos produtos no topo sem duplicar IDs
    const existingIds = new Set(activeCatalog.products.map((p) => p.id));
    const newlyAdded = validProducts.filter((p) => !existingIds.has(p.id));

    activeCatalog.products = [...newlyAdded, ...activeCatalog.products];

    // Atualiza tópicos/módulos caso haja novas categorias
    const existingTopics = new Set((activeCatalog.topics || []).map((t) => t.toLowerCase()));
    const newTopicsToAdd: string[] = [];

    for (const p of newlyAdded) {
      if (p.category && !existingTopics.has(p.category.toLowerCase())) {
        existingTopics.add(p.category.toLowerCase());
        newTopicsToAdd.push(p.category);
      }
    }

    if (newTopicsToAdd.length > 0) {
      activeCatalog.topics = [...(activeCatalog.topics || []), ...newTopicsToAdd];
    }

    saveServerCatalog(activeCatalog);

    // Também indexa no catálogo inteligente para a IA aprender imediatamente
    global.__intelligentProductsStore = global.__intelligentProductsStore || [];
    for (const p of newlyAdded) {
      const entity: ProductEntity = {
        id: p.id,
        store_id: 'store_demo_vitryne',
        title: p.name,
        description: p.description || '',
        canonical_description: `${p.name}, ${p.category}, valor ${p.price}`,
        price_cents: Math.round(p.price * 100),
        is_unique_piece: Boolean(p.isUniquePiece),
        stock_quantity: p.stock || 1,
        category: p.category,
        status: 'active',
        image_url: p.images?.[0] || '',
        attributes: {
          categoria: p.category.toLowerCase(),
          cor_principal: p.colors?.[0] || 'neutro',
        },
        variants: (p.sizes || ['Único']).map((s) => ({
          id: `var_${p.id}_${s}`,
          product_id: p.id,
          name: s,
          stock_quantity: Math.max(1, Math.floor((p.stock || 1) / (p.sizes?.length || 1))),
        })),
        images: (p.images || []).map((url, i) => ({
          id: `img_${p.id}_${i}`,
          product_id: p.id,
          url,
          is_primary: i === 0,
          source_type: 'catalog',
        })),
      };

      if (!global.__intelligentProductsStore.some((prod) => prod.id === entity.id)) {
        global.__intelligentProductsStore.unshift(entity);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${newlyAdded.length} produto(s) importado(s) com sucesso com ficha técnica completa!`,
      totalParsed,
      importedCount: newlyAdded.length,
      rejectedCount: rejectedRows.length,
      validProducts: newlyAdded,
      rejectedRows,
      updatedCatalogProductCount: activeCatalog.products.length,
    });
  } catch (error: any) {
    console.error('Erro na rota /api/catalog/import:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
